import { Database } from "bun:sqlite";
import { join } from "path";

const dbPath = join(import.meta.dir, "sessions.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions_meta (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    first_question TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )
`);

export function saveSessionMeta(sessionId: string, firstQuestion: string, filePath: string) {
  const id = `${Date.now()}_${sessionId}`;
  const stmt = db.prepare(`
    INSERT INTO sessions_meta (id, session_id, first_question, file_path, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, sessionId, firstQuestion, filePath, Date.now());
}

export function getAllSessions() {
  const stmt = db.prepare(`
    SELECT id, session_id, first_question, file_path, created_at
    FROM sessions_meta
    ORDER BY created_at DESC
  `);
  return stmt.all();
}
