import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = new Database(path.join(__dirname, 'telepromptpi.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS transcripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migrate: drop user_id column if it exists (from old auth-based schema)
const cols = db.pragma('table_info(transcripts)');
if (cols.some((c) => c.name === 'user_id')) {
  db.exec(`
    PRAGMA foreign_keys = OFF;
    CREATE TABLE transcripts_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO transcripts_new (id, title, filename, original_name, created_at)
      SELECT id, title, filename, original_name, created_at FROM transcripts;
    DROP TABLE transcripts;
    ALTER TABLE transcripts_new RENAME TO transcripts;
    PRAGMA foreign_keys = ON;
  `);
}

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export default db;
