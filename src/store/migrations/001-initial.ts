import type { DatabaseSync } from 'node:sqlite';

export function up(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE modules (id TEXT PRIMARY KEY NOT NULL, json TEXT NOT NULL);
    CREATE TABLE courses (id TEXT PRIMARY KEY NOT NULL, moduleId TEXT NOT NULL, json TEXT NOT NULL);
    CREATE TABLE assessments (id TEXT PRIMARY KEY NOT NULL, courseId TEXT NOT NULL, json TEXT NOT NULL);
    CREATE TABLE source_items (id TEXT PRIMARY KEY NOT NULL, platform TEXT NOT NULL, externalId TEXT NOT NULL, courseId TEXT, json TEXT NOT NULL);
    CREATE TABLE tasks (id TEXT PRIMARY KEY NOT NULL, moduleId TEXT NOT NULL, courseId TEXT, assessmentId TEXT, json TEXT NOT NULL);
    CREATE TABLE runs (id TEXT PRIMARY KEY NOT NULL, command TEXT NOT NULL, startedAt TEXT NOT NULL, json TEXT NOT NULL);
    CREATE TABLE changes (seq INTEGER PRIMARY KEY, entity TEXT NOT NULL, entityId TEXT NOT NULL, at TEXT NOT NULL, json TEXT NOT NULL);
  `);
}
