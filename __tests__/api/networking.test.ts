jest.mock('../../src/api/client', () => ({
  getApiClient: jest.fn(),
}));

import { getApiClient } from '../../src/api/client';
import {
  getFirewalls,
  getFirewall,
  createFirewall,
  updateFirewallRules,
  deleteFirewall,
  getNetworks,
  getNetwork,
  createNetwork,
  deleteNetwork,
  getPrimaryIPs,
  deletePrimaryIP,
  unassignPrimaryIP,
  getLoadBalancers,
  getLoadBalancer,
  deleteLoadBalancer,
  getCertificates,
  deleteCertificate,
} from '../../src/api/networking';

const mockClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (getApiClient as jest.Mock).mockReturnValue(mockClient);
});

function okAction() {
  return { data: { action: { id: 1, status: 'success' } } };
}

// ── Firewalls ─────────────────────────────────────────────────────────────────

describe('firewalls', () => {
  it('getFirewalls fetches with per_page=100', async () => {
    mockClient.get.mockResolvedValueOnce({ data: { firewalls: [] } });
    const result = await getFirewalls();
    expect(result).toEqual([]);
    expect(mockClient.get).toHaveBeenCalledWith('/firewalls', { params: { per_page: 100 } });
  });

  it('getFirewalls returns list of firewalls', async () => {
    const fw = [{ id: 1, name: 'my-fw', rules: [], applied_to: [] }];
    mockClient.get.mockResolvedValueOnce({ data: { firewalls: fw } });
    const result = await getFirewalls();
    expect(result).toEqual(fw);
  });

  it('getFirewall fetches a single firewall by id', async () => {
    const fw = { id: 5, name: 'fw-5' };
    mockClient.get.mockResolvedValueOnce({ data: { firewall: fw } });
    const result = await getFirewall(5);
    expect(result).toEqual(fw);
    expect(mockClient.get).toHaveBeenCalledWith('/firewalls/5');
  });

  it('createFirewall posts name and rules and returns firewall + actions', async () => {
    const fw = { id: 10, name: 'new-fw' };
    const actions = [{ id: 1 }];
    mockClient.post.mockResolvedValueOnce({ data: { firewall: fw, actions } });

    const rules = [{ direction: 'in', protocol: 'tcp', port: '80', source_ips: ['0.0.0.0/0'], destination_ips: [], description: null }];
    const result = await createFirewall('new-fw', rules as any);
    expect(result).toEqual({ firewall: fw, actions });
    expect(mockClient.post).toHaveBeenCalledWith('/firewalls', { name: 'new-fw', rules });
  });

  it('createFirewall works without rules', async () => {
    mockClient.post.mockResolvedValueOnce({ data: { firewall: { id: 11 }, actions: [] } });
    await createFirewall('empty-fw');
    expect(mockClient.post).toHaveBeenCalledWith('/firewalls', { name: 'empty-fw', rules: undefined });
  });

  it('updateFirewallRules posts rules and returns actions array', async () => {
    const actions = [{ id: 2 }, { id: 3 }];
    mockClient.post.mockResolvedValueOnce({ data: { actions } });

    const rules = [{ direction: 'out', protocol: 'tcp', port: '443', source_ips: [], destination_ips: ['0.0.0.0/0'], description: null }];
    const result = await updateFirewallRules(5, rules as any);
    expect(result).toEqual(actions);
    expect(mockClient.post).toHaveBeenCalledWith('/firewalls/5/actions/set_rules', { rules });
  });

  it('deleteFirewall sends DELETE to the correct endpoint', async () => {
    mockClient.delete.mockResolvedValueOnce({});
    await deleteFirewall(3);
    expect(mockClient.delete).toHaveBeenCalledWith('/firewalls/3');
  });
});

// ── Networks ──────────────────────────────────────────────────────────────────

describe('networks', () => {
  it('getNetworks fetches with per_page=100', async () => {
    mockClient.get.mockResolvedValueOnce({ data: { networks: [] } });
    const result = await getNetworks();
    expect(result).toEqual([]);
    expect(mockClient.get).toHaveBeenCalledWith('/networks', { params: { per_page: 100 } });
  });

  it('getNetwork fetches a single network by id', async () => {
    const network = { id: 7, name: 'net-7' };
    mockClient.get.mockResolvedValueOnce({ data: { network } });
    const result = await getNetwork(7);
    expect(result).toEqual(network);
    expect(mockClient.get).toHaveBeenCalledWith('/networks/7');
  });

  it('createNetwork posts params and returns the new network', async () => {
    const network = { id: 20, name: 'my-net', ip_range: '10.0.0.0/8' };
    mockClient.post.mockResolvedValueOnce({ data: { network } });

    const result = await createNetwork({ name: 'my-net', ip_range: '10.0.0.0/8' });
    expect(result).toEqual(network);
    expect(mockClient.post).toHaveBeenCalledWith('/networks', {
      name: 'my-net',
      ip_range: '10.0.0.0/8',
    });
  });

  it('createNetwork passes subnets when provided', async () => {
    const network = { id: 21 };
    mockClient.post.mockResolvedValueOnce({ data: { network } });

    const subnets = [{ type: 'cloud', ip_range: '10.0.0.0/24', network_zone: 'eu-central' }];
    await createNetwork({ name: 'n', ip_range: '10.0.0.0/8', subnets });
    expect(mockClient.post).toHaveBeenCalledWith('/networks', {
      name: 'n',
      ip_range: '10.0.0.0/8',
      subnets,
    });
  });

  it('deleteNetwork sends DELETE to the correct endpoint', async () => {
    mockClient.delete.mockResolvedValueOnce({});
    await deleteNetwork(9);
    expect(mockClient.delete).toHaveBeenCalledWith('/networks/9');
  });
});

// ── Primary IPs ───────────────────────────────────────────────────────────────

describe('primary IPs', () => {
  it('getPrimaryIPs fetches with per_page=100', async () => {
    const ips = [{ id: 1, ip: '1.2.3.4' }];
    mockClient.get.mockResolvedValueOnce({ data: { primary_ips: ips } });
    const result = await getPrimaryIPs();
    expect(result).toEqual(ips);
    expect(mockClient.get).toHaveBeenCalledWith('/primary_ips', { params: { per_page: 100 } });
  });

  it('deletePrimaryIP sends DELETE to the correct endpoint', async () => {
    mockClient.delete.mockResolvedValueOnce({});
    await deletePrimaryIP(4);
    expect(mockClient.delete).toHaveBeenCalledWith('/primary_ips/4');
  });

  it('unassignPrimaryIP posts to the unassign endpoint and returns action', async () => {
    mockClient.post.mockResolvedValueOnce(okAction());
    const result = await unassignPrimaryIP(6);
    expect(result).toEqual(okAction().data.action);
    expect(mockClient.post).toHaveBeenCalledWith('/primary_ips/6/actions/unassign');
  });
});

// ── Load Balancers ────────────────────────────────────────────────────────────

describe('load balancers', () => {
  it('getLoadBalancers fetches with per_page=100', async () => {
    const lbs = [{ id: 1, name: 'lb-01' }];
    mockClient.get.mockResolvedValueOnce({ data: { load_balancers: lbs } });
    const result = await getLoadBalancers();
    expect(result).toEqual(lbs);
    expect(mockClient.get).toHaveBeenCalledWith('/load_balancers', { params: { per_page: 100 } });
  });

  it('getLoadBalancer fetches a single load balancer by id', async () => {
    const lb = { id: 5, name: 'lb-5' };
    mockClient.get.mockResolvedValueOnce({ data: { load_balancer: lb } });
    const result = await getLoadBalancer(5);
    expect(result).toEqual(lb);
    expect(mockClient.get).toHaveBeenCalledWith('/load_balancers/5');
  });

  it('deleteLoadBalancer sends DELETE to the correct endpoint', async () => {
    mockClient.delete.mockResolvedValueOnce({});
    await deleteLoadBalancer(2);
    expect(mockClient.delete).toHaveBeenCalledWith('/load_balancers/2');
  });
});

// ── Certificates ──────────────────────────────────────────────────────────────

describe('certificates', () => {
  it('getCertificates fetches with per_page=100', async () => {
    const certs = [{ id: 1, name: 'cert-01' }];
    mockClient.get.mockResolvedValueOnce({ data: { certificates: certs } });
    const result = await getCertificates();
    expect(result).toEqual(certs);
    expect(mockClient.get).toHaveBeenCalledWith('/certificates', { params: { per_page: 100 } });
  });

  it('deleteCertificate sends DELETE to the correct endpoint', async () => {
    mockClient.delete.mockResolvedValueOnce({});
    await deleteCertificate(8);
    expect(mockClient.delete).toHaveBeenCalledWith('/certificates/8');
  });
});
