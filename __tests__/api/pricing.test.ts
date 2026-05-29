jest.mock('../../src/api/client', () => ({
  getApiClient: jest.fn(),
}));

import { getApiClient } from '../../src/api/client';
import { getPricing } from '../../src/api/pricing';

const mockClient = {
  get: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (getApiClient as jest.Mock).mockReturnValue(mockClient);
});

// ── getPricing ─────────────────────────────────────────────────────────────────

describe('getPricing', () => {
  it('fetches pricing from the correct endpoint and returns pricing data', async () => {
    const pricing = {
      currency: 'EUR',
      vat_rate: '19.000000',
      server_types: [{ id: 1, name: 'cx11', prices: [] }],
    };
    mockClient.get.mockResolvedValueOnce({ data: { pricing } });

    const result = await getPricing();
    expect(result).toEqual(pricing);
    expect(mockClient.get).toHaveBeenCalledWith('/pricing');
    expect(mockClient.get).toHaveBeenCalledTimes(1);
  });

  it('propagates errors thrown by the API client', async () => {
    mockClient.get.mockRejectedValueOnce(new Error('Network error'));
    await expect(getPricing()).rejects.toThrow('Network error');
  });
});
