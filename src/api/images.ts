import { getApiClient } from './client';
import type { Image, Action } from '../models';

export async function getImages(type: 'snapshot' | 'backup'): Promise<Image[]> {
  const all: Image[] = [];
  let page = 1;
  while (true) {
    const res = await getApiClient().get('/images', {
      params: { page, per_page: 50, type },
    });
    all.push(...res.data.images);
    if (!res.data.meta.pagination.next_page) break;
    page++;
  }
  return all;
}

export async function deleteImage(id: number): Promise<void> {
  await getApiClient().delete(`/images/${id}`);
}

export async function updateImage(id: number, data: { description?: string; type?: 'snapshot' | 'backup'; labels?: Record<string, string> }): Promise<Image> {
  const res = await getApiClient().put(`/images/${id}`, data);
  return res.data.image;
}

export async function createSnapshot(serverId: number, description?: string): Promise<{ image: Image; action: Action }> {
  const res = await getApiClient().post(`/servers/${serverId}/actions/create_image`, {
    type: 'snapshot',
    description,
  });
  return { image: res.data.image, action: res.data.action };
}
