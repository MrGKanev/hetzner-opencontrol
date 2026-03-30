import { getApiClient } from './client';
import type { FloatingIP, Action } from '../models';

export async function getFloatingIps(): Promise<FloatingIP[]> {
  const all: FloatingIP[] = [];
  let page = 1;
  while (true) {
    const res = await getApiClient().get('/floating_ips', { params: { page, per_page: 50 } });
    all.push(...res.data.floating_ips);
    if (!res.data.meta.pagination.next_page) break;
    page++;
  }
  return all;
}

export async function assignFloatingIp(id: number, serverId: number): Promise<Action> {
  const res = await getApiClient().post(`/floating_ips/${id}/actions/assign`, { server: serverId });
  return res.data.action;
}

export async function unassignFloatingIp(id: number): Promise<Action> {
  const res = await getApiClient().post(`/floating_ips/${id}/actions/unassign`);
  return res.data.action;
}

export async function deleteFloatingIp(id: number): Promise<void> {
  await getApiClient().delete(`/floating_ips/${id}`);
}

export async function updateFloatingIp(id: number, data: { name?: string; description?: string }): Promise<FloatingIP> {
  const res = await getApiClient().put(`/floating_ips/${id}`, data);
  return res.data.floating_ip;
}
