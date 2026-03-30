import { create } from 'zustand';
import * as Keychain from 'react-native-keychain';
import { createApiClient, destroyApiClient } from '../api/client';
import { getServers } from '../api/servers';
import { authenticateWithBiometrics, getBiometricType, type BiometricType } from '../services/biometrics';

const KEYCHAIN_SERVICE = 'HetznerOpenControl';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  biometricType: BiometricType;

  login: (token: string, saveToKeychain: boolean) => Promise<void>;
  logout: () => Promise<void>;
  tryRestoreSession: () => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: false,
  error: null,
  biometricType: 'none',

  login: async (token: string, saveToKeychain: boolean) => {
    set({ isLoading: true, error: null });
    try {
      createApiClient(token);
      await getServers();

      if (saveToKeychain) {
        await Keychain.setGenericPassword('apitoken', token, {
          service: KEYCHAIN_SERVICE,
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
      }

      set({ isAuthenticated: true, isLoading: false });
    } catch (e: any) {
      destroyApiClient();
      set({ isLoading: false, error: e.message || 'Invalid API key' });
    }
  },

  logout: async () => {
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
    destroyApiClient();
    set({ isAuthenticated: false, error: null });
  },

  tryRestoreSession: async () => {
    // Check biometric availability while we're at it
    const biometricType = await getBiometricType();
    set({ biometricType });

    try {
      // Check if a saved key exists without prompting biometrics yet
      const credentials = await Keychain.getGenericPassword({
        service: KEYCHAIN_SERVICE,
        authenticationPrompt: { title: 'Unlock Hetzner OpenControl' },
      });
      if (credentials && credentials.password) {
        createApiClient(credentials.password);
        await getServers();
        return true;
      }
    } catch {
      // Keychain access denied or no credentials — show login screen
      destroyApiClient();
    }
    return false;
  },

  unlockWithBiometrics: async () => {
    set({ isLoading: true, error: null });
    try {
      const authenticated = await authenticateWithBiometrics('Unlock Hetzner OpenControl');
      if (!authenticated) {
        set({ isLoading: false, error: 'Biometric authentication failed' });
        return false;
      }

      const credentials = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
      if (!credentials || !credentials.password) {
        set({ isLoading: false });
        return false;
      }

      createApiClient(credentials.password);
      await getServers();
      set({ isAuthenticated: true, isLoading: false });
      return true;
    } catch (e: any) {
      destroyApiClient();
      set({ isLoading: false, error: e.message });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
