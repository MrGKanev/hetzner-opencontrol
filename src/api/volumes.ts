import { getApiClient } from './client';
import type { Volume, Action } from '../models';

export async function getVolumes(): Promise<Volume[]> {
  const all: Volume[] = [];
  let page = 1;
  while (true) {
    const res = await getApiClient().get('/volumes', { params: { page, per_page: 50 } });
    all.push(...res.data.volumes);
    if (!res.data.meta.pagination.next_page) break;
    page++;
  }
  return all;
}

export async function getVolume(id: number): Promise<Volume> {
  const res = await getApiClient().get(`/volumes/${id}`);
  return res.data.volume;
}

export async function createVolume(params: { name: string; size: number; location?: string; server?: number; format?: string; labels?: Record<string, string> }): Promise<{ volume: Volume; action: Action }> {
  const res = await getApiClient().post('/volumes', params);
  return res.data;
}

export async function attachVolume(id: number, server: number, automount?: boolean): Promise<Action> {
  const res = await getApiClient().post(`/volumes/${id}/actions/attach`, { server, automount });
  return res.data.action;
}

export async function detachVolume(id: number): Promise<Action> {
  const res = await getApiClient().post(`/volumes/${id}/actions/detach`);
  return res.data.action;
}

export async function resizeVolume(id: number, size: number): Promise<Action> {
  const res = await getApiClient().post(`/volumes/${id}/actions/resize`, { size });
  return res.data.action;
}

export async function deleteVolume(id: number): Promise<void> {
  await getApiClient().delete(`/volumes/${id}`);
}
