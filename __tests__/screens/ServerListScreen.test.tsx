import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import type { Server } from '../../src/models';
import { darkColors } from '../../src/theme';

// ── mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../src/hooks/useServersQuery', () => ({
  useServersQuery: jest.fn(),
  invalidateServers: jest.fn(),
}));

jest.mock('../../src/store/favoritesStore', () => ({
  useFavoritesStore: jest.fn(),
}));

jest.mock('../../src/store/themeStore', () => ({
  useColors: jest.fn(() => require('../../src/theme').darkColors),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  })),
}));

jest.mock('../../src/api/servers', () => ({
  powerOnServer: jest.fn(),
  powerOffServer: jest.fn(),
  rebootServer: jest.fn(),
  deleteServer: jest.fn(),
}));

jest.mock('../../src/components/common/ActionSheet', () => ({
  ActionSheetModal: () => null,
  showActionSheet: jest.fn(),
}));

jest.mock('../../src/services/haptics', () => ({
  Haptics: {
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    warning: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// ── helpers ───────────────────────────────────────────────────────────────────

import { useServersQuery } from '../../src/hooks/useServersQuery';
import { useFavoritesStore } from '../../src/store/favoritesStore';

const mockUseServersQuery = useServersQuery as jest.Mock;
const mockUseFavoritesStore = useFavoritesStore as jest.Mock;

function makeServer(overrides: Partial<Server> & Pick<Server, 'id' | 'name'>): Server {
  return {
    status: 'running',
    created: '2024-01-01T00:00:00Z',
    server_type: {
      id: 1,
      name: 'cx11',
      description: 'CX11',
      cores: 1,
      memory: 2,
      disk: 20,
      architecture: 'x86',
      prices: [],
    },
    datacenter: {
      id: 1,
      name: 'fsn1-dc14',
      description: 'Falkenstein DC 14',
      location: {
        id: 1,
        name: 'fsn1',
        description: 'Falkenstein DC Park 1',
        country: 'DE',
        city: 'Falkenstein',
        latitude: 50.47612,
        longitude: 12.37071,
        network_zone: 'eu-central',
      },
    },
    image: null,
    iso: null,
    rescue_enabled: false,
    locked: false,
    backup_window: null,
    outgoing_traffic: null,
    ingoing_traffic: null,
    included_traffic: null,
    public_net: {
      ipv4: { id: 1, ip: '1.2.3.4', blocked: false, dns_ptr: '' },
      ipv6: null,
      floating_ips: [],
      firewalls: [],
    },
    labels: {},
    protection: { delete: false, rebuild: false },
    placement_group: null,
    primary_disk_size: 20,
    ...overrides,
  };
}

const defaultFavoritesStore = {
  serverIds: [],
  toggle: jest.fn(),
  isFavorite: jest.fn(() => false),
};

const defaultQueryResult = {
  data: [],
  isLoading: false,
  isRefetching: false,
  refetch: jest.fn(),
};

// ── tests ──────────────────────────────────────────────────────────────────────

import ServerListScreen from '../../src/screens/servers/ServerListScreen';

describe('ServerListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseServersQuery.mockReturnValue(defaultQueryResult);
    mockUseFavoritesStore.mockReturnValue(defaultFavoritesStore);
  });

  it('renders the "All Servers" heading', () => {
    render(<ServerListScreen />);
    expect(screen.getByText('All Servers')).toBeTruthy();
  });

  it('shows an activity indicator while loading with no data', () => {
    mockUseServersQuery.mockReturnValue({
      ...defaultQueryResult,
      data: [],
      isLoading: true,
    });
    render(<ServerListScreen />);
    expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('renders server names from the query result', () => {
    mockUseServersQuery.mockReturnValue({
      ...defaultQueryResult,
      data: [
        makeServer({ id: 1, name: 'web-01' }),
        makeServer({ id: 2, name: 'db-01' }),
      ],
    });
    render(<ServerListScreen />);
    expect(screen.getByText('web-01')).toBeTruthy();
    expect(screen.getByText('db-01')).toBeTruthy();
  });

  it('shows "No servers found" when there are no servers', () => {
    render(<ServerListScreen />);
    expect(screen.getByText('No servers found')).toBeTruthy();
  });

  it('filters servers by name when typing in the search box', () => {
    mockUseServersQuery.mockReturnValue({
      ...defaultQueryResult,
      data: [
        makeServer({ id: 1, name: 'web-01' }),
        makeServer({ id: 2, name: 'db-01' }),
      ],
    });
    render(<ServerListScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText('Search by name, IP, location...'),
      'web',
    );

    expect(screen.getByText('web-01')).toBeTruthy();
    expect(screen.queryByText('db-01')).toBeNull();
  });

  it('shows "No servers matching …" when search has no results', () => {
    mockUseServersQuery.mockReturnValue({
      ...defaultQueryResult,
      data: [makeServer({ id: 1, name: 'web-01' })],
    });
    render(<ServerListScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText('Search by name, IP, location...'),
      'zzz',
    );

    expect(screen.getByText('No servers matching "zzz"')).toBeTruthy();
  });

  it('filters servers by IPv4 address', () => {
    mockUseServersQuery.mockReturnValue({
      ...defaultQueryResult,
      data: [
        makeServer({
          id: 1,
          name: 'web-01',
          public_net: {
            ipv4: { id: 1, ip: '10.0.0.1', blocked: false, dns_ptr: '' },
            ipv6: null,
            floating_ips: [],
            firewalls: [],
          },
        }),
        makeServer({ id: 2, name: 'db-01' }),
      ],
    });
    render(<ServerListScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText('Search by name, IP, location...'),
      '10.0.0.1',
    );

    expect(screen.getByText('web-01')).toBeTruthy();
    expect(screen.queryByText('db-01')).toBeNull();
  });

  it('renders favorite servers before non-favorites', () => {
    mockUseServersQuery.mockReturnValue({
      ...defaultQueryResult,
      data: [
        makeServer({ id: 1, name: 'non-fav' }),
        makeServer({ id: 2, name: 'fav-server' }),
      ],
    });
    mockUseFavoritesStore.mockReturnValue({
      ...defaultFavoritesStore,
      serverIds: [2],
      isFavorite: (id: number) => id === 2,
    });

    render(<ServerListScreen />);

    const names = screen
      .getAllByText(/non-fav|fav-server/)
      .map((el) => el.props.children as string);

    expect(names[0]).toBe('fav-server');
    expect(names[1]).toBe('non-fav');
  });

  it('shows server status text', () => {
    mockUseServersQuery.mockReturnValue({
      ...defaultQueryResult,
      data: [makeServer({ id: 1, name: 'srv', status: 'running' })],
    });
    render(<ServerListScreen />);
    expect(screen.getByText('Running')).toBeTruthy();
  });

  it('shows Off status for a powered-off server', () => {
    mockUseServersQuery.mockReturnValue({
      ...defaultQueryResult,
      data: [makeServer({ id: 1, name: 'srv', status: 'off' })],
    });
    render(<ServerListScreen />);
    expect(screen.getByText('Off')).toBeTruthy();
  });
});
