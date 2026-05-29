import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';

jest.mock('../../src/store/authStore', () => {
  const mockFn: any = jest.fn();
  mockFn.getState = jest.fn(() => ({ error: null }));
  return { useAuthStore: mockFn };
});

jest.mock('../../src/components/common/HetznerLogo', () => 'HetznerLogo');
jest.mock('../../src/services/haptics', () => ({
  Haptics: {
    light: jest.fn(),
    medium: jest.fn(),
    warning: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('../../src/store/themeStore', () => ({
  useColors: jest.fn(() => require('../../src/theme').darkColors),
}));

import { useAuthStore } from '../../src/store/authStore';
import { Haptics } from '../../src/services/haptics';
import LoginScreen from '../../src/screens/auth/LoginScreen';

const mockUseAuthStore = useAuthStore as jest.Mock & { getState: jest.Mock };

const mockLogin = jest.fn();
const mockUnlockWithBiometrics = jest.fn();
const mockClearError = jest.fn();

function setStoreState(overrides: object = {}) {
  mockUseAuthStore.mockReturnValue({
    login: mockLogin,
    unlockWithBiometrics: mockUnlockWithBiometrics,
    isLoading: false,
    error: null,
    clearError: mockClearError,
    biometricType: 'none',
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  setStoreState();
  mockUseAuthStore.getState.mockReturnValue({ error: null });
});

// ── rendering ─────────────────────────────────────────────────────────────────

it('renders the "Log In" button', () => {
  render(<LoginScreen />);
  expect(screen.getByText('Log In')).toBeTruthy();
});

it('renders the API key input field', () => {
  render(<LoginScreen />);
  expect(screen.getByPlaceholderText('Enter your API key')).toBeTruthy();
});

it('shows error text when the store has an error', () => {
  setStoreState({ error: 'Invalid API key' });
  render(<LoginScreen />);
  expect(screen.getByText('Invalid API key')).toBeTruthy();
});

it('does not show error text when there is no error', () => {
  render(<LoginScreen />);
  expect(screen.queryByText('Invalid API key')).toBeNull();
});

it('shows ActivityIndicator and hides Log In text when loading', () => {
  setStoreState({ isLoading: true });
  render(<LoginScreen />);
  expect(screen.queryByText('Log In')).toBeNull();
});

// ── biometric button ──────────────────────────────────────────────────────────

it('shows biometric button when biometricType is FaceID', () => {
  setStoreState({ biometricType: 'FaceID' });
  render(<LoginScreen />);
  expect(screen.getByText('Unlock with Face ID')).toBeTruthy();
});

it('shows biometric button when biometricType is TouchID', () => {
  setStoreState({ biometricType: 'TouchID' });
  render(<LoginScreen />);
  expect(screen.getByText('Unlock with Touch ID')).toBeTruthy();
});

it('hides biometric button when biometricType is none', () => {
  render(<LoginScreen />);
  expect(screen.queryByText(/Unlock with/)).toBeNull();
});

// ── interactions ──────────────────────────────────────────────────────────────

it('calls login() with trimmed key and saveKey value on submit', () => {
  render(<LoginScreen />);
  fireEvent.changeText(
    screen.getByPlaceholderText('Enter your API key'),
    '  my-api-key  ',
  );
  fireEvent.press(screen.getByText('Log In'));
  expect(mockLogin).toHaveBeenCalledWith('my-api-key', true);
});

it('shows Alert when submitting with an empty API key', () => {
  jest.spyOn(Alert, 'alert');
  render(<LoginScreen />);
  fireEvent.press(screen.getByText('Log In'));
  expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter your API key');
  expect(mockLogin).not.toHaveBeenCalled();
});

it('calls clearError() when the text input changes', () => {
  render(<LoginScreen />);
  fireEvent.changeText(
    screen.getByPlaceholderText('Enter your API key'),
    'abc',
  );
  expect(mockClearError).toHaveBeenCalled();
});

it('calls Haptics.warning when submitting an empty key', () => {
  render(<LoginScreen />);
  fireEvent.press(screen.getByText('Log In'));
  expect(Haptics.warning).toHaveBeenCalled();
});

it('calls Haptics.medium when submitting a non-empty key', () => {
  render(<LoginScreen />);
  fireEvent.changeText(screen.getByPlaceholderText('Enter your API key'), 'key');
  fireEvent.press(screen.getByText('Log In'));
  expect(Haptics.medium).toHaveBeenCalled();
});

it('calls unlockWithBiometrics() when biometric button is pressed', () => {
  setStoreState({ biometricType: 'FaceID' });
  render(<LoginScreen />);
  fireEvent.press(screen.getByText('Unlock with Face ID'));
  expect(mockUnlockWithBiometrics).toHaveBeenCalled();
});
