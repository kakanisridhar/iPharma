export type Migration = {
  version: number;
  statements: string[];
};

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`,
    ],
  },
  {
    version: 2,
    statements: [
      `CREATE TABLE IF NOT EXISTS product (
        id INTEGER PRIMARY KEY,
        brand TEXT,
        buy_price NUMERIC,
        items_per_pack INTEGER,
        merchant_price NUMERIC,
        name TEXT,
        sell_price NUMERIC,
        selling_unit TEXT,
        tablets_per_strip INTEGER,
        vat NUMERIC
      )`,
      `CREATE TABLE IF NOT EXISTS product_batch (
        id INTEGER PRIMARY KEY,
        batch_number TEXT,
        expiry_date TEXT,
        product_id INTEGER NOT NULL,
        FOREIGN KEY (product_id) REFERENCES product(id)
      )`,
    ],
  },
];

export const LATEST_SCHEMA_VERSION =
  MIGRATIONS[MIGRATIONS.length - 1]?.version ?? 1;
