import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { createApiClient, destroyApiClient } from '../api/client';
import { getServers } from '../api/servers';
import { useServerStore } from './serverStore';

export interface Project {
  id: string;
  name: string;
}

const keychainService = (id: string) => `HetznerOpenControl_${id}`;

function keychainOptions(id: string): Keychain.Options {
  return Platform.OS === 'ios'
    ? { service: keychainService(id), accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY }
    : { service: keychainService(id), storage: Keychain.STORAGE_TYPE.RSA, accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
}

interface ProjectsState {
  projects: Project[];
  activeProjectId: string | null;
  isLoading: boolean;
  error: string | null;

  addProject: (name: string, token: string) => Promise<boolean>;
  removeProject: (id: string) => Promise<void>;
  renameProject: (id: string, newName: string) => void;
  switchProject: (id: string) => Promise<boolean>;
  clearActiveProject: () => void;
  clearError: () => void;
  tryRestoreActiveProject: () => Promise<boolean>;
}

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      isLoading: false,
      error: null,

      addProject: async (name: string, token: string) => {
        set({ isLoading: true, error: null });
        try {
          // Validate token
          createApiClient(token);
          await getServers();

          const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          await Keychain.setGenericPassword('apitoken', token, keychainOptions(id));

          set(s => ({
            projects: [...s.projects, { id, name }],
            activeProjectId: id,
            isLoading: false,
          }));

          // Kick off a fresh server load
          useServerStore.setState({ servers: [], lastFetched: null });
          useServerStore.getState().fetchServers();

          // Signal authenticated
          const { useAuthStore } = require('./authStore');
          useAuthStore.setState({ isAuthenticated: true });
          return true;
        } catch (e: any) {
          destroyApiClient();
          set({ isLoading: false, error: e.message || 'Invalid API key' });
          return false;
        }
      },

      removeProject: async (id: string) => {
        await Keychain.resetGenericPassword({ service: keychainService(id) });
        const { projects, activeProjectId } = get();
        const remaining = projects.filter(p => p.id !== id);

        if (activeProjectId === id) {
          // Switch to another project or log out
          if (remaining.length > 0) {
            set({ projects: remaining });
            await get().switchProject(remaining[0].id);
          } else {
            destroyApiClient();
            set({ projects: [], activeProjectId: null });
            const { useAuthStore } = require('./authStore');
            useAuthStore.setState({ isAuthenticated: false });
          }
        } else {
          set({ projects: remaining });
        }
      },

      renameProject: (id: string, newName: string) => {
        set(s => ({
          projects: s.projects.map(p => p.id === id ? { ...p, name: newName } : p),
        }));
      },

      switchProject: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const credentials = await Keychain.getGenericPassword({ service: keychainService(id) });
          if (!credentials?.password) throw new Error('Token not found');

          createApiClient(credentials.password);
          await getServers();

          set({ activeProjectId: id, isLoading: false });

          // Clear cached server data so screens re-fetch for the new project
          useServerStore.setState({ servers: [], lastFetched: null });
          useServerStore.getState().fetchServers();

          const { useAuthStore } = require('./authStore');
          useAuthStore.setState({ isAuthenticated: true });
          return true;
        } catch (e: any) {
          destroyApiClient();
          set({ isLoading: false, error: e.message });
          return false;
        }
      },

      clearActiveProject: () => {
        set({ activeProjectId: null });
      },

      clearError: () => set({ error: null }),

      tryRestoreActiveProject: async () => {
        const { projects, activeProjectId } = get();
        if (!activeProjectId || projects.length === 0) return false;
        return get().switchProject(activeProjectId);
      },
    }),
    {
      name: 'app-projects',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist project metadata, not loading/error state
      partialize: (s) => ({ projects: s.projects, activeProjectId: s.activeProjectId }),
    },
  ),
);
