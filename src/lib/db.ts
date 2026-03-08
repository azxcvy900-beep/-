import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

// Define DB file path. In serverless environments (like Vercel), the root directory is read-only.
// We use the OS temp directory (e.g., /tmp) if running in production, to prevent read-only errors.
const isProd = process.env.NODE_ENV === 'production';
const dbDir = isProd ? os.tmpdir() : process.cwd();
const dbPath = path.join(dbDir, 'sqlite.db');

// Initialize the database
const db = new Database(dbPath, { verbose: console.log });

// Create necessary tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    credits INTEGER DEFAULT 9999,
    plan TEXT DEFAULT 'trial',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    gemini_api_key TEXT DEFAULT ''
  );
`);

// Insert default settings row if it doesn't exist
const settingsCheck = db.prepare('SELECT count(*) as count FROM settings WHERE id = ?').get('global') as { count: number };
if (settingsCheck.count === 0) {
  db.prepare('INSERT INTO settings (id, gemini_api_key) VALUES (?, ?)').run('global', '');
}

export default db;
