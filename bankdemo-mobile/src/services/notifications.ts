import { Alert, Platform } from 'react-native';

// Local-only notification service (no expo-notifications dependency)
// Works in Expo Go on all SDK versions without requiring a dev build.

export const notificationService = {
  async requestPermission(): Promise<boolean> {
    // Local alerts always available
    return true;
  },

  async sendTransactionNotification(type: 'send' | 'deposit', amount: number): Promise<string> {
    const title = type === 'deposit' ? 'Deposit Received' : 'Money Sent';
    const body =
      type === 'deposit'
        ? `€${amount.toFixed(2)} has been deposited to your account.`
        : `€${amount.toFixed(2)} has been sent successfully.`;

    Alert.alert(title, body);
    return 'local-alert';
  },
};
