const Database = eval('require')('better-sqlite3');
import path from 'node:path';
import { app } from 'electron';

// Save database in user data folder so it persists across updates
const dbPath = path.join(app.getPath('userData'), 'openllmdesktop.db');
const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    title TEXT,
    createdAt INTEGER
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionId TEXT,
    role TEXT,
    content TEXT,
    createdAt INTEGER,
    images TEXT,
    model TEXT,
    FOREIGN KEY(sessionId) REFERENCES sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS document_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionId TEXT,
    text TEXT,
    embedding TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

try {
  db.exec('ALTER TABLE messages ADD COLUMN images TEXT;');
} catch (e) {
  // Column likely already exists
}

try {
  db.exec('ALTER TABLE messages ADD COLUMN model TEXT;');
} catch (e) {
  // Column likely already exists
}

export const DB = {
  createSession: (id: string, title: string) => {
    const stmt = db.prepare('INSERT INTO sessions (id, title, createdAt) VALUES (?, ?, ?)');
    stmt.run(id, title, Date.now());
  },
  
  getSessions: () => {
    return db.prepare('SELECT * FROM sessions ORDER BY createdAt DESC').all();
  },

  saveMessage: (sessionId: string, role: string, content: string, images?: string[], model?: string) => {
    const stmt = db.prepare('INSERT INTO messages (sessionId, role, content, createdAt, images, model) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(sessionId, role, content, Date.now(), images ? JSON.stringify(images) : null, model || null);
  },

  getMessages: (sessionId: string) => {
    const rows: any[] = db.prepare('SELECT role, content, images, model FROM messages WHERE sessionId = ? ORDER BY createdAt ASC').all(sessionId);
    return rows.map(r => ({
      ...r,
      images: r.images ? JSON.parse(r.images) : undefined
    }));
  },

  deleteSession: (id: string) => {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  },

  renameSession: (id: string, title: string) => {
    db.prepare('UPDATE sessions SET title = ? WHERE id = ?').run(title, id);
  },

  deleteLastAssistantMessage: (sessionId: string) => {
    db.prepare(`
      DELETE FROM messages 
      WHERE id = (
        SELECT id FROM messages 
        WHERE sessionId = ? 
        ORDER BY createdAt DESC 
        LIMIT 1
      ) AND role = 'assistant'
    `).run(sessionId);
  },

  truncateSessionMessages: (sessionId: string, keepCount: number) => {
    db.prepare(`
      DELETE FROM messages 
      WHERE id IN (
        SELECT id FROM messages 
        WHERE sessionId = ? 
        ORDER BY createdAt ASC 
        LIMIT -1 OFFSET ?
      )
    `).run(sessionId, keepCount);
  },

  getSettings: () => {
    const rows: any[] = db.prepare('SELECT * FROM settings').all();
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  },

  saveSettings: (settings: Record<string, string>) => {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    const transaction = db.transaction((settingsObj: Record<string, string>) => {
      for (const [key, value] of Object.entries(settingsObj)) {
        stmt.run(key, String(value));
      }
    });
    transaction(settings);
  },

  saveDocumentChunk: (sessionId: string, text: string, embedding: number[]) => {
    const stmt = db.prepare('INSERT INTO document_chunks (sessionId, text, embedding) VALUES (?, ?, ?)');
    stmt.run(sessionId, text, JSON.stringify(embedding));
  },

  getDocumentChunks: (sessionId: string) => {
    const rows: any[] = db.prepare('SELECT text, embedding FROM document_chunks WHERE sessionId = ?').all(sessionId);
    return rows.map(r => ({
      text: r.text,
      embedding: JSON.parse(r.embedding)
    }));
  }
};
