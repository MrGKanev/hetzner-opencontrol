jest.mock('../../src/components/common/ActionSheet', () => ({
  showActionSheet: jest.fn(),
  ActionSheetModal: () => null,
}));

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useResourceList } from '../../src/hooks/useResourceList';
import { showActionSheet } from '../../src/components/common/ActionSheet';

const mockShowActionSheet = showActionSheet as jest.Mock;

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

const QUERY_KEY = ['test-resources'];

beforeEach(() => {
  jest.clearAllMocks();
});

// ── initial state ─────────────────────────────────────────────────────────────

it('returns empty array and loading=true initially', () => {
  const fetchFn = jest.fn().mockResolvedValue([]);
  const { result } = renderHook(
    () => useResourceList(QUERY_KEY, fetchFn),
    { wrapper: makeWrapper() },
  );

  expect(result.current.data).toEqual([]);
  expect(result.current.loading).toBe(true);
  expect(result.current.selected).toBeNull();
  expect(result.current.sheetVisible).toBe(false);
});

// ── data fetching ─────────────────────────────────────────────────────────────

it('returns fetched data after load', async () => {
  const items = [{ id: 1 }, { id: 2 }];
  const fetchFn = jest.fn().mockResolvedValue(items);

  const { result } = renderHook(
    () => useResourceList(QUERY_KEY, fetchFn),
    { wrapper: makeWrapper() },
  );

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toEqual(items);
});

// ── setData ───────────────────────────────────────────────────────────────────

it('setData with a direct array updates the cache', async () => {
  const items = [{ id: 1 }];
  const fetchFn = jest.fn().mockResolvedValue(items);
  const { result } = renderHook(
    () => useResourceList(QUERY_KEY, fetchFn),
    { wrapper: makeWrapper() },
  );

  await waitFor(() => expect(result.current.loading).toBe(false));

  await act(async () => { result.current.setData([{ id: 99 }]); });
  await waitFor(() => expect(result.current.data).toEqual([{ id: 99 }]));
});

it('setData with an updater function appends to existing data', async () => {
  const items = [{ id: 1 }];
  const fetchFn = jest.fn().mockResolvedValue(items);
  const { result } = renderHook(
    () => useResourceList(QUERY_KEY, fetchFn),
    { wrapper: makeWrapper() },
  );

  await waitFor(() => expect(result.current.loading).toBe(false));

  await act(async () => { result.current.setData((prev) => [...prev, { id: 2 }]); });
  await waitFor(() => expect(result.current.data).toEqual([{ id: 1 }, { id: 2 }]));
});

// ── selected / sheetVisible ───────────────────────────────────────────────────

it('openSheet sets selected item and calls showActionSheet on iOS', async () => {
  const fetchFn = jest.fn().mockResolvedValue([]);
  const { result } = renderHook(
    () => useResourceList(QUERY_KEY, fetchFn),
    { wrapper: makeWrapper() },
  );

  await waitFor(() => expect(result.current.loading).toBe(false));

  const item = { id: 5 };
  const options = [{ label: 'Delete' }];
  const onSelect = jest.fn();

  act(() => result.current.openSheet(item, 'Actions', options, onSelect));

  expect(result.current.selected).toBe(item);
  expect(mockShowActionSheet).toHaveBeenCalledWith({
    title: 'Actions',
    options,
    onSelect,
  });
  expect(result.current.sheetVisible).toBe(false); // iOS: doesn't open modal
});

it('setSelected updates selected item directly', async () => {
  const fetchFn = jest.fn().mockResolvedValue([]);
  const { result } = renderHook(
    () => useResourceList(QUERY_KEY, fetchFn),
    { wrapper: makeWrapper() },
  );

  await waitFor(() => expect(result.current.loading).toBe(false));

  const item = { id: 7 };
  act(() => result.current.setSelected(item));
  expect(result.current.selected).toBe(item);
});

it('setSheetVisible controls sheet visibility', async () => {
  const fetchFn = jest.fn().mockResolvedValue([]);
  const { result } = renderHook(
    () => useResourceList(QUERY_KEY, fetchFn),
    { wrapper: makeWrapper() },
  );

  await waitFor(() => expect(result.current.loading).toBe(false));

  act(() => result.current.setSheetVisible(true));
  expect(result.current.sheetVisible).toBe(true);

  act(() => result.current.setSheetVisible(false));
  expect(result.current.sheetVisible).toBe(false);
});
