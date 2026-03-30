import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

export type BiometricType = 'FaceID' | 'TouchID' | 'Biometrics' | 'none';

export async function getBiometricType(): Promise<BiometricType> {
  try {
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    if (!available) return 'none';
    if (biometryType === BiometryTypes.FaceID) return 'FaceID';
    if (biometryType === BiometryTypes.TouchID) return 'TouchID';
    return 'Biometrics';
  } catch {
    return 'none';
  }
}

export async function authenticateWithBiometrics(reason: string): Promise<boolean> {
  try {
    const { success } = await rnBiometrics.simplePrompt({ promptMessage: reason });
    return success;
  } catch {
    return false;
  }
}
