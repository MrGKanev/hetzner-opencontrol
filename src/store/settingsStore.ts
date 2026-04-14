import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const REFRESH_INTERVALS = [
  { label: 'Off', value: 0 },
  { label: '30s', value: 30 },
  { label: '1 min', value: 60 },
  { label: '2 min', value: 120 },
  { label: '5 min', value: 300 },
] as const;

interface SettingsState {
  hapticsEnabled: boolean;
  refreshInterval: number; // seconds; 0 = disabled
  notificationsEnabled: boolean;

  setHapticsEnabled: (v: boolean) => void;
  setRefreshInterval: (v: number) => void;
  setNotificationsEnabled: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hapticsEnabled: true,
      refreshInterval: 0,
      notificationsEnabled: false,

      setHapticsEnabled: (v) => set({ hapticsEnabled: v }),
      setRefreshInterval: (v) => set({ refreshInterval: v }),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
    }),
    {
      name: 'app-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
