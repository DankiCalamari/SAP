import { getDatabase } from './schema';

/**
 * Insert products into database (bulk)
 */
export const insertProducts = async (products) => {
  const db = getDatabase();

  try {
    await db.transaction(async (tx) => {
      for (const product of products) {
        const query = `
          INSERT OR REPLACE INTO products
          (id, name, sku, barcode, price, category_id, image_url, description, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
          product.id,
          product.name,
          product.sku,
          product.barcode,
          product.price,
          product.category_id,
          product.image_url,
          product.description,
          product.created_at,
          product.updated_at,
        ];

        await tx.executeSql(query, params);
      }
    });

    console.log(`Inserted ${products.length} products`);
  } catch (error) {
    console.error('Error inserting products:', error);
    throw error;
  }
};

/**
 * Get products from database with optional filters
 */
export const getProducts = async (filters = {}) => {
  const db = getDatabase();

  try {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (filters.category) {
      query += ' AND category_id = ?';
      params.push(filters.category);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Sort
    if (filters.sortBy === 'name_asc') {
      query += ' ORDER BY name ASC';
    } else if (filters.sortBy === 'name_desc') {
      query += ' ORDER BY name DESC';
    } else if (filters.sortBy === 'price_asc') {
      query += ' ORDER BY price ASC';
    } else if (filters.sortBy === 'price_desc') {
      query += ' ORDER BY price DESC';
    }

    const [results] = await db.executeSql(query, params);

    const products = [];
    for (let i = 0; i < results.rows.length; i++) {
      products.push(results.rows.item(i));
    }

    return products;
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

/**
 * Get product by ID
 */
export const getProductById = async (productId) => {
  const db = getDatabase();

  try {
    const query = 'SELECT * FROM products WHERE id = ?';
    const [results] = await db.executeSql(query, [productId]);

    if (results.rows.length > 0) {
      return results.rows.item(0);
    }

    return null;
  } catch (error) {
    console.error('Error getting product by ID:', error);
    throw error;
  }
};

/**
 * Insert or update inventory
 */
export const updateInventory = async (productId, quantity, lowStockThreshold = null) => {
  const db = getDatabase();

  try {
    const checkQuery = 'SELECT * FROM inventory WHERE product_id = ?';
    const [checkResults] = await db.executeSql(checkQuery, [productId]);

    const now = new Date().toISOString();

    if (checkResults.rows.length > 0) {
      // Update existing
      const updateQuery = `
        UPDATE inventory
        SET quantity = ?, low_stock_threshold = COALESCE(?, low_stock_threshold), last_updated = ?
        WHERE product_id = ?
      `;
      await db.executeSql(updateQuery, [quantity, lowStockThreshold, now, productId]);
    } else {
      // Insert new
      const insertQuery = `
        INSERT INTO inventory (product_id, quantity, low_stock_threshold, last_updated)
        VALUES (?, ?, ?, ?)
      `;
      await db.executeSql(insertQuery, [productId, quantity, lowStockThreshold, now]);
    }

    console.log(`Inventory updated for product ${productId}`);
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error;
  }
};

/**
 * Get inventory by product ID
 */
export const getInventoryByProduct = async (productId) => {
  const db = getDatabase();

  try {
    const query = 'SELECT * FROM inventory WHERE product_id = ?';
    const [results] = await db.executeSql(query, [productId]);

    if (results.rows.length > 0) {
      return results.rows.item(0);
    }

    return null;
  } catch (error) {
    console.error('Error getting inventory:', error);
    throw error;
  }
};

/**
 * Add action to sync queue
 */
export const addToSyncQueue = async (actionType, payload) => {
  const db = getDatabase();

  try {
    const query = `
      INSERT INTO sync_queue (action_type, payload, created_at, synced)
      VALUES (?, ?, ?, 0)
    `;
    const now = new Date().toISOString();
    const payloadString = JSON.stringify(payload);

    await db.executeSql(query, [actionType, payloadString, now]);

    console.log(`Added to sync queue: ${actionType}`);
  } catch (error) {
    console.error('Error adding to sync queue:', error);
    throw error;
  }
};

/**
 * Get all unsynced items from queue
 */
export const getSyncQueue = async () => {
  const db = getDatabase();

  try {
    const query = 'SELECT * FROM sync_queue WHERE synced = 0 ORDER BY created_at ASC';
    const [results] = await db.executeSql(query);

    const queue = [];
    for (let i = 0; i < results.rows.length; i++) {
      queue.push(results.rows.item(i));
    }

    return queue;
  } catch (error) {
    console.error('Error getting sync queue:', error);
    throw error;
  }
};

/**
 * Mark queue item as synced
 */
export const markAsSynced = async (id) => {
  const db = getDatabase();

  try {
    const query = 'UPDATE sync_queue SET synced = 1 WHERE id = ?';
    await db.executeSql(query, [id]);

    console.log(`Marked queue item ${id} as synced`);
  } catch (error) {
    console.error('Error marking as synced:', error);
    throw error;
  }
};

/**
 * Insert or update customer
 */
export const insertCustomer = async (customer) => {
  const db = getDatabase();

  try {
    const query = `
      INSERT OR REPLACE INTO customers (id, name, email, phone, loyalty_points)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      customer.id,
      customer.name,
      customer.email,
      customer.phone,
      customer.loyalty_points || 0,
    ];

    await db.executeSql(query, params);
    console.log(`Inserted customer ${customer.id}`);
  } catch (error) {
    console.error('Error inserting customer:', error);
    throw error;
  }
};

/**
 * Search customers
 */
export const searchCustomers = async (query) => {
  const db = getDatabase();

  try {
    const searchQuery = `
      SELECT * FROM customers
      WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?
      LIMIT 20
    `;
    const searchTerm = `%${query}%`;
    const [results] = await db.executeSql(searchQuery, [searchTerm, searchTerm, searchTerm]);

    const customers = [];
    for (let i = 0; i < results.rows.length; i++) {
      customers.push(results.rows.item(i));
    }

    return customers;
  } catch (error) {
    console.error('Error searching customers:', error);
    throw error;
  }
};

export default {
  insertProducts,
  getProducts,
  getProductById,
  updateInventory,
  getInventoryByProduct,
  addToSyncQueue,
  getSyncQueue,
  markAsSynced,
  insertCustomer,
  searchCustomers,
};
