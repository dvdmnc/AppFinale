/**
 * Dashboard component tests — Red phase.
 * Test rendering of balance, transaction list, and navigation buttons.
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DashboardScreen from '../src/screens/DashboardScreen';

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate };

// Mock services
jest.mock('../src/services/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

jest.mock('../src/services/db', () => ({
  dbService: {
    getTransactions: jest.fn().mockResolvedValue([]),
    saveTransaction: jest.fn(),
  },
}));

jest.mock('../src/services/sync', () => ({
  syncService: {
    syncPending: jest.fn().mockResolvedValue(0),
  },
}));

import { api } from '../src/services/api';
import { dbService } from '../src/services/db';

const mockApi = api as jest.Mocked<typeof api>;
const mockDb = dbService as jest.Mocked<typeof dbService>;

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.get.mockImplementation((endpoint: string) => {
      if (endpoint === '/account') {
        return Promise.resolve({ id: 1, account_number: 'ACC00000001', balance: '5000.00' });
      }
      if (endpoint === '/transactions') {
        return Promise.resolve({
          data: [
            { id: 1, type: 'deposit', amount: '1000.00', description: 'Salary', created_at: '2026-03-07' },
            { id: 2, type: 'send', amount: '250.00', description: 'Rent', created_at: '2026-03-06' },
          ],
        });
      }
      return Promise.resolve({});
    });
  });

  it('should display balance from API', async () => {
    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByTestId('balance-text').props.children).toContain('5000.00');
    });
  });

  it('should display transaction list', async () => {
    const { getByTestId, getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Salary')).toBeTruthy();
      expect(getByText('Rent')).toBeTruthy();
    });
  });

  it('should navigate to SendMoney on button press', async () => {
    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByTestId('send-money-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('SendMoney');
  });

  it('should navigate to ATMMap on button press', async () => {
    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByTestId('atm-map-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('ATMMap');
  });
});
