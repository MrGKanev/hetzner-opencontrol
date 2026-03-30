import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, type ThemeColors } from '../theme';

interface ThemeState {
  isDark: boolean;
  colors: ThemeColors;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: true,
      colors: darkColors,
      toggle: () =>
        set((s) => {
          const isDark = !s.isDark;
          return { isDark, colors: isDark ? darkColors : lightColors };
        }),
    }),
    {
      name: 'app-theme',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist isDark; rehydrate colors from it
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.colors = state.isDark ? darkColors : lightColors;
        }
      },
    },
  ),
);

export function useColors(): ThemeColors {
  return useThemeStore((s) => s.colors);
}
