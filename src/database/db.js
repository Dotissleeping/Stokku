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
  `);

  // Migrations
  try {
    await database.execAsync(`ALTER TABLE products ADD COLUMN image_uri TEXT;`);
  } catch (e) {}
};

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

export const getProducts = async () => {
  const database = await getDb();
  return await database.getAllAsync('SELECT * FROM products ORDER BY name ASC');
};

export const addProduct = async (name, price, quantity, imageUri = null) => {
  const database = await getDb();
  const result = await database.runAsync(
    'INSERT INTO products (name, price, quantity, image_uri) VALUES (?, ?, ?, ?)',
    [name, parseFloat(price), parseInt(quantity), imageUri]
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
  return await database.getAllAsync(
    'SELECT * FROM restocks ORDER BY date DESC'
  );
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

export const addCustomer = async (name, phone, note) => {
  const database = await getDb();
  const result = await database.runAsync(
    'INSERT INTO customers (name, phone, note) VALUES (?, ?, ?)',
    [name, phone || null, note || null]
  );
  return result.lastInsertRowId;
};

export const updateCustomer = async (id, name, phone, note) => {
  const database = await getDb();
  await database.runAsync(
    'UPDATE customers SET name = ?, phone = ?, note = ? WHERE id = ?',
    [name, phone || null, note || null, id]
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

  const totalReceivables = await database.getFirstAsync(`
    SELECT 
      COALESCE(SUM(ti.price * ti.quantity), 0) - COALESCE((SELECT SUM(p.amount) FROM payments p), 0) as total
    FROM tab_items ti
  `);

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
  const totalCollected = await database.getFirstAsync(
    'SELECT COALESCE(SUM(amount), 0) as total FROM payments'
  );

  return {
    totalReceivables: totalReceivables?.total || 0,
    unpaidCount: unpaidCount?.count || 0,
    lowStock,
    totalRestockCost,
    totalCollected: totalCollected?.total || 0,
    estimatedProfit: (totalCollected?.total || 0) - totalRestockCost,
  };
};