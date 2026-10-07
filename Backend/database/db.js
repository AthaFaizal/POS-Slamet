import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databasePath = path.join(
  __dirname,
  "pos.db"
);

const db = new Database(databasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");


/* =========================================================
   PRODUCTS
   Master data barang
   ========================================================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    barcode TEXT UNIQUE NOT NULL,

    name TEXT NOT NULL,

    category TEXT DEFAULT 'Lainnya',

    brand TEXT DEFAULT '',

    unit TEXT DEFAULT 'pcs',

    supplier TEXT DEFAULT '',

    buy_price INTEGER NOT NULL DEFAULT 0,

    sell_price INTEGER NOT NULL DEFAULT 0,

    stock INTEGER NOT NULL DEFAULT 0,

    min_stock INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    image TEXT DEFAULT '',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);


/* =========================================================
   MEMBERS
   Pelanggan yang terdaftar sebagai member
   ========================================================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    member_code TEXT UNIQUE NOT NULL,

    name TEXT NOT NULL,

    phone TEXT UNIQUE,

    address TEXT DEFAULT '',

    photo TEXT DEFAULT '',

    status TEXT NOT NULL DEFAULT 'active',

    notes TEXT DEFAULT '',

    total_transactions INTEGER NOT NULL DEFAULT 0,

    total_spending INTEGER NOT NULL DEFAULT 0,

    last_purchase_at DATETIME,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);


/* =========================================================
   TRANSACTIONS
   Header transaksi kasir
   ========================================================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    transaction_no TEXT UNIQUE NOT NULL,

    member_id INTEGER,

    customer_type TEXT NOT NULL DEFAULT 'guest',

    customer_name TEXT DEFAULT 'Pelanggan Umum',

    customer_phone TEXT,

    payment_method TEXT NOT NULL,

    subtotal INTEGER NOT NULL DEFAULT 0,

    discount INTEGER NOT NULL DEFAULT 0,

    total INTEGER NOT NULL DEFAULT 0,

    paid INTEGER NOT NULL DEFAULT 0,

    change_amount INTEGER NOT NULL DEFAULT 0,

    remaining INTEGER NOT NULL DEFAULT 0,

    payment_status TEXT NOT NULL DEFAULT 'Lunas',

    notes TEXT DEFAULT '',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (member_id)
      REFERENCES members(id)
      ON DELETE SET NULL
  );
`);


/* =========================================================
   TRANSACTION ITEMS
   Detail barang yang dibeli
   ========================================================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS transaction_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    transaction_id INTEGER NOT NULL,

    product_id INTEGER,

    barcode TEXT,

    product_name TEXT NOT NULL,

    quantity INTEGER NOT NULL DEFAULT 1,

    buy_price INTEGER NOT NULL DEFAULT 0,

    normal_price INTEGER NOT NULL DEFAULT 0,

    selling_price INTEGER NOT NULL DEFAULT 0,

    discount INTEGER NOT NULL DEFAULT 0,

    subtotal INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (transaction_id)
      REFERENCES transactions(id)
      ON DELETE CASCADE,

    FOREIGN KEY (product_id)
      REFERENCES products(id)
      ON DELETE SET NULL
  );
`);


/* =========================================================
   DEBTS
   Bon / piutang pelanggan
   ========================================================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS debts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    debt_no TEXT UNIQUE NOT NULL,

    transaction_id INTEGER NOT NULL,

    member_id INTEGER,

    customer_type TEXT NOT NULL DEFAULT 'guest',

    customer_name TEXT NOT NULL,

    customer_phone TEXT,

    total_amount INTEGER NOT NULL DEFAULT 0,

    paid_amount INTEGER NOT NULL DEFAULT 0,

    remaining_amount INTEGER NOT NULL DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'Belum Bayar',

    due_date DATE,

    notes TEXT DEFAULT '',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (transaction_id)
      REFERENCES transactions(id)
      ON DELETE CASCADE,

    FOREIGN KEY (member_id)
      REFERENCES members(id)
      ON DELETE SET NULL
  );
`);


/* =========================================================
   DEBT PAYMENTS
   Riwayat cicilan pembayaran bon
   ========================================================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS debt_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    debt_id INTEGER NOT NULL,

    amount INTEGER NOT NULL,

    payment_method TEXT NOT NULL DEFAULT 'Tunai',

    notes TEXT DEFAULT '',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (debt_id)
      REFERENCES debts(id)
      ON DELETE CASCADE
  );
`);


/* =========================================================
   PRICE HISTORY
   Riwayat perubahan harga barang
   ========================================================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    product_id INTEGER NOT NULL,

    old_buy_price INTEGER NOT NULL DEFAULT 0,

    new_buy_price INTEGER NOT NULL DEFAULT 0,

    old_sell_price INTEGER NOT NULL DEFAULT 0,

    new_sell_price INTEGER NOT NULL DEFAULT 0,

    difference_amount INTEGER NOT NULL DEFAULT 0,

    difference_percent REAL NOT NULL DEFAULT 0,

    reason TEXT DEFAULT '',

    effective_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id)
      REFERENCES products(id)
      ON DELETE CASCADE
  );
`);


/* =========================================================
   STOCK MOVEMENTS
   Riwayat stok masuk / keluar
   ========================================================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    product_id INTEGER NOT NULL,

    transaction_id INTEGER,

    movement_type TEXT NOT NULL,

    quantity INTEGER NOT NULL,

    stock_before INTEGER NOT NULL,

    stock_after INTEGER NOT NULL,

    notes TEXT DEFAULT '',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id)
      REFERENCES products(id)
      ON DELETE CASCADE,

    FOREIGN KEY (transaction_id)
      REFERENCES transactions(id)
      ON DELETE SET NULL
  );
`);


/* =========================================================
   INDEX
   Mempercepat pencarian
   ========================================================= */

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_products_barcode
  ON products(barcode);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_products_name
  ON products(name);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_products_category
  ON products(category);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_members_code
  ON members(member_code);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_members_phone
  ON members(phone);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_transactions_number
  ON transactions(transaction_no);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_transactions_date
  ON transactions(created_at);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction
  ON transaction_items(transaction_id);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_debts_transaction
  ON debts(transaction_id);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_debts_status
  ON debts(status);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_debt_payments_debt
  ON debt_payments(debt_id);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_price_history_product
  ON price_history(product_id);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_stock_movements_product
  ON stock_movements(product_id);
`);

console.log(
  "Database SQLite berhasil diinisialisasi."
);

export default db;