import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes Mock for admin panel since backend is removed
  app.get("/api/admin/stats", async (req, res) => {
    res.json({
      totalUsers: 0,
      activePlans: [],
      totalGenerations: 0,
      apiStatus: "Disconnected",
    });
  });

  app.get("/api/admin/subscriptions", async (req, res) => {
    res.json([]);
  });

  app.post("/api/admin/subscriptions/toggle", async (req, res) => {
    res.json({ success: true });
  });

  app.get("/api/admin/settings", async (req, res) => {
    res.json({ gemini_api_key: "" });
  });

  app.post("/api/admin/settings/update", async (req, res) => {
    res.json({ success: true });
  });

  app.get("/api/admin/packages", async (req, res) => {
    res.json([]);
  });

  app.post("/api/admin/packages/add", async (req, res) => {
    res.json({ success: true });
  });

  app.post("/api/admin/packages/delete", async (req, res) => {
    res.json({ success: true });
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
