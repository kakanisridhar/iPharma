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
  {
    version: 3,
    statements: [
      `CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY,
        sale_date TEXT,
        customer_name TEXT,
        customer_type TEXT,
        discount_type NUMERIC,
        discount NUMERIC,
        
        amount_to_pay NUMERIC,
        gross_price NUMERIC,
        net_price NUMERIC,
        tax NUMERIC,
        
        status INTEGER
      )`,

      `CREATE TABLE IF NOT EXISTS sale_line_items (	
        id TEXT PRIMARY KEY,
        sale_id INTEGER NOT NULL,
        idx INTEGER NOT NULL,
        
        product_id INTEGER NOT NULL,
        product_batch_id INTEGER NOT NULL,
        
        quantity INTEGER,
        pack_count INTEGER,
        
        gross_price NUMERIC,
        net_price NUMERIC,
        tax NUMERIC,
        
        is_returned bool,
        returned_quantity INTEGER,
        is_split_pack bool,
        is_new_pack_split bool NULL,
        
        unit_price NUMERIC,
        vat_rate NUMERIC,
        CONSTRAINT fk_sale_sli FOREIGN KEY (sale_id) REFERENCES sales(id)
      )`,

      `CREATE TABLE IF NOT EXISTS payments (
        sale_id INTEGER NOT NULL,
        amount NUMERIC,
        cash_tendered NUMERIC,
        cash_change_given NUMERIC,
        payment_method TEXT NOT NULL,
        CONSTRAINT fk_payment_saleid FOREIGN KEY (sale_id) REFERENCES sales(id)
      )`,
    ],
  },
  {
    version: 4,
    statements: [
      `CREATE TABLE IF NOT EXISTS sales_returns (
        id INTEGER PRIMARY KEY,
        created_date TEXT,
        last_modified_date TEXT,
        gross_price NUMERIC,
        net_price NUMERIC,
        payment_method TEXT,
        processed_by TEXT,
        refund_amount NUMERIC,
        sale_id INTEGER,
        shop_id INTEGER,
        tax NUMERIC,
        CONSTRAINT fk_sr_saleid FOREIGN KEY (sale_id) REFERENCES sales(id)
      )`,
      `CREATE TABLE IF NOT EXISTS sales_return_line_items (
        sales_return_id INTEGER NOT NULL,
        gross_price NUMERIC,
        id TEXT NOT NULL,
        net_price NUMERIC,
        pack_count INTEGER,
        product_id INTEGER NOT NULL,
        quantity INTEGER,
        tax NUMERIC,
        CONSTRAINT fk_srli_sr FOREIGN KEY (sales_return_id) REFERENCES sales_returns(id)
      )`,
    ],
  },
  {
    version: 5,
    statements: [
      `CREATE TABLE IF NOT EXISTS inventory_count (
        id INTEGER PRIMARY KEY,
        product_id INTEGER NOT NULL,
        product_batch_id INTEGER NOT NULL,
        pack_count INTEGER,
        quantity INTEGER,
        last_modified_date TEXT
      )`,
    ],
  },
];

export const LATEST_SCHEMA_VERSION =
  MIGRATIONS[MIGRATIONS.length - 1]?.version ?? 1;
