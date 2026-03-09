/**
 * Sync service unit tests — tests queue retry behavior.
 */
import { syncService } from '../src/services/sync';
import { dbService } from '../src/services/db';
import { api } from '../src/services/api';

jest.mock('../src/services/db', () => ({
  dbService: {
    getUnsynced: jest.fn(),
    markSynced: jest.fn(),
  },
}));

jest.mock('../src/services/api', () => ({
  api: {
    post: jest.fn(),
  },
}));

const mockDb = dbService as jest.Mocked<typeof dbService>;
const mockApi = api as jest.Mocked<typeof api>;

describe('syncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sync unsynced deposit transactions', async () => {
    mockDb.getUnsynced.mockResolvedValue([
      {
        id: 1,
        serverId: null,
        type: 'deposit',
        amount: 100,
        description: 'Cash',
        recipientAccount: null,
        synced: false,
        createdAt: '2026-03-07T10:00:00Z',
      },
    ]);
    mockApi.post.mockResolvedValue({ id: 55 });

    const count = await syncService.syncPending();

    expect(count).toBe(1);
    expect(mockApi.post).toHaveBeenCalledWith('/transactions/deposit', {
      amount: 100,
      description: 'Cash',
    });
    expect(mockDb.markSynced).toHaveBeenCalledWith(1, 55);
  });

  it('should sync unsynced send transactions', async () => {
    mockDb.getUnsynced.mockResolvedValue([
      {
        id: 2,
        serverId: null,
        type: 'send',
        amount: 50,
        description: 'Rent',
        recipientAccount: 'ACC00000002',
        synced: false,
        createdAt: '2026-03-07T11:00:00Z',
      },
    ]);
    mockApi.post.mockResolvedValue({ id: 56 });

    const count = await syncService.syncPending();

    expect(count).toBe(1);
    expect(mockApi.post).toHaveBeenCalledWith('/transactions/send', {
      amount: 50,
      description: 'Rent',
      recipient_account_number: 'ACC00000002',
    });
  });

  it('should continue syncing when one transaction fails', async () => {
    mockDb.getUnsynced.mockResolvedValue([
      { id: 1, serverId: null, type: 'deposit', amount: 100, description: 'A', recipientAccount: null, synced: false, createdAt: '' },
      { id: 2, serverId: null, type: 'deposit', amount: 200, description: 'B', recipientAccount: null, synced: false, createdAt: '' },
    ]);
    mockApi.post
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ id: 57 });

    const count = await syncService.syncPending();

    expect(count).toBe(1); // Only second succeeded
    expect(mockDb.markSynced).toHaveBeenCalledTimes(1);
    expect(mockDb.markSynced).toHaveBeenCalledWith(2, 57);
  });

  it('should return 0 when nothing to sync', async () => {
    mockDb.getUnsynced.mockResolvedValue([]);

    const count = await syncService.syncPending();
    expect(count).toBe(0);
  });
});
