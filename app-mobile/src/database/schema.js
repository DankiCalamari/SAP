import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let db = null;

/**
 * Initialize database connection
 */
export const initDatabase = async () => {
  try {
    db = await SQLite.openDatabase({
      name: 'sap_mobile.db',
      location: 'default',
    });

    await createTables();
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

/**
 * Get database instance
 */
export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

/**
 * Create all database tables
 */
const createTables = async () => {
  const productsTable = `
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT NOT NULL,
      barcode TEXT,
      price REAL NOT NULL,
      category_id INTEGER,
      image_url TEXT,
      description TEXT,
      created_at TEXT,
      updated_at TEXT
    );
  `;

  const inventoryTable = `
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      low_stock_threshold INTEGER,
      last_updated TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `;

  const syncQueueTable = `
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );
  `;

  const customersTable = `
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      loyalty_points INTEGER DEFAULT 0
    );
  `;

  const categoriesTable = `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    );
  `;

  try {
    await db.executeSql(productsTable);
    await db.executeSql(inventoryTable);
    await db.executeSql(syncQueueTable);
    await db.executeSql(customersTable);
    await db.executeSql(categoriesTable);

    console.log('All tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

/**
 * Clear all data from database (for cache clear)
 */
export const clearDatabase = async () => {
  try {
    await db.executeSql('DELETE FROM products');
    await db.executeSql('DELETE FROM inventory');
    await db.executeSql('DELETE FROM customers');
    await db.executeSql('DELETE FROM categories');
    // Keep sync_queue - don't delete unsynced data
    console.log('Database cleared successfully');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};

/**
 * Close database connection
 */
export const closeDatabase = async () => {
  if (db) {
    await db.close();
    db = null;
    console.log('Database closed');
  }
};

export default {
  initDatabase,
  getDatabase,
  clearDatabase,
  closeDatabase,
};
