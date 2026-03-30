import axios, { AxiosInstance, AxiosError } from 'axios';

const BASE_URL = 'https://api.hetzner.cloud/v1';

let instance: AxiosInstance | null = null;

export function createApiClient(token: string): AxiosInstance {
  instance = axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });

  instance.interceptors.response.use(
    res => res,
    (error: AxiosError) => {
      const msg =
        (error.response?.data as any)?.error?.message ||
        error.message ||
        'Unknown error';
      return Promise.reject(new Error(msg));
    },
  );

  return instance;
}

export function getApiClient(): AxiosInstance {
  if (!instance) {
    throw new Error('API client not initialized. Please log in first.');
  }
  return instance;
}

export function destroyApiClient() {
  instance = null;
}
