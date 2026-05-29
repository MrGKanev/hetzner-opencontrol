import ReactNativeBiometrics from 'react-native-biometrics';
import { getBiometricType, authenticateWithBiometrics } from '../../src/services/biometrics';

// biometrics.ts creates `rnBiometrics = new ReactNativeBiometrics(...)` at module load time.
// Capture the mock instance returned by the constructor before any test can clear it.
const bio = (ReactNativeBiometrics as jest.Mock).mock.results[0].value as {
  isSensorAvailable: jest.Mock;
  simplePrompt: jest.Mock;
};

beforeEach(() => {
  bio.isSensorAvailable.mockReset();
  bio.simplePrompt.mockReset();
});

// ── getBiometricType ──────────────────────────────────────────────────────────

describe('getBiometricType', () => {
  it('returns "none" when no sensor is available', async () => {
    bio.isSensorAvailable.mockResolvedValueOnce({ available: false });
    expect(await getBiometricType()).toBe('none');
  });

  it('returns "FaceID" when FaceID is available', async () => {
    bio.isSensorAvailable.mockResolvedValueOnce({ available: true, biometryType: 'FaceID' });
    expect(await getBiometricType()).toBe('FaceID');
  });

  it('returns "TouchID" when TouchID is available', async () => {
    bio.isSensorAvailable.mockResolvedValueOnce({ available: true, biometryType: 'TouchID' });
    expect(await getBiometricType()).toBe('TouchID');
  });

  it('returns "Biometrics" for other available biometric types', async () => {
    bio.isSensorAvailable.mockResolvedValueOnce({ available: true, biometryType: 'Biometrics' });
    expect(await getBiometricType()).toBe('Biometrics');
  });

  it('returns "none" when isSensorAvailable throws', async () => {
    bio.isSensorAvailable.mockRejectedValueOnce(new Error('Sensor error'));
    expect(await getBiometricType()).toBe('none');
  });
});

// ── authenticateWithBiometrics ────────────────────────────────────────────────

describe('authenticateWithBiometrics', () => {
  it('returns true when simplePrompt succeeds', async () => {
    bio.simplePrompt.mockResolvedValueOnce({ success: true });
    expect(await authenticateWithBiometrics('Unlock')).toBe(true);
    expect(bio.simplePrompt).toHaveBeenCalledWith({ promptMessage: 'Unlock' });
  });

  it('returns false when simplePrompt returns success=false', async () => {
    bio.simplePrompt.mockResolvedValueOnce({ success: false });
    expect(await authenticateWithBiometrics('Unlock')).toBe(false);
  });

  it('returns false when simplePrompt throws', async () => {
    bio.simplePrompt.mockRejectedValueOnce(new Error('User cancelled'));
    expect(await authenticateWithBiometrics('Unlock')).toBe(false);
  });
});
