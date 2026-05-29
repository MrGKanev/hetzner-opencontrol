jest.mock('../../src/api/client', () => ({
  getApiClient: jest.fn(),
}));

import { getApiClient } from '../../src/api/client';
import {
  getSshKeys,
  createSshKey,
  deleteSshKey,
  updateSshKey,
} from '../../src/api/sshKeys';

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

function okPage(ssh_keys: object[], nextPage: number | null = null) {
  return {
    data: {
      ssh_keys,
      meta: { pagination: { next_page: nextPage } },
    },
  };
}

// ── getSshKeys ─────────────────────────────────────────────────────────────────

describe('getSshKeys', () => {
  it('fetches a single page and returns SSH keys', async () => {
    const k1 = { id: 1, name: 'my-key' };
    const k2 = { id: 2, name: 'deploy-key' };
    mockClient.get.mockResolvedValueOnce(okPage([k1, k2]));

    const result = await getSshKeys();
    expect(result).toEqual([k1, k2]);
    expect(mockClient.get).toHaveBeenCalledWith('/ssh_keys', {
      params: { page: 1, per_page: 50 },
    });
  });

  it('paginates until next_page is null', async () => {
    const p1 = [{ id: 1 }];
    const p2 = [{ id: 2 }];
    mockClient.get
      .mockResolvedValueOnce(okPage(p1, 2))
      .mockResolvedValueOnce(okPage(p2, null));

    const result = await getSshKeys();
    expect(result).toEqual([...p1, ...p2]);
    expect(mockClient.get).toHaveBeenCalledTimes(2);
    expect(mockClient.get).toHaveBeenNthCalledWith(2, '/ssh_keys', {
      params: { page: 2, per_page: 50 },
    });
  });

  it('returns empty array when no SSH keys exist', async () => {
    mockClient.get.mockResolvedValueOnce(okPage([]));
    const result = await getSshKeys();
    expect(result).toEqual([]);
  });
});

// ── createSshKey ───────────────────────────────────────────────────────────────

it('createSshKey posts name and public_key and returns the new key', async () => {
  const key = { id: 5, name: 'new-key', fingerprint: 'aa:bb' };
  mockClient.post.mockResolvedValueOnce({ data: { ssh_key: key } });

  const result = await createSshKey('new-key', 'ssh-rsa AAAA...');
  expect(result).toEqual(key);
  expect(mockClient.post).toHaveBeenCalledWith('/ssh_keys', {
    name: 'new-key',
    public_key: 'ssh-rsa AAAA...',
  });
});

// ── deleteSshKey ───────────────────────────────────────────────────────────────

it('deleteSshKey sends DELETE to the correct endpoint', async () => {
  mockClient.delete.mockResolvedValueOnce({});
  await deleteSshKey(3);
  expect(mockClient.delete).toHaveBeenCalledWith('/ssh_keys/3');
});

// ── updateSshKey ───────────────────────────────────────────────────────────────

it('updateSshKey puts the new name and returns the updated key', async () => {
  const updated = { id: 4, name: 'renamed-key' };
  mockClient.put.mockResolvedValueOnce({ data: { ssh_key: updated } });

  const result = await updateSshKey(4, 'renamed-key');
  expect(result).toEqual(updated);
  expect(mockClient.put).toHaveBeenCalledWith('/ssh_keys/4', { name: 'renamed-key' });
});
