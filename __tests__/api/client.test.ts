import { createApiClient, getApiClient, destroyApiClient } from '../../src/api/client';

const BASE = 'https://api.hetzner.cloud/v1';

describe('ApiClient', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    destroyApiClient();
    jest.useFakeTimers();
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // ── lifecycle ────────────────────────────────────────────────────────────────

  describe('lifecycle', () => {
    it('getApiClient throws before initialization', () => {
      expect(() => getApiClient()).toThrow(
        'API client not initialized. Please log in first.',
      );
    });

    it('getApiClient returns the same instance after createApiClient', () => {
      const client = createApiClient('tok');
      expect(getApiClient()).toBe(client);
    });

    it('destroyApiClient clears the instance', () => {
      createApiClient('tok');
      destroyApiClient();
      expect(() => getApiClient()).toThrow();
    });

    it('createApiClient replaces an existing instance', () => {
      const first = createApiClient('first');
      const second = createApiClient('second');
      expect(second).not.toBe(first);
      expect(getApiClient()).toBe(second);
    });
  });

  // ── GET ─────────────────────────────────────────────────────────────────────

  describe('GET', () => {
    beforeEach(() => {
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ servers: [] }),
      } as Response);
    });

    it('sends method GET with Authorization header', async () => {
      await createApiClient('my-token').get('/servers');
      const [, init] = fetchSpy.mock.calls[0] as [
        string,
        RequestInit & { headers: Record<string, string> },
      ];
      expect(init.method).toBe('GET');
      expect((init.headers as Record<string, string>)['Authorization']).toBe(
        'Bearer my-token',
      );
    });

    it('appends query params to the URL', async () => {
      await createApiClient('tok').get('/servers', { params: { page: 2, per_page: 50 } });
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toContain('page=2');
      expect(url).toContain('per_page=50');
    });

    it('omits undefined params', async () => {
      await createApiClient('tok').get('/servers', {
        params: { page: 1, filter: undefined },
      });
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).not.toContain('filter');
    });

    it('returns parsed JSON wrapped in { data }', async () => {
      const result = await createApiClient('tok').get('/servers');
      expect(result).toEqual({ data: { servers: [] } });
    });
  });

  // ── POST ────────────────────────────────────────────────────────────────────

  describe('POST', () => {
    beforeEach(() => {
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ action: {} }),
      } as Response);
    });

    it('sends body as JSON string', async () => {
      await createApiClient('tok').post('/servers', { name: 'test' });
      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(init.body).toBe(JSON.stringify({ name: 'test' }));
    });

    it('sends no body when omitted', async () => {
      await createApiClient('tok').post('/servers/1/actions/reboot');
      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(init.body).toBeUndefined();
    });

    it('targets the correct URL', async () => {
      await createApiClient('tok').post('/servers', {});
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe(`${BASE}/servers`);
    });
  });

  // ── PUT ─────────────────────────────────────────────────────────────────────

  describe('PUT', () => {
    it('sends body as JSON string with method PUT', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ server: {} }),
      } as Response);

      await createApiClient('tok').put('/servers/1', { name: 'renamed' });
      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe('PUT');
      expect(init.body).toBe(JSON.stringify({ name: 'renamed' }));
    });
  });

  // ── DELETE / 204 ────────────────────────────────────────────────────────────

  it('DELETE returns { data: null } for 204 No Content', async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 204 } as Response);
    const result = await createApiClient('tok').delete('/servers/1');
    expect(result).toEqual({ data: null });
  });

  // ── error handling ───────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('throws API error message on non-ok response', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ error: { message: 'Invalid name' } }),
      } as Response);

      await expect(createApiClient('tok').post('/servers', {})).rejects.toThrow(
        'Invalid name',
      );
    });

    it('throws fallback message when error body is missing', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      } as Response);

      await expect(createApiClient('tok').get('/servers')).rejects.toThrow(
        'Request failed: 503',
      );
    });

    it('re-throws non-abort network errors', async () => {
      fetchSpy.mockRejectedValue(new Error('Network failure'));
      await expect(createApiClient('tok').get('/servers')).rejects.toThrow(
        'Network failure',
      );
    });
  });

  // ── timeout ──────────────────────────────────────────────────────────────────

  it('throws "Request timed out" after 15 seconds', async () => {
    fetchSpy.mockImplementation((_url: string, options: RequestInit) =>
      new Promise<Response>((_, reject) => {
        (options.signal as AbortSignal).addEventListener('abort', () => {
          const err = new Error('The user aborted a request.');
          err.name = 'AbortError';
          reject(err);
        });
      }),
    );

    const promise = createApiClient('tok').get('/servers');
    jest.advanceTimersByTime(15_001);
    await expect(promise).rejects.toThrow('Request timed out');
  });
});
