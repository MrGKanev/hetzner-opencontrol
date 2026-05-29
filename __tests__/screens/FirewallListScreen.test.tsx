import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import type { Firewall } from '../../src/models';

// ── mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../src/hooks/useResourceList', () => ({
  useResourceList: jest.fn(),
}));

jest.mock('../../src/store/themeStore', () => ({
  useColors: jest.fn(() => require('../../src/theme').darkColors),
}));

jest.mock('../../src/api/networking', () => ({
  getFirewalls: jest.fn(),
  deleteFirewall: jest.fn(),
}));

jest.mock('../../src/components/common/ActionSheet', () => ({
  ActionSheetModal: () => null,
}));

jest.mock('../../src/utils/dialogs', () => ({
  confirmDelete: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  })),
}));

// ── helpers ───────────────────────────────────────────────────────────────────

import { useResourceList } from '../../src/hooks/useResourceList';

const mockUseResourceList = useResourceList as jest.Mock;

function makeFirewall(overrides: Partial<Firewall> & Pick<Firewall, 'id' | 'name'>): Firewall {
  return {
    rules: [],
    applied_to: [],
    labels: {},
    created: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

const defaultResourceList = {
  data: [],
  setData: jest.fn(),
  loading: false,
  refreshing: false,
  selected: null,
  sheetVisible: false,
  setSheetVisible: jest.fn(),
  refresh: jest.fn(),
  openSheet: jest.fn(),
};

import FirewallListScreen from '../../src/screens/networking/FirewallListScreen';

// ── tests ──────────────────────────────────────────────────────────────────────

describe('FirewallListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseResourceList.mockReturnValue(defaultResourceList);
  });

  it('renders the "Firewalls" heading', () => {
    render(<FirewallListScreen />);
    expect(screen.getByText('Firewalls')).toBeTruthy();
  });

  it('shows an activity indicator while loading', () => {
    mockUseResourceList.mockReturnValue({ ...defaultResourceList, loading: true });
    render(<FirewallListScreen />);
    expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('renders firewall names', () => {
    mockUseResourceList.mockReturnValue({
      ...defaultResourceList,
      data: [
        makeFirewall({ id: 1, name: 'web-fw' }),
        makeFirewall({ id: 2, name: 'db-fw' }),
      ],
    });
    render(<FirewallListScreen />);
    expect(screen.getByText('web-fw')).toBeTruthy();
    expect(screen.getByText('db-fw')).toBeTruthy();
  });

  it('shows "No firewalls found" when list is empty', () => {
    render(<FirewallListScreen />);
    expect(screen.getByText('No firewalls found')).toBeTruthy();
  });

  it('shows rule count for each firewall', () => {
    mockUseResourceList.mockReturnValue({
      ...defaultResourceList,
      data: [
        makeFirewall({
          id: 1,
          name: 'fw-with-rules',
          rules: [
            { direction: 'in', protocol: 'tcp', port: '80', source_ips: [], destination_ips: [], description: null },
            { direction: 'in', protocol: 'tcp', port: '443', source_ips: [], destination_ips: [], description: null },
          ],
        }),
      ],
    });
    render(<FirewallListScreen />);
    expect(screen.getByText(/2 rules/)).toBeTruthy();
  });

  it('shows singular "rule" for a firewall with 1 rule', () => {
    mockUseResourceList.mockReturnValue({
      ...defaultResourceList,
      data: [
        makeFirewall({
          id: 1,
          name: 'single-rule-fw',
          rules: [{ direction: 'in', protocol: 'tcp', port: '22', source_ips: [], destination_ips: [], description: null }],
        }),
      ],
    });
    render(<FirewallListScreen />);
    expect(screen.getByText(/1 rule\b/)).toBeTruthy();
  });

  it('shows applied count for each firewall', () => {
    mockUseResourceList.mockReturnValue({
      ...defaultResourceList,
      data: [
        makeFirewall({
          id: 1,
          name: 'applied-fw',
          applied_to: [
            { type: 'server', server: { id: 10 } },
            { type: 'server', server: { id: 11 } },
          ],
        }),
      ],
    });
    render(<FirewallListScreen />);
    expect(screen.getByText(/2 applied/)).toBeTruthy();
  });

  it('navigates to FirewallDetail when a firewall row is pressed', () => {
    mockUseResourceList.mockReturnValue({
      ...defaultResourceList,
      data: [makeFirewall({ id: 5, name: 'click-fw' })],
    });
    render(<FirewallListScreen />);
    fireEvent.press(screen.getByText('click-fw'));
    expect(mockNavigate).toHaveBeenCalledWith('FirewallDetail', { firewallId: 5 });
  });

  it('navigates to CreateFirewall when the add button is pressed', () => {
    render(<FirewallListScreen />);
    fireEvent.press(screen.getByText('＋'));
    expect(mockNavigate).toHaveBeenCalledWith('CreateFirewall');
  });
});
