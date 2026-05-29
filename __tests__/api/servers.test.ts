jest.mock('../../src/api/client', () => ({
  getApiClient: jest.fn(),
}));

import { getApiClient } from '../../src/api/client';
import {
  getServers,
  getServer,
  powerOnServer,
  powerOffServer,
  rebootServer,
  resetServer,
  shutdownServer,
  deleteServer,
  updateServer,
  requestConsole,
  getServerMetrics,
  createServer,
  getServerActions,
  enableRescueMode,
  disableRescueMode,
  attachIso,
  detachIso,
  rebuildServer,
  changeServerType,
  getServerTypes,
  getImages,
  getIsos,
  getPlacementGroups,
  deletePlacementGroup,
} from '../../src/api/servers';

const mockClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (getApiClient as jest.Mock).mockReturnValue(mockClient);
});

// ── helpers ────────────────────────────────────────────────────────────────────

function okPage(servers: object[], nextPage: number | null = null) {
  return {
    data: {
      servers,
      meta: { pagination: { next_page: nextPage } },
    },
  };
}

function okAction() {
  return { data: { action: { id: 1, status: 'success' } } };
}

// ── getServers ─────────────────────────────────────────────────────────────────

describe('getServers', () => {
  it('fetches a single page and returns servers', async () => {
    const s1 = { id: 1, name: 'web-01' };
    const s2 = { id: 2, name: 'db-01' };
    mockClient.get.mockResolvedValueOnce(okPage([s1, s2]));

    const result = await getServers();
    expect(result).toEqual([s1, s2]);
    expect(mockClient.get).toHaveBeenCalledTimes(1);
    expect(mockClient.get).toHaveBeenCalledWith('/servers', {
      params: { page: 1, per_page: 50 },
    });
  });

  it('paginates until next_page is null', async () => {
    const p1 = [{ id: 1 }];
    const p2 = [{ id: 2 }];
    mockClient.get
      .mockResolvedValueOnce(okPage(p1, 2))
      .mockResolvedValueOnce(okPage(p2, null));

    const result = await getServers();
    expect(result).toEqual([...p1, ...p2]);
    expect(mockClient.get).toHaveBeenCalledTimes(2);
    expect(mockClient.get).toHaveBeenNthCalledWith(2, '/servers', {
      params: { page: 2, per_page: 50 },
    });
  });

  it('returns empty array when no servers exist', async () => {
    mockClient.get.mockResolvedValueOnce(okPage([]));
    const result = await getServers();
    expect(result).toEqual([]);
  });
});

// ── getServer ──────────────────────────────────────────────────────────────────

it('getServer fetches a single server by id', async () => {
  const server = { id: 42, name: 'srv' };
  mockClient.get.mockResolvedValueOnce({ data: { server } });

  const result = await getServer(42);
  expect(result).toEqual(server);
  expect(mockClient.get).toHaveBeenCalledWith('/servers/42');
});

// ── power actions ──────────────────────────────────────────────────────────────

describe('power actions', () => {
  it.each([
    ['powerOnServer', powerOnServer, '/servers/1/actions/poweron'],
    ['powerOffServer', powerOffServer, '/servers/1/actions/poweroff'],
    ['rebootServer', rebootServer, '/servers/1/actions/reboot'],
    ['resetServer', resetServer, '/servers/1/actions/reset'],
    ['shutdownServer', shutdownServer, '/servers/1/actions/shutdown'],
  ])('%s posts to the correct endpoint and returns the action', async (_, fn, path) => {
    const action = { id: 99, status: 'running' };
    mockClient.post.mockResolvedValueOnce({ data: { action } });

    const result = await fn(1);
    expect(result).toEqual(action);
    expect(mockClient.post).toHaveBeenCalledWith(path);
  });
});

// ── rescue mode ────────────────────────────────────────────────────────────────

describe('rescue mode', () => {
  it('enableRescueMode posts with type and ssh_keys', async () => {
    mockClient.post.mockResolvedValueOnce({
      data: { action: okAction().data.action, root_password: 'abc123' },
    });
    const result = await enableRescueMode(5, 'linux64', [1, 2]);
    expect(mockClient.post).toHaveBeenCalledWith(
      '/servers/5/actions/enable_rescue',
      { type: 'linux64', ssh_keys: [1, 2] },
    );
    expect(result.root_password).toBe('abc123');
  });

  it('disableRescueMode posts to the correct endpoint', async () => {
    mockClient.post.mockResolvedValueOnce(okAction());
    await disableRescueMode(5);
    expect(mockClient.post).toHaveBeenCalledWith('/servers/5/actions/disable_rescue');
  });
});

// ── ISO actions ────────────────────────────────────────────────────────────────

it('attachIso posts with iso id', async () => {
  mockClient.post.mockResolvedValueOnce(okAction());
  await attachIso(3, 10);
  expect(mockClient.post).toHaveBeenCalledWith(
    '/servers/3/actions/attach_iso',
    { iso: 10 },
  );
});

it('detachIso posts to the correct endpoint', async () => {
  mockClient.post.mockResolvedValueOnce(okAction());
  await detachIso(3);
  expect(mockClient.post).toHaveBeenCalledWith('/servers/3/actions/detach_iso');
});

// ── rebuild / change type ──────────────────────────────────────────────────────

it('rebuildServer posts with image and returns action + password', async () => {
  mockClient.post.mockResolvedValueOnce({
    data: { action: okAction().data.action, root_password: 'newpass' },
  });
  const result = await rebuildServer(7, 'ubuntu-22.04');
  expect(mockClient.post).toHaveBeenCalledWith('/servers/7/actions/rebuild', {
    image: 'ubuntu-22.04',
  });
  expect(result.root_password).toBe('newpass');
});

it('changeServerType posts with server_type and upgrade_disk', async () => {
  mockClient.post.mockResolvedValueOnce(okAction());
  await changeServerType(7, 'cx21', true);
  expect(mockClient.post).toHaveBeenCalledWith('/servers/7/actions/change_type', {
    server_type: 'cx21',
    upgrade_disk: true,
  });
});

// ── CRUD ──────────────────────────────────────────────────────────────────────

it('updateServer puts data and returns the updated server', async () => {
  const updated = { id: 1, name: 'renamed' };
  mockClient.put.mockResolvedValueOnce({ data: { server: updated } });

  const result = await updateServer(1, { name: 'renamed' });
  expect(result).toEqual(updated);
  expect(mockClient.put).toHaveBeenCalledWith('/servers/1', { name: 'renamed' });
});

it('deleteServer sends DELETE and returns the action', async () => {
  const action = { id: 5 };
  mockClient.delete.mockResolvedValueOnce({ data: { action } });

  const result = await deleteServer(1);
  expect(result).toEqual(action);
  expect(mockClient.delete).toHaveBeenCalledWith('/servers/1');
});

// ── console ───────────────────────────────────────────────────────────────────

it('requestConsole posts and returns wss_url + password', async () => {
  const payload = { wss_url: 'wss://console', password: 'pw' };
  mockClient.post.mockResolvedValueOnce({ data: payload });

  const result = await requestConsole(1);
  expect(result).toEqual(payload);
  expect(mockClient.post).toHaveBeenCalledWith('/servers/1/actions/request_console');
});

// ── metrics ───────────────────────────────────────────────────────────────────

it('getServerMetrics fetches with correct params', async () => {
  mockClient.get.mockResolvedValueOnce({ data: { metrics: {} } });

  const start = new Date('2024-01-01T00:00:00Z');
  const end = new Date('2024-01-01T01:00:00Z');
  await getServerMetrics(1, 'cpu', start, end, 60);

  expect(mockClient.get).toHaveBeenCalledWith('/servers/1/metrics', {
    params: {
      type: 'cpu',
      start: start.toISOString(),
      end: end.toISOString(),
      step: 60,
    },
  });
});

it('getServerMetrics omits step param when not provided', async () => {
  mockClient.get.mockResolvedValueOnce({ data: { metrics: {} } });
  const start = new Date();
  const end = new Date();
  await getServerMetrics(1, 'disk', start, end);

  const { params } = mockClient.get.mock.calls[0][1];
  expect(params.step).toBeUndefined();
});

// ── activity log ──────────────────────────────────────────────────────────────

describe('getServerActions', () => {
  it('fetches actions and returns them', async () => {
    const actions = [{ id: 1 }, { id: 2 }];
    mockClient.get.mockResolvedValueOnce({
      data: { actions, meta: { pagination: { next_page: null } } },
    });

    const result = await getServerActions(1);
    expect(result).toEqual(actions);
    expect(mockClient.get).toHaveBeenCalledWith('/servers/1/actions', {
      params: { page: 1, per_page: 50, sort: 'id:desc' },
    });
  });

  it('stops pagination after collecting 100 actions', async () => {
    const hundredActions = Array.from({ length: 50 }, (_, i) => ({ id: i }));
    mockClient.get
      .mockResolvedValueOnce({
        data: { actions: hundredActions, meta: { pagination: { next_page: 2 } } },
      })
      .mockResolvedValueOnce({
        data: { actions: hundredActions, meta: { pagination: { next_page: 3 } } },
      });

    const result = await getServerActions(1);
    expect(result).toHaveLength(100);
    expect(mockClient.get).toHaveBeenCalledTimes(2);
  });
});

// ── create server ─────────────────────────────────────────────────────────────

it('createServer posts params and returns server + action + password', async () => {
  const payload = {
    server: { id: 99 },
    action: { id: 1 },
    root_password: 'root',
  };
  mockClient.post.mockResolvedValueOnce({ data: payload });

  const result = await createServer({ name: 'new', server_type: 'cx11', image: 'ubuntu-22.04' });
  expect(result).toEqual(payload);
  expect(mockClient.post).toHaveBeenCalledWith('/servers', {
    name: 'new',
    server_type: 'cx11',
    image: 'ubuntu-22.04',
  });
});

// ── server types / images / ISOs / placement groups ────────────────────────────

it('getServerTypes fetches with per_page=100', async () => {
  mockClient.get.mockResolvedValueOnce({ data: { server_types: [] } });
  await getServerTypes();
  expect(mockClient.get).toHaveBeenCalledWith('/server_types', {
    params: { per_page: 100 },
  });
});

describe('getImages', () => {
  it('paginates until no next_page', async () => {
    const imgs = [{ id: 1 }];
    mockClient.get
      .mockResolvedValueOnce({ data: { images: imgs, meta: { pagination: { next_page: 2 } } } })
      .mockResolvedValueOnce({ data: { images: [], meta: { pagination: { next_page: null } } } });

    const result = await getImages('system');
    expect(result).toEqual(imgs);
    expect(mockClient.get).toHaveBeenCalledTimes(2);
  });
});

it('getIsos fetches public ISOs', async () => {
  mockClient.get.mockResolvedValueOnce({ data: { isos: [] } });
  await getIsos();
  expect(mockClient.get).toHaveBeenCalledWith('/isos', {
    params: { per_page: 100, type: 'public' },
  });
});

it('getPlacementGroups fetches all with per_page=100', async () => {
  mockClient.get.mockResolvedValueOnce({ data: { placement_groups: [] } });
  await getPlacementGroups();
  expect(mockClient.get).toHaveBeenCalledWith('/placement_groups', {
    params: { per_page: 100 },
  });
});

it('deletePlacementGroup sends DELETE', async () => {
  mockClient.delete.mockResolvedValueOnce({ data: null });
  await deletePlacementGroup(5);
  expect(mockClient.delete).toHaveBeenCalledWith('/placement_groups/5');
});
