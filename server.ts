import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("studio.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    plan TEXT DEFAULT 'free',
    status TEXT DEFAULT 'active',
    generations_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/admin/stats", (req, res) => {
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM subscriptions").get() as any;
    const activePlans = db.prepare("SELECT plan, COUNT(*) as count FROM subscriptions GROUP BY plan").all();
    const totalGenerations = db.prepare("SELECT SUM(generations_count) as total FROM subscriptions").get() as any;

    res.json({
      totalUsers: totalUsers.count,
      activePlans,
      totalGenerations: totalGenerations.total || 0,
      apiStatus: process.env.GEMINI_API_KEY ? "Connected" : "Disconnected"
    });
  });

  app.get("/api/admin/subscriptions", (req, res) => {
    const subs = db.prepare("SELECT * FROM subscriptions ORDER BY created_at DESC").all();
    res.json(subs);
  });

  app.post("/api/admin/subscriptions/toggle", (req, res) => {
    const { id, status } = req.body;
    db.prepare("UPDATE subscriptions SET status = ? WHERE id = ?").run(status, id);
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
