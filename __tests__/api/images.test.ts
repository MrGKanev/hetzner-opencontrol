jest.mock('../../src/api/client', () => ({
  getApiClient: jest.fn(),
}));

import { getApiClient } from '../../src/api/client';
import {
  getImages,
  deleteImage,
  updateImage,
  createSnapshot,
} from '../../src/api/images';

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

function okPage(images: object[], nextPage: number | null = null) {
  return {
    data: {
      images,
      meta: { pagination: { next_page: nextPage } },
    },
  };
}

// ── getImages ──────────────────────────────────────────────────────────────────

describe('getImages', () => {
  it('fetches snapshot images on a single page', async () => {
    const img = { id: 1, type: 'snapshot', description: 'snap-01' };
    mockClient.get.mockResolvedValueOnce(okPage([img]));

    const result = await getImages('snapshot');
    expect(result).toEqual([img]);
    expect(mockClient.get).toHaveBeenCalledWith('/images', {
      params: { page: 1, per_page: 50, type: 'snapshot' },
    });
  });

  it('fetches backup images on a single page', async () => {
    const img = { id: 2, type: 'backup' };
    mockClient.get.mockResolvedValueOnce(okPage([img]));

    await getImages('backup');
    expect(mockClient.get).toHaveBeenCalledWith('/images', {
      params: { page: 1, per_page: 50, type: 'backup' },
    });
  });

  it('paginates until next_page is null', async () => {
    const p1 = [{ id: 1 }];
    const p2 = [{ id: 2 }];
    mockClient.get
      .mockResolvedValueOnce(okPage(p1, 2))
      .mockResolvedValueOnce(okPage(p2, null));

    const result = await getImages('snapshot');
    expect(result).toEqual([...p1, ...p2]);
    expect(mockClient.get).toHaveBeenCalledTimes(2);
  });

  it('returns empty array when no images exist', async () => {
    mockClient.get.mockResolvedValueOnce(okPage([]));
    const result = await getImages('backup');
    expect(result).toEqual([]);
  });
});

// ── deleteImage ────────────────────────────────────────────────────────────────

it('deleteImage sends DELETE to the correct endpoint', async () => {
  mockClient.delete.mockResolvedValueOnce({});
  await deleteImage(5);
  expect(mockClient.delete).toHaveBeenCalledWith('/images/5');
});

// ── updateImage ────────────────────────────────────────────────────────────────

it('updateImage puts data and returns the updated image', async () => {
  const updated = { id: 3, description: 'new desc', type: 'snapshot' };
  mockClient.put.mockResolvedValueOnce({ data: { image: updated } });

  const result = await updateImage(3, { description: 'new desc', type: 'snapshot' });
  expect(result).toEqual(updated);
  expect(mockClient.put).toHaveBeenCalledWith('/images/3', {
    description: 'new desc',
    type: 'snapshot',
  });
});

it('updateImage accepts partial data', async () => {
  const updated = { id: 4, description: 'only-desc' };
  mockClient.put.mockResolvedValueOnce({ data: { image: updated } });

  const result = await updateImage(4, { description: 'only-desc' });
  expect(result).toEqual(updated);
  expect(mockClient.put).toHaveBeenCalledWith('/images/4', { description: 'only-desc' });
});

// ── createSnapshot ─────────────────────────────────────────────────────────────

it('createSnapshot posts to the server actions endpoint and returns image + action', async () => {
  const image = { id: 10, type: 'snapshot' };
  const action = { id: 1, status: 'running' };
  mockClient.post.mockResolvedValueOnce({ data: { image, action } });

  const result = await createSnapshot(7, 'my-snapshot');
  expect(result).toEqual({ image, action });
  expect(mockClient.post).toHaveBeenCalledWith('/servers/7/actions/create_image', {
    type: 'snapshot',
    description: 'my-snapshot',
  });
});

it('createSnapshot works without a description', async () => {
  const image = { id: 11 };
  const action = { id: 2 };
  mockClient.post.mockResolvedValueOnce({ data: { image, action } });

  const result = await createSnapshot(7);
  expect(result).toEqual({ image, action });
  expect(mockClient.post).toHaveBeenCalledWith('/servers/7/actions/create_image', {
    type: 'snapshot',
    description: undefined,
  });
});
