import express from "express";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Firebase
const serviceAccountPath = path.join(__dirname, "firebase-key.json");
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const subsSnapshot = await db.collection("subscriptions").get();
      const totalUsers = subsSnapshot.size;

      const activePlans: { [key: string]: number } = {};
      let totalGenerations = 0;

      subsSnapshot.forEach(doc => {
        const data = doc.data();
        const plan = data.plan || "free";
        activePlans[plan] = (activePlans[plan] || 0) + 1;
        totalGenerations += (data.generations_count || 0);
      });

      const activePlansArray = Object.entries(activePlans).map(([plan, count]) => ({ plan, count }));

      res.json({
        totalUsers,
        activePlans: activePlansArray,
        totalGenerations,
        apiStatus: process.env.GEMINI_API_KEY ? "Connected" : "Disconnected"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/subscriptions", async (req, res) => {
    try {
      const snapshot = await db.collection("subscriptions").orderBy("created_at", "desc").get();
      const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(subs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  app.post("/api/admin/subscriptions/toggle", async (req, res) => {
    try {
      const { id, status } = req.body;
      await db.collection("subscriptions").doc(id).update({ status });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle subscription" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
