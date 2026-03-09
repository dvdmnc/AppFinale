import * as SQLite from 'expo-sqlite';

export interface LocalTransaction {
  id?: number;
  serverId: number | null;
  type: 'send' | 'deposit';
  amount: number;
  description: string;
  recipientAccount: string | null;
  synced: boolean;
  createdAt: string;
}

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('bankdemo.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serverId INTEGER,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        recipientAccount TEXT,
        synced INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL
      );
    `);
  }
  return db;
}

export const dbService = {
  async saveTransaction(tx: Omit<LocalTransaction, 'id'>): Promise<number> {
    const database = await getDb();
    const result = await database.runAsync(
      'INSERT INTO transactions (serverId, type, amount, description, recipientAccount, synced, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [tx.serverId, tx.type, tx.amount, tx.description, tx.recipientAccount, tx.synced ? 1 : 0, tx.createdAt]
    );
    return result.lastInsertRowId;
  },

  async getTransactions(): Promise<LocalTransaction[]> {
    const database = await getDb();
    const rows = await database.getAllAsync<any>('SELECT * FROM transactions ORDER BY createdAt DESC');
    return rows.map((r: any) => ({ ...r, synced: !!r.synced }));
  },

  async getUnsynced(): Promise<LocalTransaction[]> {
    const database = await getDb();
    const rows = await database.getAllAsync<any>('SELECT * FROM transactions WHERE synced = 0');
    return rows.map((r: any) => ({ ...r, synced: false }));
  },

  async markSynced(id: number, serverId: number): Promise<void> {
    const database = await getDb();
    await database.runAsync('UPDATE transactions SET synced = 1, serverId = ? WHERE id = ?', [serverId, id]);
  },
};
