jest.mock('../../src/api/client', () => ({
  getApiClient: jest.fn(),
}));

import { getApiClient } from '../../src/api/client';
import {
  getFloatingIps,
  assignFloatingIp,
  unassignFloatingIp,
  deleteFloatingIp,
  updateFloatingIp,
} from '../../src/api/floatingIps';

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

function okPage(floating_ips: object[], nextPage: number | null = null) {
  return {
    data: {
      floating_ips,
      meta: { pagination: { next_page: nextPage } },
    },
  };
}

function okAction() {
  return { data: { action: { id: 1, status: 'success' } } };
}

// ── getFloatingIps ─────────────────────────────────────────────────────────────

describe('getFloatingIps', () => {
  it('fetches a single page and returns floating IPs', async () => {
    const ip1 = { id: 1, ip: '1.2.3.4' };
    const ip2 = { id: 2, ip: '5.6.7.8' };
    mockClient.get.mockResolvedValueOnce(okPage([ip1, ip2]));

    const result = await getFloatingIps();
    expect(result).toEqual([ip1, ip2]);
    expect(mockClient.get).toHaveBeenCalledWith('/floating_ips', {
      params: { page: 1, per_page: 50 },
    });
  });

  it('paginates until next_page is null', async () => {
    const p1 = [{ id: 1 }];
    const p2 = [{ id: 2 }];
    mockClient.get
      .mockResolvedValueOnce(okPage(p1, 2))
      .mockResolvedValueOnce(okPage(p2, null));

    const result = await getFloatingIps();
    expect(result).toEqual([...p1, ...p2]);
    expect(mockClient.get).toHaveBeenCalledTimes(2);
    expect(mockClient.get).toHaveBeenNthCalledWith(2, '/floating_ips', {
      params: { page: 2, per_page: 50 },
    });
  });

  it('returns empty array when no floating IPs exist', async () => {
    mockClient.get.mockResolvedValueOnce(okPage([]));
    const result = await getFloatingIps();
    expect(result).toEqual([]);
  });
});

// ── assignFloatingIp ───────────────────────────────────────────────────────────

it('assignFloatingIp posts the server id and returns the action', async () => {
  const action = { id: 10, status: 'running' };
  mockClient.post.mockResolvedValueOnce({ data: { action } });

  const result = await assignFloatingIp(5, 99);
  expect(result).toEqual(action);
  expect(mockClient.post).toHaveBeenCalledWith('/floating_ips/5/actions/assign', {
    server: 99,
  });
});

// ── unassignFloatingIp ─────────────────────────────────────────────────────────

it('unassignFloatingIp posts to the correct endpoint and returns the action', async () => {
  mockClient.post.mockResolvedValueOnce(okAction());
  const result = await unassignFloatingIp(7);
  expect(mockClient.post).toHaveBeenCalledWith('/floating_ips/7/actions/unassign');
  expect(result).toEqual(okAction().data.action);
});

// ── deleteFloatingIp ───────────────────────────────────────────────────────────

it('deleteFloatingIp sends DELETE to the correct endpoint', async () => {
  mockClient.delete.mockResolvedValueOnce({});
  await deleteFloatingIp(3);
  expect(mockClient.delete).toHaveBeenCalledWith('/floating_ips/3');
});

// ── updateFloatingIp ───────────────────────────────────────────────────────────

it('updateFloatingIp puts data and returns the updated floating IP', async () => {
  const updated = { id: 3, name: 'renamed', description: 'new desc' };
  mockClient.put.mockResolvedValueOnce({ data: { floating_ip: updated } });

  const result = await updateFloatingIp(3, { name: 'renamed', description: 'new desc' });
  expect(result).toEqual(updated);
  expect(mockClient.put).toHaveBeenCalledWith('/floating_ips/3', {
    name: 'renamed',
    description: 'new desc',
  });
});

it('updateFloatingIp accepts partial data', async () => {
  const updated = { id: 3, name: 'only-name' };
  mockClient.put.mockResolvedValueOnce({ data: { floating_ip: updated } });

  const result = await updateFloatingIp(3, { name: 'only-name' });
  expect(result).toEqual(updated);
  expect(mockClient.put).toHaveBeenCalledWith('/floating_ips/3', { name: 'only-name' });
});
