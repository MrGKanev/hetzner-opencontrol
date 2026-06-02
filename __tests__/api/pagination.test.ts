jest.mock('../../src/api/client', () => ({
  getApiClient: jest.fn(),
}));

import { getApiClient } from '../../src/api/client';
import { fetchAllPages } from '../../src/api/pagination';

const mockClient = { get: jest.fn() };

beforeEach(() => {
  // resetAllMocks clears the mockResolvedValueOnce queue too — clearAllMocks does not
  jest.resetAllMocks();
  (getApiClient as jest.Mock).mockReturnValue(mockClient);
});

function page(items: object[], nextPage: number | null = null) {
  return { data: { items, meta: { pagination: { next_page: nextPage } } } };
}

describe('fetchAllPages', () => {
  // ── single page ─────────────────────────────────────────────────────────────

  it('returns items from a single page', async () => {
    mockClient.get.mockResolvedValueOnce(page([{ id: 1 }, { id: 2 }]));
    const result = await fetchAllPages('/items', 'items');
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    expect(mockClient.get).toHaveBeenCalledTimes(1);
  });

  it('calls the correct path with page=1 and per_page=50 by default', async () => {
    mockClient.get.mockResolvedValueOnce(page([]));
    await fetchAllPages('/things', 'items');
    expect(mockClient.get).toHaveBeenCalledWith('/things', {
      params: { page: 1, per_page: 50 },
    });
  });

  it('returns an empty array when the first page has no items', async () => {
    mockClient.get.mockResolvedValueOnce(page([]));
    expect(await fetchAllPages('/items', 'items')).toEqual([]);
  });

  // ── pagination ───────────────────────────────────────────────────────────────

  it('follows next_page until null, accumulating all items', async () => {
    mockClient.get
      .mockResolvedValueOnce(page([{ id: 1 }], 2))
      .mockResolvedValueOnce(page([{ id: 2 }], 3))
      .mockResolvedValueOnce(page([{ id: 3 }]));
    const result = await fetchAllPages('/items', 'items');
    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(mockClient.get).toHaveBeenCalledTimes(3);
  });

  it('sends the correct page number on each subsequent request', async () => {
    mockClient.get
      .mockResolvedValueOnce(page([{ id: 1 }], 2))
      .mockResolvedValueOnce(page([{ id: 2 }]));
    await fetchAllPages('/items', 'items');
    expect(mockClient.get).toHaveBeenNthCalledWith(2, '/items', {
      params: { page: 2, per_page: 50 },
    });
  });

  // ── null safety ───────────────────────────────────────────────────────────────

  it('stops when meta is missing entirely', async () => {
    mockClient.get.mockResolvedValueOnce({ data: { items: [{ id: 1 }] } });
    const result = await fetchAllPages('/items', 'items');
    expect(result).toEqual([{ id: 1 }]);
    expect(mockClient.get).toHaveBeenCalledTimes(1);
  });

  it('stops when meta.pagination is missing', async () => {
    mockClient.get.mockResolvedValueOnce({ data: { items: [{ id: 1 }], meta: {} } });
    const result = await fetchAllPages('/items', 'items');
    expect(result).toEqual([{ id: 1 }]);
    expect(mockClient.get).toHaveBeenCalledTimes(1);
  });

  it('stops when next_page is 0 (falsy)', async () => {
    mockClient.get.mockResolvedValueOnce({
      data: { items: [{ id: 1 }], meta: { pagination: { next_page: 0 } } },
    });
    const result = await fetchAllPages('/items', 'items');
    expect(result).toEqual([{ id: 1 }]);
    expect(mockClient.get).toHaveBeenCalledTimes(1);
  });

  // ── limit ────────────────────────────────────────────────────────────────────

  it('stops fetching after reaching the limit', async () => {
    mockClient.get
      .mockResolvedValueOnce(page([{ id: 1 }, { id: 2 }], 2))
      .mockResolvedValueOnce(page([{ id: 3 }], 3));
    const result = await fetchAllPages('/items', 'items', undefined, 2);
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    expect(mockClient.get).toHaveBeenCalledTimes(1);
  });

  it('without a limit fetches all pages regardless of count', async () => {
    const bigPage = Array.from({ length: 50 }, (_, i) => ({ id: i }));
    mockClient.get
      .mockResolvedValueOnce(page(bigPage, 2))
      .mockResolvedValueOnce(page(bigPage, 3))
      .mockResolvedValueOnce(page(bigPage));
    const result = await fetchAllPages('/items', 'items');
    expect(result).toHaveLength(150);
    expect(mockClient.get).toHaveBeenCalledTimes(3);
  });

  // ── custom params ─────────────────────────────────────────────────────────────

  it('merges custom params with page and per_page', async () => {
    mockClient.get.mockResolvedValueOnce(page([]));
    await fetchAllPages('/images', 'items', { type: 'snapshot', status: 'available' });
    expect(mockClient.get).toHaveBeenCalledWith('/images', {
      params: { type: 'snapshot', status: 'available', page: 1, per_page: 50 },
    });
  });

  it('passes custom params on every subsequent page request', async () => {
    mockClient.get
      .mockResolvedValueOnce(page([{ id: 1 }], 2))
      .mockResolvedValueOnce(page([]));
    await fetchAllPages('/ssh_keys', 'items', { label_selector: 'env=prod' });
    expect(mockClient.get).toHaveBeenNthCalledWith(2, '/ssh_keys', {
      params: { label_selector: 'env=prod', page: 2, per_page: 50 },
    });
  });
});
