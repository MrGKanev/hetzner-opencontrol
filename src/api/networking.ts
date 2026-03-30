import { getApiClient } from './client';
import type { Firewall, FirewallRule, Network, FloatingIP, PrimaryIP, LoadBalancer, Action } from '../models';

// ─── Firewalls ────────────────────────────────────────────────────────────────

export async function getFirewalls(): Promise<Firewall[]> {
  const res = await getApiClient().get('/firewalls', { params: { per_page: 100 } });
  return res.data.firewalls;
}

export async function getFirewall(id: number): Promise<Firewall> {
  const res = await getApiClient().get(`/firewalls/${id}`);
  return res.data.firewall;
}

export async function createFirewall(name: string, rules?: FirewallRule[]): Promise<{ firewall: Firewall; actions: Action[] }> {
  const res = await getApiClient().post('/firewalls', { name, rules });
  return res.data;
}

export async function updateFirewallRules(id: number, rules: FirewallRule[]): Promise<Action[]> {
  const res = await getApiClient().post(`/firewalls/${id}/actions/set_rules`, { rules });
  return res.data.actions;
}

export async function deleteFirewall(id: number): Promise<void> {
  await getApiClient().delete(`/firewalls/${id}`);
}

// ─── Networks ─────────────────────────────────────────────────────────────────

export async function getNetworks(): Promise<Network[]> {
  const res = await getApiClient().get('/networks', { params: { per_page: 100 } });
  return res.data.networks;
}

export async function getNetwork(id: number): Promise<Network> {
  const res = await getApiClient().get(`/networks/${id}`);
  return res.data.network;
}

export async function createNetwork(params: { name: string; ip_range: string; subnets?: Array<{ type: string; ip_range: string; network_zone: string }> }): Promise<Network> {
  const res = await getApiClient().post('/networks', params);
  return res.data.network;
}

export async function deleteNetwork(id: number): Promise<void> {
  await getApiClient().delete(`/networks/${id}`);
}

// ─── Floating IPs ─────────────────────────────────────────────────────────────

export async function getFloatingIPs(): Promise<FloatingIP[]> {
  const res = await getApiClient().get('/floating_ips', { params: { per_page: 100 } });
  return res.data.floating_ips;
}

export async function assignFloatingIP(id: number, server: number): Promise<Action> {
  const res = await getApiClient().post(`/floating_ips/${id}/actions/assign`, { server });
  return res.data.action;
}

export async function unassignFloatingIP(id: number): Promise<Action> {
  const res = await getApiClient().post(`/floating_ips/${id}/actions/unassign`);
  return res.data.action;
}

export async function deleteFloatingIP(id: number): Promise<void> {
  await getApiClient().delete(`/floating_ips/${id}`);
}

// ─── Primary IPs ─────────────────────────────────────────────────────────────

export async function getPrimaryIPs(): Promise<PrimaryIP[]> {
  const res = await getApiClient().get('/primary_ips', { params: { per_page: 100 } });
  return res.data.primary_ips;
}

// ─── Load Balancers ───────────────────────────────────────────────────────────

export async function getLoadBalancers(): Promise<LoadBalancer[]> {
  const res = await getApiClient().get('/load_balancers', { params: { per_page: 100 } });
  return res.data.load_balancers;
}

export async function getLoadBalancer(id: number): Promise<LoadBalancer> {
  const res = await getApiClient().get(`/load_balancers/${id}`);
  return res.data.load_balancer;
}

export async function deleteLoadBalancer(id: number): Promise<void> {
  await getApiClient().delete(`/load_balancers/${id}`);
}
