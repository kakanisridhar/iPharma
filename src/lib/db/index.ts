import Database from "@tauri-apps/plugin-sql";
import { MIGRATIONS } from "./schema";
import { parseBooleanSetting } from "./settings-utils";
import type {
  ProductBatchType,
  ProductType,
  SyncProductsResponse,
} from "@/types/products";
import {
  warn,
  debug,
  trace,
  info,
  error,
  attachConsole,
  attachLogger,
} from "@tauri-apps/plugin-log";
import { SYNC_PRODUCTS_LAST_CHANGE_ID } from "@/config/vars";

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;
  try {
    db = await Database.load("sqlite:ipharma.db", {
      idleTimeoutSecs: 600,
    });
    info("Database opened successfully");
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
  info("runMigrations started");

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

async function withTransaction(
  db: Database,
  fn: (db: Database) => Promise<any>,
) {
  try {
    await db.execute("BEGIN");
    const result = await fn(db);
    await db.execute("COMMIT");
    return result;
  } catch (err) {
    await db.execute("ROLLBACK");
    throw err;
  }
}

// --- App Settings ---
export async function getSetting(key: string): Promise<string | null> {
  const database = await getDb();
  return await internalGetSetting(database, key);
}

async function internalGetSetting(
  database: Database,
  key: string,
): Promise<string | null> {
  info("internalGetSetting");

  const rows = await database.select<{ value: string }[]>(
    "SELECT value FROM app_settings WHERE key = $1 LIMIT 1",
    [key],
  );
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = await getDb();
  await internalSetSetting(database, key, value);
}

async function internalSetSetting(
  database: Database,
  key: string,
  value: string,
): Promise<void> {
  info("internalSetSetting");

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
  info("get boolean setting");
  return parseBooleanSetting(value, defaultValue);
}

// --- Products and Product Batches ---
/*export async function syncProducts(
  syncResponse: SyncProductsResponse,
): Promise<void> {
  const database = await getDb();
  await withTransaction(database, async (db) => {
    for (const change of syncResponse.products) {
      await db.execute("DELETE FROM product_batch WHERE product_id = $1", [
        change.productId,
      ]);
      await db.execute("DELETE FROM product WHERE id = $1", [change.productId]);

      if (change.isDeleted) {
        continue; // Skip inserting if the product is marked as deleted
      }

      const product = change.product;
      await db.execute(
        `INSERT INTO product (id, brand, buy_price, items_per_pack, merchant_price, name, sell_price, selling_unit, tablets_per_strip, vat)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          product.id,
          product.brand ?? null,
          product.buyPrice,
          product.itemsPerPack ?? null,
          product.merchantPrice ?? null,
          product.name,
          product.sellPrice,
          product.sellingUnit,
          product.tabletsPerStrip ?? null,
          product.vat ?? null,
        ],
      );

      for (const batch of change.productBatches) {
        await db.execute(
          `INSERT INTO product_batch (id, batch_number, expiry_date, product_id)
             VALUES ($1, $2, $3, $4)`,
          [
            batch.id,
            batch.batchNumber,
            batch.expiryDate instanceof Date
              ? batch.expiryDate.toISOString()
              : batch.expiryDate,
            change.productId,
          ],
        );
      }
    }

    await internalSetSetting(
      db,
      SYNC_PRODUCTS_LAST_CHANGE_ID,
      String(syncResponse.lastChangeId),
    );
  });
} */

export async function syncProducts(
  syncResponse: SyncProductsResponse,
): Promise<void> {
  const db = await getDb();
  try {
    for (const change of syncResponse.products) {
      await db.execute("DELETE FROM product_batch WHERE product_id = $1", [
        change.productId,
      ]);
      await db.execute("DELETE FROM product WHERE id = $1", [change.productId]);

      if (change.isDeleted) {
        continue; // Skip inserting if the product is marked as deleted
      }

      const product = change.product;
      await db.execute(
        `INSERT INTO product (id, brand, buy_price, items_per_pack, merchant_price, name, sell_price, selling_unit, tablets_per_strip, vat)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          product.id,
          product.brand ?? null,
          product.buyPrice,
          product.itemsPerPack ?? null,
          product.merchantPrice ?? null,
          product.name,
          product.sellPrice,
          product.sellingUnit,
          product.tabletsPerStrip ?? null,
          product.vat ?? null,
        ],
      );

      for (const batch of change.productBatches) {
        await db.execute(
          `INSERT INTO product_batch (id, batch_number, expiry_date, product_id)
             VALUES ($1, $2, $3, $4)`,
          [
            batch.id,
            batch.batchNumber,
            batch.expiryDate instanceof Date
              ? batch.expiryDate.toISOString()
              : batch.expiryDate,
            change.productId,
          ],
        );
      }
    }

    await internalSetSetting(
      db,
      SYNC_PRODUCTS_LAST_CHANGE_ID,
      String(syncResponse.lastChangeId),
    );
  } catch (err) {
    throw err;
  }
}
