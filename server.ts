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

// Seed initial data if empty
async function seedDatabase() {
  const settingsDoc = await db.collection("system").doc("settings").get();
  if (!settingsDoc.exists) {
    await db.collection("system").doc("settings").set({
      gemini_api_key: process.env.GEMINI_API_KEY || "",
      maintenance_mode: false
    });
  }

  const packagesSnapshot = await db.collection("packages").get();
  if (packagesSnapshot.empty) {
    const defaultPackages = [
      { name: "Free", price: 0, limit: 10, created_at: new Date().toISOString() },
      { name: "Premium", price: 29, limit: 1000, created_at: new Date().toISOString() }
    ];
    for (const pkg of defaultPackages) {
      await db.collection("packages").add(pkg);
    }
  }
}

seedDatabase().catch(console.error);

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
      const settingsDoc = await db.collection("system").doc("settings").get();
      const currentSettings = settingsDoc.exists ? settingsDoc.data() : { gemini_api_key: "" };

      res.json({
        totalUsers,
        activePlans: activePlansArray,
        totalGenerations,
        apiStatus: currentSettings?.gemini_api_key ? "Connected" : "Disconnected"
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

  // Settings APIs
  app.get("/api/admin/settings", async (req, res) => {
    try {
      const doc = await db.collection("system").doc("settings").get();
      res.json(doc.exists ? doc.data() : { gemini_api_key: "" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/admin/settings/update", async (req, res) => {
    try {
      const settings = req.body;
      await db.collection("system").doc("settings").set(settings, { merge: true });
      // Update environment variable for immediate effect if needed (cautionary)
      if (settings.gemini_api_key) process.env.GEMINI_API_KEY = settings.gemini_api_key;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Packages APIs
  app.get("/api/admin/packages", async (req, res) => {
    try {
      const snapshot = await db.collection("packages").get();
      const packages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(packages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch packages" });
    }
  });

  app.post("/api/admin/packages/add", async (req, res) => {
    try {
      const pkg = req.body;
      await db.collection("packages").add({ ...pkg, created_at: new Date().toISOString() });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to add package" });
    }
  });

  app.post("/api/admin/packages/delete", async (req, res) => {
    try {
      const { id } = req.body;
      await db.collection("packages").doc(id).delete();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete package" });
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
