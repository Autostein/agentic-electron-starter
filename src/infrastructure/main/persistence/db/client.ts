import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DATABASE_FILE_NAME = 'agentic-electron-starter.db';
const DEV_MIGRATIONS_PATH = path.join(process.cwd(), 'drizzle');
const PACKAGED_MIGRATIONS_DIR_NAME = 'drizzle';
const MIGRATIONS_TABLE_NAME = '__agentic_migrations';
const DRIZZLE_MIGRATIONS_TABLE_NAME = '__drizzle_migrations';
const STATEMENT_BREAKPOINT = '--> statement-breakpoint';

export type MainDatabaseInitOptions = {
  userDataPath: string;
  resourcesPath: string;
  isPackaged: boolean;
};

export type MainDatabaseRuntime = {
  dbPath: string;
  migrationsPath: string;
  db: DatabaseSync;
};

let mainDatabaseRuntime: MainDatabaseRuntime | null = null;

export function initializeMainDatabase(options: MainDatabaseInitOptions): MainDatabaseRuntime {
  if (mainDatabaseRuntime) {
    return mainDatabaseRuntime;
  }

  fs.mkdirSync(options.userDataPath, { recursive: true });
  const dbPath = path.join(options.userDataPath, DATABASE_FILE_NAME);
  const migrationsPath = resolveMigrationsPath(options);
  const db = new DatabaseSync(dbPath, { timeout: 5000 });

  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  runMigrations(db, migrationsPath);

  mainDatabaseRuntime = {
    dbPath,
    migrationsPath,
    db,
  };

  return mainDatabaseRuntime;
}

export function getMainDatabase(): DatabaseSync {
  if (!mainDatabaseRuntime) {
    throw new Error('Main database is not initialized.');
  }

  return mainDatabaseRuntime.db;
}

export function closeMainDatabase(): void {
  if (!mainDatabaseRuntime) {
    return;
  }

  mainDatabaseRuntime.db.close();
  mainDatabaseRuntime = null;
}

function resolveMigrationsPath(options: MainDatabaseInitOptions): string {
  const migrationsPath = options.isPackaged
    ? path.join(options.resourcesPath, PACKAGED_MIGRATIONS_DIR_NAME)
    : DEV_MIGRATIONS_PATH;

  if (!fs.existsSync(migrationsPath)) {
    throw new Error(`Missing migrations folder at "${migrationsPath}".`);
  }

  return migrationsPath;
}

function runMigrations(db: DatabaseSync, migrationsPath: string): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE_NAME} (
      name TEXT PRIMARY KEY NOT NULL,
      applied_at INTEGER NOT NULL
    )
  `);

  const appliedRows = db.prepare(`SELECT name FROM ${MIGRATIONS_TABLE_NAME}`).all() as Array<{
    name: string;
  }>;
  const appliedNames = new Set(appliedRows.map((row) => row.name));
  const migrationFiles = fs
    .readdirSync(migrationsPath)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort();

  seedAppliedMigrationsFromDrizzle(db, appliedNames, migrationFiles);

  for (const fileName of migrationFiles) {
    if (appliedNames.has(fileName)) {
      continue;
    }

    const migrationSql = fs.readFileSync(path.join(migrationsPath, fileName), 'utf8');
    const statements = migrationSql
      .split(STATEMENT_BREAKPOINT)
      .map((statement) => statement.trim())
      .filter(Boolean);

    db.exec('BEGIN');

    try {
      for (const statement of statements) {
        db.exec(statement);
      }

      db.prepare(`INSERT INTO ${MIGRATIONS_TABLE_NAME} (name, applied_at) VALUES (?, ?)`).run(
        fileName,
        Date.now(),
      );
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
}

function seedAppliedMigrationsFromDrizzle(
  db: DatabaseSync,
  appliedNames: Set<string>,
  migrationFiles: string[],
): void {
  if (appliedNames.size > 0 || !tableExists(db, DRIZZLE_MIGRATIONS_TABLE_NAME)) {
    return;
  }

  const drizzleMigrationCount = db
    .prepare(`SELECT COUNT(*) AS count FROM ${DRIZZLE_MIGRATIONS_TABLE_NAME}`)
    .get() as { count: number };

  for (const fileName of migrationFiles.slice(0, drizzleMigrationCount.count)) {
    db.prepare(`INSERT INTO ${MIGRATIONS_TABLE_NAME} (name, applied_at) VALUES (?, ?)`).run(
      fileName,
      Date.now(),
    );
    appliedNames.add(fileName);
  }
}

function tableExists(db: DatabaseSync, tableName: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName);

  return row !== undefined;
}
