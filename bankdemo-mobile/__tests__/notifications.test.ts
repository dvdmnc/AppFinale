/**
 * Notification service unit tests — Red phase.
 */
import { notificationService } from '../src/services/notifications';
import * as Notifications from 'expo-notifications';

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should request permission and return true when granted', async () => {
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });

    const result = await notificationService.requestPermission();
    expect(result).toBe(true);
  });

  it('should request permission and return false when denied', async () => {
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    const result = await notificationService.requestPermission();
    expect(result).toBe(false);
  });

  it('should send deposit notification with correct content', async () => {
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notif-1');

    const id = await notificationService.sendTransactionNotification('deposit', 250);

    expect(id).toBe('notif-1');
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: 'Deposit Received',
        body: '$250.00 has been deposited to your account.',
        data: { type: 'deposit', amount: 250 },
      },
      trigger: null,
    });
  });

  it('should send send-money notification with correct content', async () => {
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notif-2');

    const id = await notificationService.sendTransactionNotification('send', 100.5);

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: 'Money Sent',
        body: '$100.50 has been sent successfully.',
        data: { type: 'send', amount: 100.5 },
      },
      trigger: null,
    });
  });
});
