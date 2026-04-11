import Database from "@tauri-apps/plugin-sql";
import { MIGRATIONS } from "./schema";
import { parseBooleanSetting } from "./settings-utils";

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;
  try {
    db = await Database.load("sqlite:ipharma.db");
    await runMigrations(db);
    return db;
  } catch (err) {
    db = null;
    throw new Error(
      `Failed to open database: ${err instanceof Error ? err.message : err}`,
    );
  }
}

async function runMigrations(database: Database): Promise<void> {
  await database.execute(
    "CREATE TABLE IF NOT EXISTS schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
  );

  const meta = await database.select<{ value: string }[]>(
    "SELECT value FROM schema_meta WHERE key = 'version'",
  );

  if (meta.length === 0) {
    await database.execute(
      "INSERT INTO schema_meta (key, value) VALUES ('version', '0')",
    );
  }

  let currentVersion = Number(meta[0]?.value ?? "0");
  if (!Number.isFinite(currentVersion) || currentVersion < 0) {
    currentVersion = 0;
  }

  const migrationsToRun = MIGRATIONS.filter(
    (migration) => migration.version > currentVersion,
  ).sort((a, b) => a.version - b.version);

  for (const migration of migrationsToRun) {
    for (const statement of migration.statements) {
      await database.execute(statement);
    }
    await database.execute(
      "UPDATE schema_meta SET value = $1 WHERE key = 'version'",
      [String(migration.version)],
    );
    currentVersion = migration.version;
  }
}

// --- App Settings ---
export async function getSetting(key: string): Promise<string | null> {
  const database = await getDb();
  const rows = await database.select<{ value: string }[]>(
    "SELECT value FROM app_settings WHERE key = $1 LIMIT 1",
    [key],
  );
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = await getDb();
  await database.execute(
    `INSERT INTO app_settings (key, value, updatedAt)
     VALUES ($1, $2, $3)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`,
    [key, value, new Date().toISOString()],
  );
}

export async function getBooleanSetting(
  key: string,
  defaultValue: boolean,
): Promise<boolean> {
  const value = await getSetting(key);
  return parseBooleanSetting(value, defaultValue);
}
