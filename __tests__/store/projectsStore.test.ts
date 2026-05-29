jest.mock('../../src/api/client', () => ({
  createApiClient: jest.fn(),
  destroyApiClient: jest.fn(),
}));

jest.mock('../../src/api/servers', () => ({
  getServers: jest.fn(),
}));

jest.mock('../../src/api/queryClient', () => ({
  queryClient: { invalidateQueries: jest.fn(), removeQueries: jest.fn() },
}));

jest.mock('../../src/hooks/useServersQuery', () => ({
  SERVERS_KEY: ['servers'],
}));

jest.mock('../../src/store/authStore', () => ({
  useAuthStore: { setState: jest.fn() },
}));

import * as Keychain from 'react-native-keychain';
import { createApiClient, destroyApiClient } from '../../src/api/client';
import { getServers } from '../../src/api/servers';
import { queryClient } from '../../src/api/queryClient';
import { useAuthStore } from '../../src/store/authStore';
import { useProjectsStore } from '../../src/store/projectsStore';

const mockGetServers = getServers as jest.Mock;
const mockKeychain = Keychain as jest.Mocked<typeof Keychain>;

const resetStore = () =>
  useProjectsStore.setState({
    projects: [],
    activeProjectId: null,
    isLoading: false,
    error: null,
  });

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
  mockGetServers.mockResolvedValue([]);
  (mockKeychain.getGenericPassword as jest.Mock).mockResolvedValue(false);
});

// ── addProject ────────────────────────────────────────────────────────────────

describe('addProject', () => {
  it('validates the token, saves to keychain, and adds project to store', async () => {
    const ok = await useProjectsStore.getState().addProject('My Project', 'tok123');
    expect(ok).toBe(true);
    expect(createApiClient).toHaveBeenCalledWith('tok123');
    expect(mockGetServers).toHaveBeenCalled();
    expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith(
      'apitoken',
      'tok123',
      expect.any(Object),
    );

    const { projects, activeProjectId } = useProjectsStore.getState();
    expect(projects).toHaveLength(1);
    expect(projects[0]!.name).toBe('My Project');
    expect(activeProjectId).toBe(projects[0]!.id);
  });

  it('signals isAuthenticated=true via authStore on success', async () => {
    await useProjectsStore.getState().addProject('Proj', 'tok');
    expect((useAuthStore as any).setState).toHaveBeenCalledWith({ isAuthenticated: true });
  });

  it('sets error and returns false when getServers throws', async () => {
    mockGetServers.mockRejectedValueOnce(new Error('Bad token'));
    const ok = await useProjectsStore.getState().addProject('Proj', 'bad');
    expect(ok).toBe(false);
    expect(useProjectsStore.getState().error).toBe('Bad token');
    expect(destroyApiClient).toHaveBeenCalled();
  });

  it('does not add a project on failure', async () => {
    mockGetServers.mockRejectedValueOnce(new Error('fail'));
    await useProjectsStore.getState().addProject('Proj', 'bad');
    expect(useProjectsStore.getState().projects).toHaveLength(0);
  });
});

// ── renameProject ─────────────────────────────────────────────────────────────

describe('renameProject', () => {
  it('updates the project name', () => {
    useProjectsStore.setState({
      projects: [{ id: 'p1', name: 'Old Name' }],
      activeProjectId: 'p1',
    });
    useProjectsStore.getState().renameProject('p1', 'New Name');
    expect(useProjectsStore.getState().projects[0]!.name).toBe('New Name');
  });

  it('does not affect other projects', () => {
    useProjectsStore.setState({
      projects: [
        { id: 'p1', name: 'Keep' },
        { id: 'p2', name: 'Change' },
      ],
    });
    useProjectsStore.getState().renameProject('p2', 'Changed');
    expect(useProjectsStore.getState().projects[0]!.name).toBe('Keep');
    expect(useProjectsStore.getState().projects[1]!.name).toBe('Changed');
  });
});

// ── removeProject ─────────────────────────────────────────────────────────────

describe('removeProject', () => {
  it('removes a non-active project from the list', async () => {
    useProjectsStore.setState({
      projects: [
        { id: 'p1', name: 'Active' },
        { id: 'p2', name: 'Other' },
      ],
      activeProjectId: 'p1',
    });
    await useProjectsStore.getState().removeProject('p2');
    expect(useProjectsStore.getState().projects).toHaveLength(1);
    expect(useProjectsStore.getState().projects[0]!.id).toBe('p1');
  });

  it('resets keychain when removing a project', async () => {
    useProjectsStore.setState({
      projects: [{ id: 'p1', name: 'P1' }, { id: 'p2', name: 'P2' }],
      activeProjectId: 'p1',
    });
    await useProjectsStore.getState().removeProject('p2');
    expect(mockKeychain.resetGenericPassword).toHaveBeenCalledWith({
      service: 'HetznerOpenControl_p2',
    });
  });

  it('logs out when removing the last project', async () => {
    useProjectsStore.setState({
      projects: [{ id: 'p1', name: 'Only' }],
      activeProjectId: 'p1',
    });
    await useProjectsStore.getState().removeProject('p1');
    const { projects, activeProjectId } = useProjectsStore.getState();
    expect(projects).toHaveLength(0);
    expect(activeProjectId).toBeNull();
    expect(destroyApiClient).toHaveBeenCalled();
    expect((useAuthStore as any).setState).toHaveBeenCalledWith({ isAuthenticated: false });
  });

  it('switches to another project when active project is removed', async () => {
    (mockKeychain.getGenericPassword as jest.Mock).mockResolvedValue({
      username: 'apitoken',
      password: 'tok-p2',
    });
    useProjectsStore.setState({
      projects: [
        { id: 'p1', name: 'Active' },
        { id: 'p2', name: 'Fallback' },
      ],
      activeProjectId: 'p1',
    });
    await useProjectsStore.getState().removeProject('p1');
    expect(useProjectsStore.getState().activeProjectId).toBe('p2');
  });
});

// ── switchProject ─────────────────────────────────────────────────────────────

describe('switchProject', () => {
  it('reads keychain, creates client, updates activeProjectId', async () => {
    (mockKeychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({
      username: 'apitoken',
      password: 'secret',
    });
    useProjectsStore.setState({
      projects: [{ id: 'p1', name: 'P1' }],
      activeProjectId: null,
    });

    const ok = await useProjectsStore.getState().switchProject('p1');
    expect(ok).toBe(true);
    expect(createApiClient).toHaveBeenCalledWith('secret');
    expect(useProjectsStore.getState().activeProjectId).toBe('p1');
  });

  it('returns false and sets error when token not found in keychain', async () => {
    (mockKeychain.getGenericPassword as jest.Mock).mockResolvedValueOnce(false);
    useProjectsStore.setState({ projects: [{ id: 'p1', name: 'P1' }] });

    const ok = await useProjectsStore.getState().switchProject('p1');
    expect(ok).toBe(false);
    expect(useProjectsStore.getState().error).toBe('Token not found');
  });

  it('returns false and destroys client when getServers throws', async () => {
    (mockKeychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({
      username: 'apitoken',
      password: 'tok',
    });
    mockGetServers.mockRejectedValueOnce(new Error('Network error'));
    useProjectsStore.setState({ projects: [{ id: 'p1', name: 'P1' }] });

    const ok = await useProjectsStore.getState().switchProject('p1');
    expect(ok).toBe(false);
    expect(destroyApiClient).toHaveBeenCalled();
  });
});

// ── clearActiveProject ────────────────────────────────────────────────────────

it('clearActiveProject sets activeProjectId to null', () => {
  useProjectsStore.setState({ activeProjectId: 'p1' });
  useProjectsStore.getState().clearActiveProject();
  expect(useProjectsStore.getState().activeProjectId).toBeNull();
});

// ── clearError ────────────────────────────────────────────────────────────────

it('clearError sets error to null', () => {
  useProjectsStore.setState({ error: 'oops' });
  useProjectsStore.getState().clearError();
  expect(useProjectsStore.getState().error).toBeNull();
});

// ── tryRestoreActiveProject ───────────────────────────────────────────────────

describe('tryRestoreActiveProject', () => {
  it('returns false when there are no projects', async () => {
    const ok = await useProjectsStore.getState().tryRestoreActiveProject();
    expect(ok).toBe(false);
  });

  it('returns false when there is no active project', async () => {
    useProjectsStore.setState({
      projects: [{ id: 'p1', name: 'P1' }],
      activeProjectId: null,
    });
    const ok = await useProjectsStore.getState().tryRestoreActiveProject();
    expect(ok).toBe(false);
  });

  it('calls switchProject with the active project id', async () => {
    (mockKeychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({
      username: 'apitoken',
      password: 'tok',
    });
    useProjectsStore.setState({
      projects: [{ id: 'p1', name: 'P1' }],
      activeProjectId: 'p1',
    });
    const ok = await useProjectsStore.getState().tryRestoreActiveProject();
    expect(ok).toBe(true);
    expect(createApiClient).toHaveBeenCalledWith('tok');
  });
});
