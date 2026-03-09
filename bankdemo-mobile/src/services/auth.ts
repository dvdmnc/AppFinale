import { api } from './api';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_KEY = 'bankdemo_biometric_enabled';
const CREDENTIALS_KEY = 'bankdemo_credentials';

export interface LoginResponse {
  token: string;
  user: { id: number; name: string; email: string };
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const data = await api.post<LoginResponse>('/login', { email, password });
    await api.setToken(data.token);
    await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify({ email, password }));
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/logout', {});
    await api.clearToken();
  },

  async getUser() {
    return api.get<{ id: number; name: string; email: string }>('/user');
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await api.getToken();
    return token !== null;
  },

  /** Validate that the stored token is still accepted by the server */
  async validateToken(): Promise<boolean> {
    try {
      await api.get('/user');
      return true;
    } catch {
      await api.clearToken();
      return false;
    }
  },

  async isBiometricEnabled(): Promise<boolean> {
    const val = await SecureStore.getItemAsync(BIOMETRIC_KEY);
    return val === 'true';
  },

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(BIOMETRIC_KEY, enabled ? 'true' : 'false');
  },

  async biometricUnlock(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Déverrouiller BankDemo',
      fallbackLabel: 'Utiliser le code',
    });
    return result.success;
  },

  async biometricLogin(): Promise<boolean> {
    const unlocked = await this.biometricUnlock();
    if (!unlocked) return false;

    const hasToken = await this.isAuthenticated();
    if (hasToken) {
      const valid = await this.validateToken();
      if (valid) return true;
    }

    const stored = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    if (!stored) return false;
    const { email, password } = JSON.parse(stored);
    await this.login(email, password);
    return true;
  },
};
