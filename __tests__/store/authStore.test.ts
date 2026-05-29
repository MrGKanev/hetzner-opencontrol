import * as Keychain from 'react-native-keychain';

jest.mock('../../src/api/client', () => ({
  createApiClient: jest.fn(),
  destroyApiClient: jest.fn(),
}));

jest.mock('../../src/api/servers', () => ({
  getServers: jest.fn(),
}));

jest.mock('../../src/services/biometrics', () => ({
  getBiometricType: jest.fn(() => Promise.resolve('none')),
  authenticateWithBiometrics: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../../src/store/projectsStore', () => ({
  useProjectsStore: {
    getState: () => ({ clearActiveProject: jest.fn() }),
  },
}));

import { useAuthStore } from '../../src/store/authStore';
import { createApiClient, destroyApiClient } from '../../src/api/client';
import { getServers } from '../../src/api/servers';
import {
  getBiometricType,
  authenticateWithBiometrics,
} from '../../src/services/biometrics';

const mockGetServers = getServers as jest.Mock;
const mockGetBiometricType = getBiometricType as jest.Mock;
const mockAuthWithBio = authenticateWithBiometrics as jest.Mock;
const mockKeychain = Keychain as jest.Mocked<typeof Keychain>;

const resetState = () =>
  useAuthStore.setState({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    biometricType: 'none',
  });

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetState();
    mockGetServers.mockResolvedValue([]);
    (mockKeychain.getGenericPassword as jest.Mock).mockResolvedValue(false);
  });

  // ── initial state ────────────────────────────────────────────────────────────

  it('has correct initial state', () => {
    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(false);
    expect(s.isLoading).toBe(false);
    expect(s.error).toBeNull();
    expect(s.biometricType).toBe('none');
  });

  // ── login ────────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('sets isAuthenticated=true on success', async () => {
      await useAuthStore.getState().login('valid-token', false);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('calls createApiClient with the provided token', async () => {
      await useAuthStore.getState().login('my-token', false);
      expect(createApiClient).toHaveBeenCalledWith('my-token');
    });

    it('validates the token by calling getServers', async () => {
      await useAuthStore.getState().login('tok', false);
      expect(mockGetServers).toHaveBeenCalledTimes(1);
    });

    it('saves token to keychain when saveToKeychain=true', async () => {
      await useAuthStore.getState().login('save-me', true);
      expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith(
        'apitoken',
        'save-me',
        expect.any(Object),
      );
    });

    it('does NOT call setGenericPassword when saveToKeychain=false', async () => {
      await useAuthStore.getState().login('tok', false);
      expect(mockKeychain.setGenericPassword).not.toHaveBeenCalled();
    });

    it('sets error and destroys client when getServers throws', async () => {
      mockGetServers.mockRejectedValueOnce(new Error('Invalid API key'));
      await useAuthStore.getState().login('bad-token', false);
      const { isAuthenticated, isLoading, error } = useAuthStore.getState();
      expect(isAuthenticated).toBe(false);
      expect(isLoading).toBe(false);
      expect(error).toBe('Invalid API key');
      expect(destroyApiClient).toHaveBeenCalled();
    });

    it('uses fallback error message when thrown value is not an Error', async () => {
      mockGetServers.mockRejectedValueOnce('oops');
      await useAuthStore.getState().login('tok', false);
      expect(useAuthStore.getState().error).toBe('Invalid API key');
    });
  });

  // ── logout ───────────────────────────────────────────────────────────────────

  describe('logout', () => {
    beforeEach(() => {
      useAuthStore.setState({ isAuthenticated: true });
    });

    it('sets isAuthenticated=false', async () => {
      await useAuthStore.getState().logout();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('calls resetGenericPassword with the service name', async () => {
      await useAuthStore.getState().logout();
      expect(mockKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: 'HetznerOpenControl',
      });
    });

    it('calls destroyApiClient', async () => {
      await useAuthStore.getState().logout();
      expect(destroyApiClient).toHaveBeenCalled();
    });

    it('clears error state', async () => {
      useAuthStore.setState({ error: 'some error' });
      await useAuthStore.getState().logout();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  // ── tryRestoreSession ────────────────────────────────────────────────────────

  describe('tryRestoreSession', () => {
    it('stores the biometricType returned by getBiometricType', async () => {
      mockGetBiometricType.mockResolvedValueOnce('FaceID');
      await useAuthStore.getState().tryRestoreSession();
      expect(useAuthStore.getState().biometricType).toBe('FaceID');
    });

    it('returns false when biometrics are available and credentials exist (require manual unlock)', async () => {
      mockGetBiometricType.mockResolvedValueOnce('FaceID');
      (mockKeychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({
        username: 'apitoken',
        password: 'stored-token',
      });
      const result = await useAuthStore.getState().tryRestoreSession();
      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('returns false when biometrics available but no credentials saved', async () => {
      mockGetBiometricType.mockResolvedValueOnce('TouchID');
      (mockKeychain.getGenericPassword as jest.Mock).mockResolvedValueOnce(false);
      const result = await useAuthStore.getState().tryRestoreSession();
      expect(result).toBe(false);
    });

    it('auto-restores session and returns true when no biometrics and credentials exist', async () => {
      mockGetBiometricType.mockResolvedValueOnce('none');
      (mockKeychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({
        username: 'apitoken',
        password: 'saved-token',
      });
      const result = await useAuthStore.getState().tryRestoreSession();
      expect(result).toBe(true);
      expect(createApiClient).toHaveBeenCalledWith('saved-token');
      expect(mockGetServers).toHaveBeenCalled();
    });

    it('returns false when no biometrics and no credentials', async () => {
      mockGetBiometricType.mockResolvedValueOnce('none');
      (mockKeychain.getGenericPassword as jest.Mock).mockResolvedValueOnce(false);
      const result = await useAuthStore.getState().tryRestoreSession();
      expect(result).toBe(false);
    });

    it('returns false and calls destroyApiClient when restore throws', async () => {
      mockGetBiometricType.mockResolvedValueOnce('none');
      (mockKeychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({
        username: 'apitoken',
        password: 'tok',
      });
      mockGetServers.mockRejectedValueOnce(new Error('Network error'));
      const result = await useAuthStore.getState().tryRestoreSession();
      expect(result).toBe(false);
      expect(destroyApiClient).toHaveBeenCalled();
    });
  });

  // ── unlockWithBiometrics ─────────────────────────────────────────────────────

  describe('unlockWithBiometrics', () => {
    it('authenticates, reads keychain, sets isAuthenticated=true on success', async () => {
      mockAuthWithBio.mockResolvedValueOnce(true);
      (mockKeychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({
        username: 'apitoken',
        password: 'secret',
      });

      const result = await useAuthStore.getState().unlockWithBiometrics();
      expect(result).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(createApiClient).toHaveBeenCalledWith('secret');
    });

    it('returns false and sets error when biometric prompt fails', async () => {
      mockAuthWithBio.mockResolvedValueOnce(false);
      const result = await useAuthStore.getState().unlockWithBiometrics();
      expect(result).toBe(false);
      expect(useAuthStore.getState().error).toBe('Biometric authentication failed');
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('returns false when biometrics pass but no credentials in keychain', async () => {
      mockAuthWithBio.mockResolvedValueOnce(true);
      (mockKeychain.getGenericPassword as jest.Mock).mockResolvedValueOnce(false);
      const result = await useAuthStore.getState().unlockWithBiometrics();
      expect(result).toBe(false);
    });

    it('returns false immediately when isLoading=true', async () => {
      useAuthStore.setState({ isLoading: true });
      const result = await useAuthStore.getState().unlockWithBiometrics();
      expect(result).toBe(false);
      expect(mockAuthWithBio).not.toHaveBeenCalled();
    });

    it('destroys client and sets error when getServers throws after biometric auth', async () => {
      mockAuthWithBio.mockResolvedValueOnce(true);
      (mockKeychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({
        username: 'apitoken',
        password: 'tok',
      });
      mockGetServers.mockRejectedValueOnce(new Error('Server error'));

      const result = await useAuthStore.getState().unlockWithBiometrics();
      expect(result).toBe(false);
      expect(destroyApiClient).toHaveBeenCalled();
      expect(useAuthStore.getState().error).toBe('Server error');
    });
  });

  // ── clearError ───────────────────────────────────────────────────────────────

  it('clearError sets error to null', () => {
    useAuthStore.setState({ error: 'oops' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });

  // ── session timeout ──────────────────────────────────────────────────────────

  describe('session timeout via AppState', () => {
    const flushPromises = () =>
      new Promise<void>((resolve) => resolve()).then(() =>
        new Promise<void>((resolve) => resolve()),
      );

    it('subscribes to AppState on login and unsubscribes on logout', async () => {
      const { AppState } = require('react-native');
      await useAuthStore.getState().login('tok', false);
      expect(AppState.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function),
      );

      const removeStub = (AppState.addEventListener as jest.Mock).mock.results[0]
        .value.remove;
      await useAuthStore.getState().logout();
      expect(removeStub).toHaveBeenCalled();
    });

    it('locks the session after 15 minutes in background', async () => {
      let fakeNow = Date.now();
      const realDateNow = Date.now;
      Date.now = jest.fn(() => fakeNow);

      try {
        const { AppState } = require('react-native');
        await useAuthStore.getState().login('tok', false);

        const [[, listener]] = (AppState.addEventListener as jest.Mock).mock.calls;

        listener('background');
        fakeNow += 15 * 60 * 1000 + 1; // advance past SESSION_TIMEOUT_MS
        listener('active');

        // logout() is async — flush microtasks so it completes
        await flushPromises();

        expect(useAuthStore.getState().isAuthenticated).toBe(false);
      } finally {
        Date.now = realDateNow;
      }
    });

    it('does NOT lock when returning to foreground before 15 minutes', async () => {
      let fakeNow = Date.now();
      const realDateNow = Date.now;
      Date.now = jest.fn(() => fakeNow);

      try {
        const { AppState } = require('react-native');
        await useAuthStore.getState().login('tok', false);

        const [[, listener]] = (AppState.addEventListener as jest.Mock).mock.calls;

        listener('background');
        fakeNow += 5 * 60 * 1000; // only 5 minutes — below threshold
        listener('active');

        await flushPromises();

        expect(useAuthStore.getState().isAuthenticated).toBe(true);
      } finally {
        Date.now = realDateNow;
      }
    });
  });
});
