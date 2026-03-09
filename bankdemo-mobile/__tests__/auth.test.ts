/**
 * Auth service unit tests — Red phase.
 * Mock the API and SecureStore to test auth logic in isolation.
 */
import { authService } from '../src/services/auth';
import { api } from '../src/services/api';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

// Mock the api module
jest.mock('../src/services/api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
    setToken: jest.fn(),
    getToken: jest.fn(),
    clearToken: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── login ─────────────────────────────────────────────────

  it('should call API login and store token', async () => {
    const mockResponse = {
      token: 'test-token-123',
      user: { id: 1, name: 'Demo', email: 'demo@test.com' },
    };
    mockApi.post.mockResolvedValue(mockResponse);

    const result = await authService.login('demo@test.com', 'password');

    expect(mockApi.post).toHaveBeenCalledWith('/login', {
      email: 'demo@test.com',
      password: 'password',
    });
    expect(mockApi.setToken).toHaveBeenCalledWith('test-token-123');
    expect(result.user.email).toBe('demo@test.com');
  });

  it('should throw on invalid login', async () => {
    mockApi.post.mockRejectedValue(new Error('Invalid credentials'));

    await expect(authService.login('bad@test.com', 'wrong')).rejects.toThrow(
      'Invalid credentials'
    );
    expect(mockApi.setToken).not.toHaveBeenCalled();
  });

  // ── logout ────────────────────────────────────────────────

  it('should call API logout and clear token', async () => {
    mockApi.post.mockResolvedValue({});

    await authService.logout();

    expect(mockApi.post).toHaveBeenCalledWith('/logout', {});
    expect(mockApi.clearToken).toHaveBeenCalled();
  });

  // ── isAuthenticated ───────────────────────────────────────

  it('should return true when token exists', async () => {
    mockApi.getToken.mockResolvedValue('some-token');

    const result = await authService.isAuthenticated();
    expect(result).toBe(true);
  });

  it('should return false when no token', async () => {
    mockApi.getToken.mockResolvedValue(null);

    const result = await authService.isAuthenticated();
    expect(result).toBe(false);
  });

  // ── biometricUnlock ───────────────────────────────────────

  it('should return true on successful biometric auth', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
      success: true,
    });

    const result = await authService.biometricUnlock();
    expect(result).toBe(true);
  });

  it('should return false when no biometric hardware', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);

    const result = await authService.biometricUnlock();
    expect(result).toBe(false);
  });

  it('should return false when biometric not enrolled', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);

    const result = await authService.biometricUnlock();
    expect(result).toBe(false);
  });

  it('should return false when biometric auth fails', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
      success: false,
    });

    const result = await authService.biometricUnlock();
    expect(result).toBe(false);
  });

  // ── getUser ───────────────────────────────────────────────

  it('should fetch user profile', async () => {
    mockApi.get.mockResolvedValue({ id: 1, name: 'Demo', email: 'demo@test.com' });

    const user = await authService.getUser();
    expect(mockApi.get).toHaveBeenCalledWith('/user');
    expect(user.email).toBe('demo@test.com');
  });
});
