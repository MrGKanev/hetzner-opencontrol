const BASE_URL = "https://api.hetzner.cloud/v1";
const TIMEOUT_MS = 15_000;

type Params = Record<string, string | number | boolean | undefined>;

let token: string | null = null;

class ApiClient {
  async get(path: string, options?: { params?: Params }) {
    const url = new URL(`${BASE_URL}${path}`);
    if (options?.params) {
      for (const [k, v] of Object.entries(options.params)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }
    return this.request(url.toString(), { method: "GET" });
  }

  async post(path: string, body?: unknown) {
    return this.request(`${BASE_URL}${path}`, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put(path: string, body: unknown) {
    return this.request(`${BASE_URL}${path}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async delete(path: string) {
    return this.request(`${BASE_URL}${path}`, { method: "DELETE" });
  }

  private async request(url: string, init: RequestInit) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...(init.headers as Record<string, string>),
        },
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") {
        throw new Error("Request timed out");
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 204) return { data: null };

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error?.message ?? `Request failed: ${res.status}`);
    }
    return { data: json };
  }
}

let instance: ApiClient | null = null;

export function createApiClient(apiToken: string): ApiClient {
  token = apiToken;
  instance = new ApiClient();
  return instance;
}

export function getApiClient(): ApiClient {
  if (!instance) {
    throw new Error("API client not initialized. Please log in first.");
  }
  return instance;
}

export function destroyApiClient() {
  token = null;
  instance = null;
}
