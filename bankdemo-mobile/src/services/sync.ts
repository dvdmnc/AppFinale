import { dbService, LocalTransaction } from './db';
import { api } from './api';

const MAX_RETRIES = 3;

export const syncService = {
  /**
   * Attempt to sync all unsynced local transactions to the server.
   * Returns count of successfully synced items.
   */
  async syncPending(): Promise<number> {
    const unsynced = await dbService.getUnsynced();
    let synced = 0;

    for (const tx of unsynced) {
      try {
        const endpoint = tx.type === 'deposit' ? '/transactions/deposit' : '/transactions/send';
        const body: Record<string, unknown> = {
          amount: tx.amount,
          description: tx.description,
        };
        if (tx.type === 'send' && tx.recipientAccount) {
          body.recipient_account_number = tx.recipientAccount;
        }

        const result = await api.post<{ id: number }>(endpoint, body);
        await dbService.markSynced(tx.id!, result.id);
        synced++;
      } catch {
        // Will retry next sync cycle
        continue;
      }
    }

    return synced;
  },
};
