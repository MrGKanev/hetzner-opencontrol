import { create } from 'zustand';
import { Platform } from 'react-native';
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
        // On Android, ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE prompts
        // the user at save-time too, which can hang silently. Use platform-level
        // hardware encryption instead; biometric prompt only happens on read.
        const keychainOptions: Keychain.Options = Platform.OS === 'ios'
          ? {
              service: KEYCHAIN_SERVICE,
              accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
              accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            }
          : {
              service: KEYCHAIN_SERVICE,
              storage: Keychain.STORAGE_TYPE.RSA,
              accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            };
        await Keychain.setGenericPassword('apitoken', token, keychainOptions);
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
      // On iOS we can check keychain existence without biometric prompt.
      // On Android we read directly (no ACCESS_CONTROL set on save, so no prompt needed).
      const credentials = await Keychain.getGenericPassword({
        service: KEYCHAIN_SERVICE,
        ...(Platform.OS === 'ios'
          ? { authenticationPrompt: { title: 'Unlock Hetzner OpenControl' } }
          : {}),
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
