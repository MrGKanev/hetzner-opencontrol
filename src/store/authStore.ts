import { create } from "zustand";
import { Platform, AppState, type AppStateStatus } from "react-native";
import * as Keychain from "react-native-keychain";
import { createApiClient, destroyApiClient } from "../api/client";
import { getServers } from "../api/servers";
import {
  authenticateWithBiometrics,
  getBiometricType,
  type BiometricType,
} from "../services/biometrics";

const KEYCHAIN_SERVICE = "HetznerOpenControl";
const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

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

let backgroundedAt: number | null = null;
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null =
  null;

function startSessionWatch(lockFn: () => void) {
  appStateSubscription?.remove();
  appStateSubscription = AppState.addEventListener(
    "change",
    (next: AppStateStatus) => {
      if (next === "background" || next === "inactive") {
        backgroundedAt = Date.now();
      } else if (next === "active" && backgroundedAt !== null) {
        if (Date.now() - backgroundedAt >= SESSION_TIMEOUT_MS) {
          lockFn();
        }
        backgroundedAt = null;
      }
    },
  );
}

function stopSessionWatch() {
  appStateSubscription?.remove();
  appStateSubscription = null;
  backgroundedAt = null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: false,
  error: null,
  biometricType: "none",

  login: async (token: string, saveToKeychain: boolean) => {
    set({ isLoading: true, error: null });
    try {
      createApiClient(token);
      await getServers();

      if (saveToKeychain) {
        // Do NOT use ACCESS_CONTROL at save-time — on both iOS and Android it can
        // trigger a biometric/passcode prompt while the spinner is showing, causing
        // the app to hang silently. Biometric gate is enforced manually in
        // unlockWithBiometrics before we ever read the key back.
        const keychainOptions: Keychain.SetOptions =
          Platform.OS === "ios"
            ? {
                service: KEYCHAIN_SERVICE,
                accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
              }
            : {
                service: KEYCHAIN_SERVICE,
                storage: Keychain.STORAGE_TYPE.RSA,
                accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
              };
        await Keychain.setGenericPassword("apitoken", token, keychainOptions);
      }

      set({ isAuthenticated: true, isLoading: false });
      startSessionWatch(() => get().logout());
    } catch (e: unknown) {
      destroyApiClient();
      set({
        isLoading: false,
        error: (e instanceof Error ? e.message : null) ?? "Invalid API key",
      });
    }
  },

  logout: async () => {
    stopSessionWatch();
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
    destroyApiClient();
    // Also clear multi-project state if any
    const { useProjectsStore } = require("./projectsStore");
    useProjectsStore.getState().clearActiveProject();
    set({ isAuthenticated: false, error: null });
  },

  tryRestoreSession: async () => {
    // Check biometric availability while we're at it
    const biometricType = await getBiometricType();
    set({ biometricType });

    // If biometrics are available, require the user to authenticate manually —
    // do NOT auto-login with the stored key. The LoginScreen will show the
    // biometric button and call unlockWithBiometrics().
    if (biometricType !== "none") {
      // Peek at keychain to see if a key exists (no biometric prompt, no ACCESS_CONTROL).
      try {
        const credentials = await Keychain.getGenericPassword({
          service: KEYCHAIN_SERVICE,
        });
        if (credentials && credentials.password) {
          // Credentials exist — stay on login screen so biometrics can gate access.
          return false;
        }
      } catch {
        // No credentials saved — show login screen.
      }
      return false;
    }

    try {
      const credentials = await Keychain.getGenericPassword({
        service: KEYCHAIN_SERVICE,
      });
      if (credentials && credentials.password) {
        createApiClient(credentials.password);
        await getServers();
        startSessionWatch(() => get().logout());
        return true;
      }
    } catch {
      destroyApiClient();
    }
    return false;
  },

  unlockWithBiometrics: async () => {
    if (get().isLoading) return false;
    set({ isLoading: true, error: null });
    try {
      const authenticated = await authenticateWithBiometrics(
        "Unlock Hetzner OpenControl",
      );
      if (!authenticated) {
        set({ isLoading: false, error: "Biometric authentication failed" });
        return false;
      }

      const credentials = await Keychain.getGenericPassword({
        service: KEYCHAIN_SERVICE,
      });
      if (!credentials || !credentials.password) {
        set({ isLoading: false });
        return false;
      }

      createApiClient(credentials.password);
      await getServers();
      set({ isAuthenticated: true, isLoading: false });
      startSessionWatch(() => get().logout());
      return true;
    } catch (e: unknown) {
      destroyApiClient();
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : "Unknown error",
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
