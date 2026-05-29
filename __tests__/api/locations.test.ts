jest.mock('../../src/api/client', () => ({
  getApiClient: jest.fn(),
}));

import { getApiClient } from '../../src/api/client';
import { getLocations, getDatacenters } from '../../src/api/locations';

const mockClient = {
  get: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (getApiClient as jest.Mock).mockReturnValue(mockClient);
});

// ── getLocations ───────────────────────────────────────────────────────────────

describe('getLocations', () => {
  it('fetches locations with per_page=100 and returns them', async () => {
    const locations = [
      { id: 1, name: 'fsn1', city: 'Falkenstein' },
      { id: 2, name: 'nbg1', city: 'Nuremberg' },
    ];
    mockClient.get.mockResolvedValueOnce({ data: { locations } });

    const result = await getLocations();
    expect(result).toEqual(locations);
    expect(mockClient.get).toHaveBeenCalledWith('/locations', { params: { per_page: 100 } });
  });

  it('returns empty array when no locations exist', async () => {
    mockClient.get.mockResolvedValueOnce({ data: { locations: [] } });
    const result = await getLocations();
    expect(result).toEqual([]);
  });
});

// ── getDatacenters ─────────────────────────────────────────────────────────────

describe('getDatacenters', () => {
  it('fetches datacenters with per_page=100 and returns them', async () => {
    const datacenters = [
      { id: 1, name: 'fsn1-dc14', description: 'Falkenstein DC 14' },
      { id: 2, name: 'nbg1-dc3', description: 'Nuremberg DC 3' },
    ];
    mockClient.get.mockResolvedValueOnce({ data: { datacenters } });

    const result = await getDatacenters();
    expect(result).toEqual(datacenters);
    expect(mockClient.get).toHaveBeenCalledWith('/datacenters', { params: { per_page: 100 } });
  });

  it('returns empty array when no datacenters exist', async () => {
    mockClient.get.mockResolvedValueOnce({ data: { datacenters: [] } });
    const result = await getDatacenters();
    expect(result).toEqual([]);
  });
});
