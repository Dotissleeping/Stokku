import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDb } from '../database/db';

const BACKUP_FILENAME = 'stokku_backup.json';

export const exportBackup = async () => {
  try {
    const database = await getDb();

    const products = await database.getAllAsync('SELECT * FROM products');
    const customers = await database.getAllAsync('SELECT * FROM customers');
    const tabItems = await database.getAllAsync('SELECT * FROM tab_items');
    const payments = await database.getAllAsync('SELECT * FROM payments');

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { products, customers, tabItems, payments },
    };

    const path = FileSystem.documentDirectory + BACKUP_FILENAME;
    await FileSystem.writeAsStringAsync(path, JSON.stringify(backup, null, 2));

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(path, {
        mimeType: 'application/json',
        dialogTitle: 'Save Stokku Backup',
      });
    }

    return { success: true };
  } catch (e) {
    console.error('Export failed:', e);
    return { success: false, error: e.message };
  }
};

export const importBackup = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) return { success: false, canceled: true };

    const fileUri = result.assets[0].uri;
    const raw = await FileSystem.readAsStringAsync(fileUri);
    const backup = JSON.parse(raw);

    if (!backup.data) {
      return { success: false, error: 'Invalid backup file.' };
    }

    const database = await getDb();
    const { products, customers, tabItems, payments } = backup.data;

    // Clear existing data
    await database.execAsync(`
      DELETE FROM payments;
      DELETE FROM tab_items;
      DELETE FROM customers;
      DELETE FROM products;
    `);

    // Restore products
    for (const p of products) {
      await database.runAsync(
        'INSERT INTO products (id, name, price, quantity, image_uri, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [p.id, p.name, p.price, p.quantity, p.image_uri || null, p.created_at]
      );
    }

    // Restore customers
    for (const c of customers) {
      await database.runAsync(
        'INSERT INTO customers (id, name, phone, note, created_at) VALUES (?, ?, ?, ?, ?)',
        [c.id, c.name, c.phone || null, c.note || null, c.created_at]
      );
    }

    // Restore tab items
    for (const t of tabItems) {
      await database.runAsync(
        'INSERT INTO tab_items (id, customer_id, product_id, product_name, price, quantity, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [t.id, t.customer_id, t.product_id || null, t.product_name, t.price, t.quantity, t.created_at]
      );
    }

    // Restore payments
    for (const pay of payments) {
      await database.runAsync(
        'INSERT INTO payments (id, customer_id, amount, date) VALUES (?, ?, ?, ?)',
        [pay.id, pay.customer_id, pay.amount, pay.date]
      );
    }

    return { success: true };
  } catch (e) {
    console.error('Import failed:', e);
    return { success: false, error: e.message };
  }
};