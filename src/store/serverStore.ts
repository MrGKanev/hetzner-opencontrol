import { create } from 'zustand';
import * as serverApi from '../api/servers';
import type { Server } from '../models';

interface ServerState {
  servers: Server[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  fetchServers: () => Promise<void>;
  refreshServers: () => Promise<void>;
  updateServerInList: (server: Server) => void;
  removeServerFromList: (id: number) => void;
}

export const useServerStore = create<ServerState>((set, get) => ({
  servers: [],
  isLoading: false,
  error: null,
  lastFetched: null,

  fetchServers: async () => {
    const { lastFetched, isLoading } = get();
    // Skip if fetched in last 30 seconds
    if (isLoading || (lastFetched && Date.now() - lastFetched < 30_000)) return;

    set({ isLoading: true, error: null });
    try {
      const servers = await serverApi.getServers();
      set({ servers, isLoading: false, lastFetched: Date.now() });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  refreshServers: async () => {
    set({ isLoading: true, error: null, lastFetched: null });
    try {
      const servers = await serverApi.getServers();
      set({ servers, isLoading: false, lastFetched: Date.now() });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  updateServerInList: (server: Server) => {
    set(state => ({
      servers: state.servers.map(s => s.id === server.id ? server : s),
    }));
  },

  removeServerFromList: (id: number) => {
    set(state => ({
      servers: state.servers.filter(s => s.id !== id),
    }));
  },
}));
