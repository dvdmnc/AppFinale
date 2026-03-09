/**
 * SendMoney component tests — Red phase.
 * Test form validation, API call, and notification trigger.
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SendMoneyScreen from '../src/screens/SendMoneyScreen';

const mockGoBack = jest.fn();
const mockNavigation = { goBack: mockGoBack };

jest.mock('../src/services/api', () => ({
  api: {
    post: jest.fn(),
  },
}));

jest.mock('../src/services/db', () => ({
  dbService: {
    saveTransaction: jest.fn().mockResolvedValue(1),
  },
}));

jest.mock('../src/services/notifications', () => ({
  notificationService: {
    sendTransactionNotification: jest.fn().mockResolvedValue('notif-1'),
  },
}));

import { api } from '../src/services/api';
import { dbService } from '../src/services/db';
import { notificationService } from '../src/services/notifications';

const mockApi = api as jest.Mocked<typeof api>;

describe('SendMoneyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all input fields', () => {
    const { getByTestId } = render(
      <SendMoneyScreen navigation={mockNavigation} />
    );

    expect(getByTestId('recipient-input')).toBeTruthy();
    expect(getByTestId('amount-input')).toBeTruthy();
    expect(getByTestId('description-input')).toBeTruthy();
    expect(getByTestId('send-button')).toBeTruthy();
  });

  it('should call API and save locally on send', async () => {
    mockApi.post.mockResolvedValue({ id: 10, type: 'send', amount: '500.00' });

    const { getByTestId } = render(
      <SendMoneyScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByTestId('recipient-input'), 'ACC00000002');
    fireEvent.changeText(getByTestId('amount-input'), '500');
    fireEvent.changeText(getByTestId('description-input'), 'Rent');
    fireEvent.press(getByTestId('send-button'));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/transactions/send', {
        recipient_account_number: 'ACC00000002',
        amount: 500,
        description: 'Rent',
      });
    });
  });

  it('should trigger notification after successful send', async () => {
    mockApi.post.mockResolvedValue({ id: 10, type: 'send', amount: '500.00' });

    const { getByTestId } = render(
      <SendMoneyScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByTestId('recipient-input'), 'ACC00000002');
    fireEvent.changeText(getByTestId('amount-input'), '500');
    fireEvent.press(getByTestId('send-button'));

    await waitFor(() => {
      expect(notificationService.sendTransactionNotification).toHaveBeenCalledWith('send', 500);
    });
  });
});
