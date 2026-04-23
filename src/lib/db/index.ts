import Database from "@tauri-apps/plugin-sql";
import { MIGRATIONS } from "./schema";
import { parseBooleanSetting } from "./settings-utils";
import type {
  ProductBatchType,
  ProductType,
  SyncProductsResponse,
} from "@/types/products";
import { SellingUnit } from "@/types/base";
import { info, error } from "@tauri-apps/plugin-log";
import { SYNC_PRODUCTS_LAST_CHANGE_ID } from "@/config/vars";
import type { BatchWithInventory, InventorCount } from "@/types/inventory";
import type { CreateSaleInput } from "@/types/sales";

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;
  try {
    db = await Database.load("sqlite:ipharma.db");
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

// --- Product Search ---

interface ProductRow {
  id: number;
  name: string;
  brand: string | null;
  buy_price: number;
  sell_price: number;
  merchant_price: number | null;
  vat: number | null;
  selling_unit: string;
  tablets_per_strip: number | null;
  items_per_pack: number | null;
}

function mapProductRow(row: ProductRow): ProductType {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? undefined,
    buyPrice: row.buy_price,
    sellPrice: row.sell_price,
    merchantPrice: row.merchant_price ?? undefined,
    vat: row.vat ?? undefined,
    sellingUnit: row.selling_unit as SellingUnit,
    tabletsPerStrip: row.tablets_per_strip ?? undefined,
    itemsPerPack: row.items_per_pack ?? undefined,
  };
}

export async function searchProducts(query: string): Promise<ProductType[]> {
  const database = await getDb();
  const rows = await database.select<ProductRow[]>(
    `SELECT id, name, brand, buy_price, sell_price, merchant_price, vat,
            selling_unit, tablets_per_strip, items_per_pack
     FROM product
     WHERE name LIKE $1
     ORDER BY name
     LIMIT 30`,
    [`%${query}%`],
  );
  return rows.map(mapProductRow);
}

export async function getBatchesWithInventory(
  productId: number,
): Promise<BatchWithInventory[]> {
  const database = await getDb();
  const rows = await database.select<
    {
      id: number;
      batch_number: string;
      expiry_date: string;
      quantity: number;
      pack_count: number;
    }[]
  >(
    `SELECT pb.id, pb.batch_number, pb.expiry_date,
            COALESCE(ic.quantity, 0) AS quantity,
            COALESCE(ic.pack_count, 0) AS pack_count
     FROM product_batch pb
     LEFT JOIN inventory_count ic
       ON ic.product_batch_id = pb.id AND ic.product_id = pb.product_id
     WHERE pb.product_id = $1
     ORDER BY pb.expiry_date ASC`,
    [productId],
  );
  return rows.map((r) => ({
    id: r.id,
    batchNumber: r.batch_number,
    expiryDate: r.expiry_date,
    quantity: r.quantity,
    packCount: r.pack_count,
  }));
}

// --- Sales ---

export async function createSale(input: CreateSaleInput): Promise<number> {
  const database = await getDb();
  return await withTransaction(database, async (db) => {
    const saleResult = await db.execute(
      `INSERT INTO sales (sale_date, customer_name, customer_type, discount_type,
              discount, amount_to_pay, gross_price, net_price, tax, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)`,
      [
        input.saleDate,
        input.customerName ?? null,
        input.customerType ?? null,
        input.discountType,
        input.discount / 100,
        input.amountToPay / 100,
        input.grossPrice / 100,
        input.netPrice / 100,
        input.tax / 100,
      ],
    );
    const saleId = saleResult.lastInsertId as number;

    for (const item of input.items) {
      const lineId = crypto.randomUUID();
      await db.execute(
        `INSERT INTO sale_line_items
          (id, sale_id, idx, product_id, product_batch_id, quantity, pack_count,
           gross_price, net_price, tax, is_returned, returned_quantity,
           is_split_pack, is_new_pack_split, unit_price, vat_rate)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,0,$11,$12,$13,$14)`,
        [
          lineId,
          saleId,
          item.idx,
          item.productId,
          item.productBatchId,
          item.quantity,
          item.packCount,
          item.grossPrice / 100,
          item.netPrice / 100,
          item.tax / 100,
          item.isSplitPack ? 1 : 0,
          item.isNewPackSplit ? 1 : 0,
          item.unitPrice / 100,
          item.vatRate / 100, // store as percentage (e.g. 18.0)
        ],
      );
    }

    await db.execute(
      `INSERT INTO payments (sale_id, amount, cash_tendered, cash_change_given, payment_method)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        saleId,
        input.amountToPay / 100,
        input.cashTendered / 100,
        input.cashChangeGiven / 100,
        input.paymentMethod,
      ],
    );

    for (const item of input.items) {
      await db.execute(
        `UPDATE inventory_count
         SET quantity = quantity - $1, pack_count = pack_count - $2
         WHERE product_id = $3 AND product_batch_id = $4`,
        [item.quantity, item.packCount, item.productId, item.productBatchId],
      );
    }

    return saleId;
  });
}

export async function syncInventoryCounts(
  inventoryCounts: InventorCount[],
): Promise<void> {
  const db = await getDb();
  try {
    await db.execute("DELETE FROM inventory_count");
    for (const ic of inventoryCounts) {
      await db.execute(
        `INSERT INTO inventory_count (id, product_id, product_batch_id, pack_count, quantity, last_modified_date)
           VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          ic.id,
          ic.productId,
          ic.productBatchId,
          ic.packCount,
          ic.quantity,
          ic.lastModifiedDate,
        ],
      );
    }
  } catch (err) {
    throw err;
  }
}
