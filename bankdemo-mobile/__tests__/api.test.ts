/**
 * API service unit tests — Red phase.
 * Test that api service correctly uses SecureStore for tokens  
 * and builds requests with proper headers.
 */
import * as SecureStore from 'expo-secure-store';

// We test the api module directly, which uses SecureStore under the hood.
// SecureStore is mocked in jest.setup.ts.

describe('api service — token storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should store token using expo-secure-store', async () => {
    const { api } = require('../src/services/api');

    await api.setToken('my-secret-token');

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'bankdemo_auth_token',
      'my-secret-token'
    );
  });

  it('should retrieve token from expo-secure-store', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('stored-token');
    const { api } = require('../src/services/api');

    const token = await api.getToken();

    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('bankdemo_auth_token');
    expect(token).toBe('stored-token');
  });

  it('should clear token from expo-secure-store', async () => {
    const { api } = require('../src/services/api');

    await api.clearToken();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('bankdemo_auth_token');
  });

  it('should return null when no token stored', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    const { api } = require('../src/services/api');

    const token = await api.getToken();
    expect(token).toBeNull();
  });
});
