import { getApiClient } from './client';
import type { Server, ServerMetrics, Action, Image, Iso, ServerType, PlacementGroup } from '../models';

// ─── List ────────────────────────────────────────────────────────────────────

export async function getServers(): Promise<Server[]> {
  const all: Server[] = [];
  let page = 1;
  while (true) {
    const res = await getApiClient().get('/servers', { params: { page, per_page: 50 } });
    all.push(...res.data.servers);
    if (!res.data.meta.pagination.next_page) break;
    page++;
  }
  return all;
}

export async function getServer(id: number): Promise<Server> {
  const res = await getApiClient().get(`/servers/${id}`);
  return res.data.server;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function powerOnServer(id: number): Promise<Action> {
  const res = await getApiClient().post(`/servers/${id}/actions/poweron`);
  return res.data.action;
}

export async function powerOffServer(id: number): Promise<Action> {
  const res = await getApiClient().post(`/servers/${id}/actions/poweroff`);
  return res.data.action;
}

export async function rebootServer(id: number): Promise<Action> {
  const res = await getApiClient().post(`/servers/${id}/actions/reboot`);
  return res.data.action;
}

export async function resetServer(id: number): Promise<Action> {
  const res = await getApiClient().post(`/servers/${id}/actions/reset`);
  return res.data.action;
}

export async function shutdownServer(id: number): Promise<Action> {
  const res = await getApiClient().post(`/servers/${id}/actions/shutdown`);
  return res.data.action;
}

export async function enableRescueMode(id: number, type: 'linux64' | 'freebsd64', ssh_keys?: number[]): Promise<{ action: Action; root_password: string }> {
  const res = await getApiClient().post(`/servers/${id}/actions/enable_rescue`, { type, ssh_keys });
  return res.data;
}

export async function disableRescueMode(id: number): Promise<Action> {
  const res = await getApiClient().post(`/servers/${id}/actions/disable_rescue`);
  return res.data.action;
}

export async function attachIso(id: number, iso_id: number): Promise<Action> {
  const res = await getApiClient().post(`/servers/${id}/actions/attach_iso`, { iso: iso_id });
  return res.data.action;
}

export async function detachIso(id: number): Promise<Action> {
  const res = await getApiClient().post(`/servers/${id}/actions/detach_iso`);
  return res.data.action;
}

export async function rebuildServer(id: number, image: number | string): Promise<{ action: Action; root_password: string | null }> {
  const res = await getApiClient().post(`/servers/${id}/actions/rebuild`, { image });
  return res.data;
}

export async function changeServerType(id: number, server_type: string, upgrade_disk: boolean): Promise<Action> {
  const res = await getApiClient().post(`/servers/${id}/actions/change_type`, { server_type, upgrade_disk });
  return res.data.action;
}

export async function updateServer(id: number, data: { name?: string; labels?: Record<string, string> }): Promise<Server> {
  const res = await getApiClient().put(`/servers/${id}`, data);
  return res.data.server;
}

export async function deleteServer(id: number): Promise<Action> {
  const res = await getApiClient().delete(`/servers/${id}`);
  return res.data.action;
}

// ─── Activity Log ────────────────────────────────────────────────────────────

export async function getServerActions(serverId: number): Promise<Action[]> {
  const all: Action[] = [];
  let page = 1;
  while (true) {
    const res = await getApiClient().get(`/servers/${serverId}/actions`, {
      params: { page, per_page: 50, sort: 'id:desc' },
    });
    all.push(...res.data.actions);
    if (!res.data.meta?.pagination?.next_page || all.length >= 100) break;
    page++;
  }
  return all;
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export type MetricType = 'cpu' | 'disk' | 'network';

export async function getServerMetrics(
  id: number,
  type: MetricType,
  start: Date,
  end: Date,
  step?: number,
): Promise<ServerMetrics> {
  const params: Record<string, string | number> = {
    type,
    start: start.toISOString(),
    end: end.toISOString(),
  };
  if (step) params.step = step;
  const res = await getApiClient().get(`/servers/${id}/metrics`, { params });
  return res.data.metrics;
}

// ─── Console ──────────────────────────────────────────────────────────────────

export async function requestConsole(id: number): Promise<{ wss_url: string; password: string }> {
  const res = await getApiClient().post(`/servers/${id}/actions/request_console`);
  return res.data;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export interface CreateServerParams {
  name: string;
  server_type: string;
  image: string | number;
  location?: string;
  datacenter?: string;
  ssh_keys?: number[];
  volumes?: number[];
  networks?: number[];
  firewalls?: Array<{ firewall: number }>;
  user_data?: string;
  labels?: Record<string, string>;
  placement_group?: number;
  public_net?: { enable_ipv4: boolean; enable_ipv6: boolean };
}

export async function createServer(params: CreateServerParams): Promise<{ server: Server; action: Action; root_password: string | null }> {
  const res = await getApiClient().post('/servers', params);
  return res.data;
}

// ─── Server Types ─────────────────────────────────────────────────────────────

export async function getServerTypes(): Promise<ServerType[]> {
  const res = await getApiClient().get('/server_types', { params: { per_page: 100 } });
  return res.data.server_types;
}

// ─── Images ───────────────────────────────────────────────────────────────────

export async function getImages(type?: string): Promise<Image[]> {
  const all: Image[] = [];
  let page = 1;
  while (true) {
    const res = await getApiClient().get('/images', {
      params: { page, per_page: 50, type, architecture: 'x86', status: 'available' },
    });
    all.push(...res.data.images);
    if (!res.data.meta.pagination.next_page) break;
    page++;
  }
  return all;
}

// ─── ISOs ─────────────────────────────────────────────────────────────────────

export async function getIsos(): Promise<Iso[]> {
  const res = await getApiClient().get('/isos', { params: { per_page: 100, type: 'public' } });
  return res.data.isos;
}

// ─── Placement Groups ─────────────────────────────────────────────────────────

export async function getPlacementGroups(): Promise<PlacementGroup[]> {
  const res = await getApiClient().get('/placement_groups', { params: { per_page: 100 } });
  return res.data.placement_groups;
}

export async function deletePlacementGroup(id: number): Promise<void> {
  await getApiClient().delete(`/placement_groups/${id}`);
}
