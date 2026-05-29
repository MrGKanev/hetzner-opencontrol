import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';

jest.mock('../../src/api/servers', () => ({ getServers: jest.fn() }));
jest.mock('../../src/api/volumes', () => ({ getVolumes: jest.fn() }));
jest.mock('../../src/api/networking', () => ({
  getFirewalls: jest.fn(),
  getNetworks: jest.fn(),
  getPrimaryIPs: jest.fn(),
  getLoadBalancers: jest.fn(),
}));
jest.mock('../../src/api/floatingIps', () => ({ getFloatingIps: jest.fn() }));
jest.mock('../../src/store/themeStore', () => ({
  useColors: jest.fn(() => require('../../src/theme').darkColors),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({ navigate: jest.fn(), goBack: jest.fn() })),
}));

import { getServers } from '../../src/api/servers';
import { getVolumes } from '../../src/api/volumes';
import { getFirewalls, getNetworks, getPrimaryIPs, getLoadBalancers } from '../../src/api/networking';
import { getFloatingIps } from '../../src/api/floatingIps';
import SearchScreen from '../../src/screens/search/SearchScreen';

const apis = {
  getServers: getServers as jest.Mock,
  getVolumes: getVolumes as jest.Mock,
  getFirewalls: getFirewalls as jest.Mock,
  getNetworks: getNetworks as jest.Mock,
  getPrimaryIPs: getPrimaryIPs as jest.Mock,
  getLoadBalancers: getLoadBalancers as jest.Mock,
  getFloatingIps: getFloatingIps as jest.Mock,
};

function silenceAllApis() {
  apis.getServers.mockResolvedValue([]);
  apis.getVolumes.mockResolvedValue([]);
  apis.getFirewalls.mockResolvedValue([]);
  apis.getNetworks.mockResolvedValue([]);
  apis.getPrimaryIPs.mockResolvedValue([]);
  apis.getLoadBalancers.mockResolvedValue([]);
  apis.getFloatingIps.mockResolvedValue([]);
}

function makeServer(id: number, name: string, ip = '1.2.3.4') {
  return {
    id,
    name,
    status: 'running',
    public_net: {
      ipv4: { ip },
      ipv6: null,
    },
    datacenter: { location: { name: 'fsn1' } },
    server_type: { name: 'cx11' },
  };
}

function makeVolume(id: number, name: string, location = 'fsn1') {
  return { id, name, size: 10, location: { name: location }, status: 'available' };
}

const searchInput = () =>
  screen.getByPlaceholderText('Servers, IPs, firewalls, volumes…');

beforeEach(() => {
  jest.clearAllMocks();
  silenceAllApis();
});

// ── initial state ──────────────────────────────────────────────────────────────

it('shows "Search across all resources" hint before any search', () => {
  render(<SearchScreen />);
  expect(screen.getByText('Search across all resources')).toBeTruthy();
});

it('shows no results list initially', () => {
  render(<SearchScreen />);
  expect(screen.queryByText('Server')).toBeNull();
});

// ── empty query ───────────────────────────────────────────────────────────────

it('clears results and shows hint when query is emptied', async () => {
  apis.getServers.mockResolvedValue([makeServer(1, 'web-01')]);
  render(<SearchScreen />);

  // Search, then clear
  fireEvent.changeText(searchInput(), 'web');
  fireEvent(searchInput(), 'submitEditing');
  await waitFor(() => screen.getByText('web-01'));

  fireEvent.changeText(searchInput(), '');
  expect(screen.getByText('Search across all resources')).toBeTruthy();
});

// ── search results ────────────────────────────────────────────────────────────

it('shows matched server names after search', async () => {
  apis.getServers.mockResolvedValue([
    makeServer(1, 'web-01'),
    makeServer(2, 'db-02'),
  ]);
  render(<SearchScreen />);

  fireEvent.changeText(searchInput(), 'web');
  fireEvent(searchInput(), 'submitEditing');

  await waitFor(() => expect(screen.getByText('web-01')).toBeTruthy());
  expect(screen.queryByText('db-02')).toBeNull();
});

it('filters servers by IPv4 address', async () => {
  apis.getServers.mockResolvedValue([
    makeServer(1, 'web-01', '10.0.0.1'),
    makeServer(2, 'db-02', '10.0.0.2'),
  ]);
  render(<SearchScreen />);

  fireEvent.changeText(searchInput(), '10.0.0.1');
  fireEvent(searchInput(), 'submitEditing');

  await waitFor(() => expect(screen.getByText('web-01')).toBeTruthy());
  expect(screen.queryByText('db-02')).toBeNull();
});

it('shows volume results with "Volume" badge', async () => {
  apis.getVolumes.mockResolvedValue([makeVolume(5, 'data-vol')]);
  render(<SearchScreen />);

  fireEvent.changeText(searchInput(), 'data');
  fireEvent(searchInput(), 'submitEditing');

  await waitFor(() => expect(screen.getByText('data-vol')).toBeTruthy());
  expect(screen.getByText('Volume')).toBeTruthy();
});

it('shows "No results" when query has no matches', async () => {
  render(<SearchScreen />);

  fireEvent.changeText(searchInput(), 'nonexistent-xyz');
  fireEvent(searchInput(), 'submitEditing');

  await waitFor(() =>
    expect(screen.getByText('No results for "nonexistent-xyz"')).toBeTruthy(),
  );
});

it('shows results from multiple resource types in one search', async () => {
  apis.getServers.mockResolvedValue([makeServer(1, 'prod-server')]);
  apis.getVolumes.mockResolvedValue([makeVolume(2, 'prod-volume')]);
  render(<SearchScreen />);

  fireEvent.changeText(searchInput(), 'prod');
  fireEvent(searchInput(), 'submitEditing');

  await waitFor(() => {
    expect(screen.getByText('prod-server')).toBeTruthy();
    expect(screen.getByText('prod-volume')).toBeTruthy();
  });
});

// ── error resilience ──────────────────────────────────────────────────────────

it('shows partial results when some API calls fail', async () => {
  apis.getServers.mockResolvedValue([makeServer(1, 'healthy')]);
  apis.getVolumes.mockRejectedValue(new Error('API down'));
  render(<SearchScreen />);

  fireEvent.changeText(searchInput(), 'healthy');
  fireEvent(searchInput(), 'submitEditing');

  await waitFor(() => expect(screen.getByText('healthy')).toBeTruthy());
});

it('shows "No results" (not a crash) when all API calls fail', async () => {
  const fail = new Error('Network error');
  Object.values(apis).forEach((m) => m.mockRejectedValue(fail));
  render(<SearchScreen />);

  fireEvent.changeText(searchInput(), 'anything');
  await expect(
    act(async () => { fireEvent(searchInput(), 'submitEditing'); }),
  ).resolves.not.toThrow();

  await waitFor(() =>
    expect(screen.getByText('No results for "anything"')).toBeTruthy(),
  );
});
