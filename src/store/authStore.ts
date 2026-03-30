import { create } from 'zustand';
import * as Keychain from 'react-native-keychain';
import { createApiClient, destroyApiClient } from '../api/client';
import { getServers } from '../api/servers';

const KEYCHAIN_SERVICE = 'HetznerOpenControl';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (token: string, saveToKeychain: boolean) => Promise<void>;
  logout: () => Promise<void>;
  tryRestoreSession: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (token: string, saveToKeychain: boolean) => {
    set({ isLoading: true, error: null });
    try {
      createApiClient(token);
      // Validate token by making a real API call
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
    try {
      const credentials = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
      if (credentials && credentials.password) {
        createApiClient(credentials.password);
        await getServers();
        return true;
      }
    } catch {
      destroyApiClient();
    }
    return false;
  },

  clearError: () => set({ error: null }),
}));
