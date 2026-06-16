  import * as SQLite from 'expo-sqlite';

let db = null;

export const getDb = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('stokku.db');
  }
  return db;
};

export const initDatabase = async () => {
  const database = await getDb();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 0,
      image_uri TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      note TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tab_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      date TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS restocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity_added INTEGER NOT NULL DEFAULT 0,
      cost REAL NOT NULL DEFAULT 0,
      date TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS receipt_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      snapshot TEXT NOT NULL,
      total_bill REAL NOT NULL DEFAULT 0,
      total_paid REAL NOT NULL DEFAULT 0,
      balance REAL NOT NULL DEFAULT 0,
      date TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );
  `);

  // Migrations
  try {
  await database.execAsync(`ALTER TABLE products ADD COLUMN sku TEXT;`);
  } catch (e) {}
  try {
    await database.execAsync(`ALTER TABLE products ADD COLUMN image_uri TEXT;`);
  } catch (e) {}
  try {
    await database.execAsync(`ALTER TABLE customers ADD COLUMN image_uri TEXT;`);
  } catch (e) {}
};

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

export const getProducts = async () => {
  const database = await getDb();
  return await database.getAllAsync('SELECT * FROM products ORDER BY name ASC');
};

export const addProduct = async (name, price, quantity, imageUri = null) => {
  const database = await getDb();
  // Generate SKU: ZK-000001 format
  const countResult = await database.getFirstAsync('SELECT COUNT(*) as count FROM products');
  const count = (countResult?.count || 0) + 1;
  const sku = `ZK-${String(count).padStart(6, '0')}`;
  const result = await database.runAsync(
    'INSERT INTO products (name, price, quantity, image_uri, sku) VALUES (?, ?, ?, ?, ?)',
    [name, parseFloat(price), parseInt(quantity), imageUri, sku]
  );
  return result.lastInsertRowId;
};

export const updateProduct = async (id, name, price, quantity, imageUri = null) => {
  const database = await getDb();
  await database.runAsync(
    'UPDATE products SET name = ?, price = ?, quantity = ?, image_uri = ? WHERE id = ?',
    [name, parseFloat(price), parseInt(quantity), imageUri, id]
  );
};

export const deleteProduct = async (id) => {
  const database = await getDb();
  await database.runAsync('DELETE FROM products WHERE id = ?', [id]);
};

export const decrementStock = async (productId, qty) => {
  const database = await getDb();
  await database.runAsync(
    'UPDATE products SET quantity = MAX(0, quantity - ?) WHERE id = ?',
    [qty, productId]
  );
};

export const incrementStock = async (productId, qty) => {
  const database = await getDb();
  await database.runAsync(
    'UPDATE products SET quantity = quantity + ? WHERE id = ?',
    [qty, productId]
  );
};

export const getLowStockProducts = async (threshold = 5) => {
  const database = await getDb();
  return await database.getAllAsync(
    'SELECT * FROM products WHERE quantity <= ? ORDER BY quantity ASC',
    [threshold]
  );
};

// ─── RESTOCKS ────────────────────────────────────────────────────────────────

export const addRestock = async (productId, productName, quantityAdded, cost) => {
  const database = await getDb();
  await incrementStock(productId, quantityAdded);
  const result = await database.runAsync(
    'INSERT INTO restocks (product_id, product_name, quantity_added, cost) VALUES (?, ?, ?, ?)',
    [productId, productName, parseInt(quantityAdded), parseFloat(cost)]
  );
  return result.lastInsertRowId;
};

export const getRestocks = async () => {
  const database = await getDb();
  return await database.getAllAsync('SELECT * FROM restocks ORDER BY date DESC');
};

export const getRestocksByProduct = async (productId) => {
  const database = await getDb();
  return await database.getAllAsync(
    'SELECT * FROM restocks WHERE product_id = ? ORDER BY date DESC',
    [productId]
  );
};

export const getTotalRestockCost = async () => {
  const database = await getDb();
  const result = await database.getFirstAsync(
    'SELECT COALESCE(SUM(cost), 0) as total FROM restocks'
  );
  return result?.total || 0;
};

// ─── RECEIPT SNAPSHOTS ───────────────────────────────────────────────────────

export const saveReceiptSnapshot = async (customerId, customerName, tabItems, payments, totalBill, totalPaid, balance) => {
  const database = await getDb();
  const snapshot = JSON.stringify({ tabItems, payments });
  await database.runAsync(
    'INSERT INTO receipt_snapshots (customer_id, customer_name, snapshot, total_bill, total_paid, balance) VALUES (?, ?, ?, ?, ?, ?)',
    [customerId, customerName, snapshot, totalBill, totalPaid, balance]
  );
};

export const getReceiptSnapshots = async () => {
  const database = await getDb();
  return await database.getAllAsync(
    'SELECT * FROM receipt_snapshots ORDER BY date DESC'
  );
};

export const getReceiptSnapshotsByCustomer = async (customerId) => {
  const database = await getDb();
  return await database.getAllAsync(
    'SELECT * FROM receipt_snapshots WHERE customer_id = ? ORDER BY date DESC',
    [customerId]
  );
};

export const deleteReceiptSnapshot = async (id) => {
  const database = await getDb();
  await database.runAsync('DELETE FROM receipt_snapshots WHERE id = ?', [id]);
};

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────

export const getCustomers = async () => {
  const database = await getDb();
  return await database.getAllAsync(`
    SELECT 
      c.*,
      COALESCE((SELECT SUM(ti.price * ti.quantity) FROM tab_items ti WHERE ti.customer_id = c.id), 0) as total_bill,
      COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.customer_id = c.id), 0) as total_paid
    FROM customers c
    ORDER BY (
      COALESCE((SELECT SUM(ti.price * ti.quantity) FROM tab_items ti WHERE ti.customer_id = c.id), 0)
      - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.customer_id = c.id), 0)
    ) DESC, c.name ASC
  `);
};

export const getCustomerById = async (id) => {
  const database = await getDb();
  return await database.getFirstAsync(`
    SELECT 
      c.*,
      COALESCE((SELECT SUM(ti.price * ti.quantity) FROM tab_items ti WHERE ti.customer_id = c.id), 0) as total_bill,
      COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.customer_id = c.id), 0) as total_paid
    FROM customers c
    WHERE c.id = ?
  `, [id]);
};

export const addCustomer = async (name, phone, note, imageUri = null) => {
  const database = await getDb();
  const result = await database.runAsync(
    'INSERT INTO customers (name, phone, note, image_uri) VALUES (?, ?, ?, ?)',
    [name, phone || null, note || null, imageUri]
  );
  return result.lastInsertRowId;
};

export const updateCustomer = async (id, name, phone, note, imageUri = null) => {
  const database = await getDb();
  await database.runAsync(
    'UPDATE customers SET name = ?, phone = ?, note = ?, image_uri = ? WHERE id = ?',
    [name, phone || null, note || null, imageUri, id]
  );
};

export const deleteCustomer = async (id) => {
  const database = await getDb();
  await database.runAsync('DELETE FROM customers WHERE id = ?', [id]);
};

// ─── TAB ITEMS ───────────────────────────────────────────────────────────────

export const getTabItems = async (customerId) => {
  const database = await getDb();
  return await database.getAllAsync(
    'SELECT * FROM tab_items WHERE customer_id = ? ORDER BY created_at ASC',
    [customerId]
  );
};

export const addTabItem = async (customerId, productId, productName, price, quantity) => {
  const database = await getDb();
  const existing = await database.getFirstAsync(
    'SELECT * FROM tab_items WHERE customer_id = ? AND product_id = ?',
    [customerId, productId]
  );
  if (existing) {
    await database.runAsync(
      'UPDATE tab_items SET quantity = quantity + ? WHERE id = ?',
      [quantity, existing.id]
    );
    return existing.id;
  }
  const result = await database.runAsync(
    'INSERT INTO tab_items (customer_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)',
    [customerId, productId || null, productName, parseFloat(price), parseInt(quantity)]
  );
  return result.lastInsertRowId;
};

export const removeTabItem = async (id, productId, quantity) => {
  const database = await getDb();
  await database.runAsync('DELETE FROM tab_items WHERE id = ?', [id]);
  if (productId) {
    await incrementStock(productId, quantity);
  }
};

export const voidTabItem = async (id, productId, voidQty) => {
  const database = await getDb();
  const item = await database.getFirstAsync('SELECT * FROM tab_items WHERE id = ?', [id]);
  if (!item) return;
  const newQty = item.quantity - voidQty;
  if (newQty <= 0) {
    await database.runAsync('DELETE FROM tab_items WHERE id = ?', [id]);
  } else {
    await database.runAsync('UPDATE tab_items SET quantity = ? WHERE id = ?', [newQty, id]);
  }
  if (productId) {
    await incrementStock(productId, voidQty);
  }
};

export const updateTabItemQuantity = async (id, quantity) => {
  const database = await getDb();
  await database.runAsync(
    'UPDATE tab_items SET quantity = ? WHERE id = ?',
    [parseInt(quantity), id]
  );
};

// ─── PAYMENTS ────────────────────────────────────────────────────────────────

export const getPayments = async (customerId) => {
  const database = await getDb();
  return await database.getAllAsync(
    'SELECT * FROM payments WHERE customer_id = ? ORDER BY date DESC',
    [customerId]
  );
};

export const addPayment = async (customerId, amount) => {
  const database = await getDb();
  const result = await database.runAsync(
    'INSERT INTO payments (customer_id, amount) VALUES (?, ?)',
    [customerId, parseFloat(amount)]
  );
  return result.lastInsertRowId;
};

export const deletePayment = async (id) => {
  const database = await getDb();
  await database.runAsync('DELETE FROM payments WHERE id = ?', [id]);
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export const getDashboardStats = async () => {
  const database = await getDb();

  const totalBillResult = await database.getFirstAsync(
    'SELECT COALESCE(SUM(price * quantity), 0) as total FROM tab_items'
  );
  const totalCollectedResult = await database.getFirstAsync(
    'SELECT COALESCE(SUM(amount), 0) as total FROM payments'
  );

  const totalBill = totalBillResult?.total || 0;
  const totalCollected = totalCollectedResult?.total || 0;
  const totalReceivables = Math.max(0, totalBill - totalCollected);

  const unpaidCount = await database.getFirstAsync(`
    SELECT COUNT(*) as count FROM (
      SELECT c.id FROM customers c
      WHERE (
        COALESCE((SELECT SUM(ti.price * ti.quantity) FROM tab_items ti WHERE ti.customer_id = c.id), 0)
        - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.customer_id = c.id), 0)
      ) > 0
    )
  `);

  const lowStock = await getLowStockProducts(5);
  const totalRestockCost = await getTotalRestockCost();
  const estimatedProfit = totalCollected - totalRestockCost;

  return {
    totalReceivables,
    unpaidCount: unpaidCount?.count || 0,
    lowStock,
    totalRestockCost,
    totalCollected,
    estimatedProfit,
  };
};