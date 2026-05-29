import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

// ── mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../src/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('../../src/store/themeStore', () => ({
  useColors: jest.fn(() => require('../../src/theme').darkColors),
  useThemeStore: jest.fn(),
}));

jest.mock('../../src/store/settingsStore', () => ({
  useSettingsStore: jest.fn(),
  REFRESH_INTERVALS: [
    { label: 'Off', value: 0 },
    { label: '30s', value: 30 },
    { label: '1 min', value: 60 },
  ],
}));

jest.mock('../../src/store/projectsStore', () => ({
  useProjectsStore: jest.fn(),
}));

jest.mock('../../src/services/notifications', () => ({
  requestNotificationPermission: jest.fn(),
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

jest.mock('../../src/services/biometrics', () => ({
  getBiometricType: jest.fn(),
  authenticateWithBiometrics: jest.fn(),
}));

jest.mock('react-native-keychain', () => ({
  getGenericPassword: jest.fn(),
}));

const mockGoBack = jest.fn();
const mockNavigation = { goBack: mockGoBack };

// ── store defaults ─────────────────────────────────────────────────────────────

import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useProjectsStore } from '../../src/store/projectsStore';

const mockUseAuthStore = useAuthStore as jest.Mock;
const mockUseThemeStore = useThemeStore as jest.Mock;
const mockUseSettingsStore = useSettingsStore as jest.Mock;
const mockUseProjectsStore = useProjectsStore as jest.Mock;

const defaultAuthStore = { logout: jest.fn() };

const defaultThemeStore = { isDark: true, toggle: jest.fn() };

const defaultSettingsStore = {
  hapticsEnabled: true,
  setHapticsEnabled: jest.fn(),
  refreshInterval: 0,
  setRefreshInterval: jest.fn(),
  notificationsEnabled: false,
  setNotificationsEnabled: jest.fn(),
};

const defaultProjectsStore = {
  projects: [],
  activeProjectId: null,
  renameProject: jest.fn(),
  removeProject: jest.fn(),
  switchProject: jest.fn(),
  addProject: jest.fn(),
  isLoading: false,
  error: null,
  clearError: jest.fn(),
};

import SettingsScreen from '../../src/screens/settings/SettingsScreen';

// ── tests ──────────────────────────────────────────────────────────────────────

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue(defaultAuthStore);
    mockUseThemeStore.mockReturnValue(defaultThemeStore);
    mockUseSettingsStore.mockReturnValue(defaultSettingsStore);
    mockUseProjectsStore.mockReturnValue(defaultProjectsStore);
  });

  it('renders the "Settings" heading', () => {
    render(<SettingsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('renders section headers', () => {
    render(<SettingsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(screen.getByText('Appearance')).toBeTruthy();
    expect(screen.getByText('General')).toBeTruthy();
    expect(screen.getByText('Projects')).toBeTruthy();
    expect(screen.getByText('Account')).toBeTruthy();
    expect(screen.getByText('About')).toBeTruthy();
  });

  it('shows "Dark Mode" label when isDark is true', () => {
    render(<SettingsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(screen.getByText('Dark Mode')).toBeTruthy();
  });

  it('shows "Light Mode" label when isDark is false', () => {
    mockUseThemeStore.mockReturnValue({ isDark: false, toggle: jest.fn() });
    render(<SettingsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(screen.getByText('Light Mode')).toBeTruthy();
  });

  it('renders the Haptic Feedback row', () => {
    render(<SettingsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(screen.getByText('Haptic Feedback')).toBeTruthy();
  });

  it('renders Server Notifications row', () => {
    render(<SettingsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(screen.getByText('Server Notifications')).toBeTruthy();
  });

  it('renders Auto-Refresh row with interval options', () => {
    render(<SettingsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(screen.getByText('Auto-Refresh')).toBeTruthy();
    expect(screen.getByText('Off')).toBeTruthy();
    expect(screen.getByText('30s')).toBeTruthy();
    expect(screen.getByText('1 min')).toBeTruthy();
  });

  it('calls setRefreshInterval when an interval segment is pressed', () => {
    const setRefreshInterval = jest.fn();
    mockUseSettingsStore.mockReturnValue({ ...defaultSettingsStore, setRefreshInterval });
    render(<SettingsScreen navigation={mockNavigation as any} route={{} as any} />);
    fireEvent.press(screen.getByText('30s'));
    expect(setRefreshInterval).toHaveBeenCalledWith(30);
  });

  it('renders Sign Out in the account section', () => {
    render(<SettingsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(screen.getByText('Sign Out')).toBeTruthy();
  });

  it('renders Version in the about section', () => {
    render(<SettingsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(screen.getByText('Version')).toBeTruthy();
  });

  it('renders Source Code link in the about section', () => {
    render(<SettingsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(screen.getByText('Source Code')).toBeTruthy();
  });

  it('calls navigation.goBack when the close button is pressed', () => {
    const { UNSAFE_getAllByType } = render(
      <SettingsScreen navigation={mockNavigation as any} route={{} as any} />,
    );
    const { TouchableOpacity } = require('react-native');
    // The close button is the first TouchableOpacity rendered (top-left of header)
    const closeBtn = UNSAFE_getAllByType(TouchableOpacity)[0];
    fireEvent.press(closeBtn);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('renders project names when projects exist', () => {
    mockUseProjectsStore.mockReturnValue({
      ...defaultProjectsStore,
      projects: [
        { id: 'p1', name: 'Production' },
        { id: 'p2', name: 'Staging' },
      ],
      activeProjectId: 'p1',
    });
    render(<SettingsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(screen.getByText('Production')).toBeTruthy();
    expect(screen.getByText('Staging')).toBeTruthy();
  });

  it('renders the Add Project row', () => {
    render(<SettingsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(screen.getByText('Add Project')).toBeTruthy();
  });

  it('shows the add-project form when Add Project is pressed', () => {
    render(<SettingsScreen navigation={mockNavigation as any} route={{} as any} />);
    fireEvent.press(screen.getByText('Add Project'));
    expect(screen.getByPlaceholderText('Project name')).toBeTruthy();
    expect(screen.getByPlaceholderText('API key')).toBeTruthy();
  });

  it('shows error message from projectsStore inside the add-project form', () => {
    mockUseProjectsStore.mockReturnValue({ ...defaultProjectsStore, error: 'Invalid token' });
    render(<SettingsScreen navigation={mockNavigation as any} route={{} as any} />);
    fireEvent.press(screen.getByText('Add Project'));
    expect(screen.getByText('Invalid token')).toBeTruthy();
  });

  it('hides the add-project form when Cancel is pressed', () => {
    render(<SettingsScreen navigation={mockNavigation as any} route={{} as any} />);
    fireEvent.press(screen.getByText('Add Project'));
    fireEvent.press(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('API key')).toBeNull();
  });

  it('shows API Token row when no projects exist', () => {
    render(<SettingsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(screen.getByText('API Token')).toBeTruthy();
  });

  it('hides API Token row when projects exist', () => {
    mockUseProjectsStore.mockReturnValue({
      ...defaultProjectsStore,
      projects: [{ id: 'p1', name: 'My Project' }],
      activeProjectId: 'p1',
    });
    render(<SettingsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(screen.queryByText('API Token')).toBeNull();
  });
});
