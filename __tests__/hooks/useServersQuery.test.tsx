jest.mock('../../src/api/servers', () => ({ getServers: jest.fn() }));
jest.mock('../../src/api/queryClient', () => ({
  queryClient: { invalidateQueries: jest.fn(), setQueryData: jest.fn() },
}));

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getServers } from '../../src/api/servers';
import { queryClient } from '../../src/api/queryClient';
import {
  useServersQuery,
  invalidateServers,
  setServersData,
  SERVERS_KEY,
} from '../../src/hooks/useServersQuery';

const mockGetServers = getServers as jest.Mock;

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetServers.mockResolvedValue([]);
});

// ── useServersQuery ────────────────────────────────────────────────────────────

describe('useServersQuery', () => {
  it('is in loading state initially', () => {
    const { result } = renderHook(() => useServersQuery(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns server data after fetch resolves', async () => {
    const servers = [{ id: 1, name: 'srv' }];
    mockGetServers.mockResolvedValue(servers);

    const { result } = renderHook(() => useServersQuery(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(servers);
  });

  it('returns empty array as default data', async () => {
    mockGetServers.mockResolvedValue([]);
    const { result } = renderHook(() => useServersQuery(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);
  });

  it('exposes isRefetching=false initially', async () => {
    const { result } = renderHook(() => useServersQuery(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isRefetching).toBe(false);
  });
});

// ── invalidateServers ─────────────────────────────────────────────────────────

it('invalidateServers calls queryClient.invalidateQueries with SERVERS_KEY', () => {
  invalidateServers();
  expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
    queryKey: SERVERS_KEY,
  });
});

// ── setServersData ────────────────────────────────────────────────────────────

describe('setServersData', () => {
  it('calls setQueryData with a direct array', () => {
    const newData = [{ id: 2, name: 'db' }] as any[];
    setServersData(newData);
    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      SERVERS_KEY,
      expect.any(Function),
    );
  });

  it('calls setQueryData with an updater function', () => {
    const updater = (prev: any[]) => [...prev, { id: 3 }];
    setServersData(updater);
    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      SERVERS_KEY,
      expect.any(Function),
    );
  });
});
