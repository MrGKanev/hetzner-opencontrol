import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import type { Volume } from '../../src/models';

// ── mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../src/hooks/useResourceList', () => ({
  useResourceList: jest.fn(),
}));

jest.mock('../../src/store/themeStore', () => ({
  useColors: jest.fn(() => require('../../src/theme').darkColors),
}));

jest.mock('../../src/api/volumes', () => ({
  getVolumes: jest.fn(),
  deleteVolume: jest.fn(),
  detachVolume: jest.fn(),
}));

jest.mock('../../src/components/common/ActionSheet', () => ({
  ActionSheetModal: () => null,
}));

jest.mock('../../src/utils/dialogs', () => ({
  confirmDelete: jest.fn(),
}));

// ── helpers ───────────────────────────────────────────────────────────────────

import { useResourceList } from '../../src/hooks/useResourceList';

const mockUseResourceList = useResourceList as jest.Mock;

const mockLocation = {
  id: 1,
  name: 'fsn1',
  description: 'Falkenstein DC Park 1',
  country: 'DE',
  city: 'Falkenstein',
  latitude: 50.47,
  longitude: 12.37,
  network_zone: 'eu-central',
};

function makeVolume(overrides: Partial<Volume> & Pick<Volume, 'id' | 'name'>): Volume {
  return {
    server: null,
    location: mockLocation,
    size: 10,
    linux_device: '/dev/sdb',
    status: 'available',
    created: '2024-01-01T00:00:00Z',
    labels: {},
    protection: { delete: false },
    format: null,
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
  load: jest.fn(),
  openSheet: jest.fn(),
};

import VolumeListScreen from '../../src/screens/volumes/VolumeListScreen';

// ── tests ──────────────────────────────────────────────────────────────────────

describe('VolumeListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseResourceList.mockReturnValue(defaultResourceList);
  });

  it('renders the "Volumes" heading', () => {
    render(<VolumeListScreen />);
    expect(screen.getByText('Volumes')).toBeTruthy();
  });

  it('shows an activity indicator while loading', () => {
    mockUseResourceList.mockReturnValue({ ...defaultResourceList, loading: true });
    render(<VolumeListScreen />);
    expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('does not show an activity indicator when not loading', () => {
    render(<VolumeListScreen />);
    expect(screen.UNSAFE_queryByType(ActivityIndicator)).toBeNull();
  });

  it('renders volume names', () => {
    mockUseResourceList.mockReturnValue({
      ...defaultResourceList,
      data: [
        makeVolume({ id: 1, name: 'data-vol' }),
        makeVolume({ id: 2, name: 'backup-vol' }),
      ],
    });
    render(<VolumeListScreen />);
    expect(screen.getByText('data-vol')).toBeTruthy();
    expect(screen.getByText('backup-vol')).toBeTruthy();
  });

  it('shows "No volumes found" when list is empty', () => {
    render(<VolumeListScreen />);
    expect(screen.getByText('No volumes found')).toBeTruthy();
  });

  it('shows "Available" badge for unattached volumes', () => {
    mockUseResourceList.mockReturnValue({
      ...defaultResourceList,
      data: [makeVolume({ id: 1, name: 'free-vol', server: null })],
    });
    render(<VolumeListScreen />);
    expect(screen.getByText('Available')).toBeTruthy();
  });

  it('shows "Attached" badge for volumes attached to a server', () => {
    mockUseResourceList.mockReturnValue({
      ...defaultResourceList,
      data: [makeVolume({ id: 2, name: 'srv-vol', server: 99 })],
    });
    render(<VolumeListScreen />);
    expect(screen.getByText('Attached')).toBeTruthy();
  });

  it('displays volume size and location', () => {
    mockUseResourceList.mockReturnValue({
      ...defaultResourceList,
      data: [makeVolume({ id: 1, name: 'meta-vol', size: 50, location: mockLocation })],
    });
    render(<VolumeListScreen />);
    expect(screen.getByText(/50 GB/)).toBeTruthy();
    expect(screen.getByText(/fsn1/)).toBeTruthy();
  });

  it('displays the volume format when set', () => {
    mockUseResourceList.mockReturnValue({
      ...defaultResourceList,
      data: [makeVolume({ id: 1, name: 'ext4-vol', size: 10, format: 'ext4' })],
    });
    render(<VolumeListScreen />);
    expect(screen.getAllByText(/ext4/).length).toBeGreaterThan(0);
  });
});
