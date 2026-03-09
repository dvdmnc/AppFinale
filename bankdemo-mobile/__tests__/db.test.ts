/**
 * DB service unit tests — Red phase.
 * Tests local SQLite transaction storage and sync queue behavior.
 * expo-sqlite is mocked in jest.setup.ts.
 */
import { dbService } from '../src/services/db';
import * as SQLite from 'expo-sqlite';

describe('dbService', () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      execAsync: jest.fn(),
      getAllAsync: jest.fn().mockResolvedValue([]),
      runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    };
    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
  });

  it('should save a transaction and return insert id', async () => {
    mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 42, changes: 1 });

    const id = await dbService.saveTransaction({
      serverId: null,
      type: 'deposit',
      amount: 100,
      description: 'Test deposit',
      recipientAccount: null,
      synced: false,
      createdAt: '2026-03-07T10:00:00Z',
    });

    expect(id).toBe(42);
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO transactions'),
      expect.arrayContaining([null, 'deposit', 100, 'Test deposit', null, 0, '2026-03-07T10:00:00Z'])
    );
  });

  it('should retrieve all transactions ordered by date', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { id: 2, serverId: 10, type: 'send', amount: 50, synced: 1, createdAt: '2026-03-07T12:00:00Z' },
      { id: 1, serverId: 5, type: 'deposit', amount: 100, synced: 1, createdAt: '2026-03-07T10:00:00Z' },
    ]);

    const txs = await dbService.getTransactions();

    expect(txs).toHaveLength(2);
    expect(txs[0].synced).toBe(true); // converted from integer
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY createdAt DESC')
    );
  });

  it('should return unsynced transactions', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { id: 3, serverId: null, type: 'send', amount: 75, synced: 0, createdAt: '2026-03-07T11:00:00Z' },
    ]);

    const unsynced = await dbService.getUnsynced();

    expect(unsynced).toHaveLength(1);
    expect(unsynced[0].synced).toBe(false);
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('synced = 0')
    );
  });

  it('should mark a transaction as synced with server id', async () => {
    await dbService.markSynced(3, 99);

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE transactions SET synced = 1'),
      [99, 3]
    );
  });

  it('should create the transactions table on first access', async () => {
    await dbService.getTransactions();

    expect(mockDb.execAsync).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS transactions')
    );
  });
});
