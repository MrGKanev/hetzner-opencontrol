jest.mock('../../src/api/client', () => ({
  getApiClient: jest.fn(),
}));

import { getApiClient } from '../../src/api/client';
import {
  getVolumes,
  getVolume,
  createVolume,
  attachVolume,
  detachVolume,
  resizeVolume,
  deleteVolume,
} from '../../src/api/volumes';

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

function okPage(volumes: object[], nextPage: number | null = null) {
  return {
    data: {
      volumes,
      meta: { pagination: { next_page: nextPage } },
    },
  };
}

function okAction() {
  return { data: { action: { id: 1, status: 'success' } } };
}

// ── getVolumes ─────────────────────────────────────────────────────────────────

describe('getVolumes', () => {
  it('fetches a single page and returns volumes', async () => {
    const v1 = { id: 1, name: 'vol-01' };
    const v2 = { id: 2, name: 'vol-02' };
    mockClient.get.mockResolvedValueOnce(okPage([v1, v2]));

    const result = await getVolumes();
    expect(result).toEqual([v1, v2]);
    expect(mockClient.get).toHaveBeenCalledWith('/volumes', {
      params: { page: 1, per_page: 50 },
    });
  });

  it('paginates until next_page is null', async () => {
    const p1 = [{ id: 1 }];
    const p2 = [{ id: 2 }];
    mockClient.get
      .mockResolvedValueOnce(okPage(p1, 2))
      .mockResolvedValueOnce(okPage(p2, null));

    const result = await getVolumes();
    expect(result).toEqual([...p1, ...p2]);
    expect(mockClient.get).toHaveBeenCalledTimes(2);
    expect(mockClient.get).toHaveBeenNthCalledWith(2, '/volumes', {
      params: { page: 2, per_page: 50 },
    });
  });

  it('returns empty array when no volumes exist', async () => {
    mockClient.get.mockResolvedValueOnce(okPage([]));
    const result = await getVolumes();
    expect(result).toEqual([]);
  });
});

// ── getVolume ──────────────────────────────────────────────────────────────────

it('getVolume fetches a single volume by id', async () => {
  const volume = { id: 42, name: 'data-vol' };
  mockClient.get.mockResolvedValueOnce({ data: { volume } });

  const result = await getVolume(42);
  expect(result).toEqual(volume);
  expect(mockClient.get).toHaveBeenCalledWith('/volumes/42');
});

// ── createVolume ───────────────────────────────────────────────────────────────

it('createVolume posts params and returns volume + action', async () => {
  const volume = { id: 10, name: 'new-vol' };
  const action = { id: 1, status: 'running' };
  mockClient.post.mockResolvedValueOnce({ data: { volume, action } });

  const result = await createVolume({ name: 'new-vol', size: 10, location: 'fsn1' });
  expect(result).toEqual({ volume, action });
  expect(mockClient.post).toHaveBeenCalledWith('/volumes', {
    name: 'new-vol',
    size: 10,
    location: 'fsn1',
  });
});

it('createVolume works with server attachment', async () => {
  const volume = { id: 11, name: 'srv-vol' };
  const action = { id: 2 };
  mockClient.post.mockResolvedValueOnce({ data: { volume, action } });

  const result = await createVolume({ name: 'srv-vol', size: 20, server: 99, format: 'ext4' });
  expect(result.volume).toEqual(volume);
  expect(mockClient.post).toHaveBeenCalledWith('/volumes', {
    name: 'srv-vol',
    size: 20,
    server: 99,
    format: 'ext4',
  });
});

// ── attachVolume ───────────────────────────────────────────────────────────────

it('attachVolume posts server id and returns the action', async () => {
  mockClient.post.mockResolvedValueOnce(okAction());
  const result = await attachVolume(5, 99);
  expect(result).toEqual(okAction().data.action);
  expect(mockClient.post).toHaveBeenCalledWith('/volumes/5/actions/attach', {
    server: 99,
    automount: undefined,
  });
});

it('attachVolume passes automount flag when provided', async () => {
  mockClient.post.mockResolvedValueOnce(okAction());
  await attachVolume(5, 99, true);
  expect(mockClient.post).toHaveBeenCalledWith('/volumes/5/actions/attach', {
    server: 99,
    automount: true,
  });
});

// ── detachVolume ───────────────────────────────────────────────────────────────

it('detachVolume posts to the correct endpoint and returns the action', async () => {
  mockClient.post.mockResolvedValueOnce(okAction());
  const result = await detachVolume(7);
  expect(result).toEqual(okAction().data.action);
  expect(mockClient.post).toHaveBeenCalledWith('/volumes/7/actions/detach');
});

// ── resizeVolume ───────────────────────────────────────────────────────────────

it('resizeVolume posts the new size and returns the action', async () => {
  mockClient.post.mockResolvedValueOnce(okAction());
  const result = await resizeVolume(3, 50);
  expect(result).toEqual(okAction().data.action);
  expect(mockClient.post).toHaveBeenCalledWith('/volumes/3/actions/resize', { size: 50 });
});

// ── deleteVolume ───────────────────────────────────────────────────────────────

it('deleteVolume sends DELETE to the correct endpoint', async () => {
  mockClient.delete.mockResolvedValueOnce({});
  await deleteVolume(8);
  expect(mockClient.delete).toHaveBeenCalledWith('/volumes/8');
});
