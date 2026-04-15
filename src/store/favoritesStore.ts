import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesState {
  serverIds: number[];
  toggle: (id: number) => void;
  isFavorite: (id: number) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      serverIds: [],
      toggle: (id) =>
        set((s) => ({
          serverIds: s.serverIds.includes(id)
            ? s.serverIds.filter(i => i !== id)
            : [...s.serverIds, id],
        })),
      isFavorite: (id) => get().serverIds.includes(id),
    }),
    {
      name: 'server-favorites',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
