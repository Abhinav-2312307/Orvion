import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'orvion.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('employee', 'manager', 'admin')),
      department TEXT NOT NULL DEFAULT 'General',
      manager_id TEXT,
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (manager_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS goal_cycles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      year INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'closed', 'draft')),
      goal_window_start TEXT,
      goal_window_end TEXT,
      q1_start TEXT,
      q1_end TEXT,
      q2_start TEXT,
      q2_end TEXT,
      q3_start TEXT,
      q3_end TEXT,
      q4_start TEXT,
      q4_end TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS goal_sheets (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      cycle_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'locked', 'returned')),
      submitted_at TEXT,
      approved_at TEXT,
      approved_by TEXT,
      return_comment TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (employee_id) REFERENCES users(id),
      FOREIGN KEY (cycle_id) REFERENCES goal_cycles(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      sheet_id TEXT NOT NULL,
      thrust_area TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      uom_type TEXT NOT NULL CHECK(uom_type IN ('numeric_min', 'numeric_max', 'percentage_min', 'percentage_max', 'timeline', 'zero')),
      target_value REAL,
      target_date TEXT,
      weightage INTEGER NOT NULL CHECK(weightage >= 10),
      is_shared INTEGER DEFAULT 0,
      shared_from TEXT,
      shared_owner_id TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (sheet_id) REFERENCES goal_sheets(id) ON DELETE CASCADE,
      FOREIGN KEY (shared_from) REFERENCES goals(id),
      FOREIGN KEY (shared_owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      quarter TEXT NOT NULL CHECK(quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
      actual_value REAL,
      actual_date TEXT,
      status TEXT NOT NULL DEFAULT 'not_started' CHECK(status IN ('not_started', 'on_track', 'completed')),
      progress_score REAL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now')),
      updated_by TEXT,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
      FOREIGN KEY (updated_by) REFERENCES users(id),
      UNIQUE(goal_id, quarter)
    );

    CREATE TABLE IF NOT EXISTS check_ins (
      id TEXT PRIMARY KEY,
      sheet_id TEXT NOT NULL,
      quarter TEXT NOT NULL CHECK(quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
      manager_id TEXT NOT NULL,
      comment TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (sheet_id) REFERENCES goal_sheets(id),
      FOREIGN KEY (manager_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      action TEXT NOT NULL,
      field_name TEXT,
      old_value TEXT,
      new_value TEXT,
      changed_by TEXT NOT NULL,
      changed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

export default getDb;
