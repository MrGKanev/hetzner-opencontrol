import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import { Haptics } from '../../services/haptics';

const BIOMETRIC_ICON: Record<string, string> = {
  FaceID: '􀎽',   // Face ID glyph — Android fallback below
  TouchID: '􀟒',
  Biometrics: '🔒',
  none: '',
};

// Android-friendly labels
const BIOMETRIC_LABEL: Record<string, string> = {
  FaceID: 'Face ID',
  TouchID: 'Touch ID',
  Biometrics: 'Biometrics',
  none: '',
};

export default function LoginScreen() {
  const [apiKey, setApiKey] = useState('');
  const [saveKey, setSaveKey] = useState(true);

  const { login, unlockWithBiometrics, isLoading, error, clearError, biometricType } = useAuthStore();

  // Auto-prompt biometrics if we have a saved session
  useEffect(() => {
    if (biometricType !== 'none') {
      handleBiometrics();
    }
  }, [biometricType]);

  const handleLogin = async () => {
    if (!apiKey.trim()) {
      Haptics.warning();
      Alert.alert('Error', 'Please enter your API key');
      return;
    }
    Haptics.medium();
    await login(apiKey.trim(), saveKey);
    if (!useAuthStore.getState().error) {
      Haptics.success();
    } else {
      Haptics.error();
    }
  };

  const handleBiometrics = async () => {
    Haptics.light();
    await unlockWithBiometrics();
    if (!useAuthStore.getState().error) {
      Haptics.success();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>HOC</Text>
            <Text style={styles.logoSub}>Hetzner OpenControl</Text>
          </View>

          <Text style={styles.headline}>Manage your{'\n'}Hetzner Cloud</Text>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>API Key</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="Enter your API key"
              placeholderTextColor={Colors.textMuted}
              value={apiKey}
              onChangeText={text => { setApiKey(text); clearError(); }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.saveRow}>
              <Text style={styles.saveLabel}>Save API Key securely</Text>
              <Switch
                value={saveKey}
                onValueChange={v => { setSaveKey(v); Haptics.light(); }}
                trackColor={{ false: Colors.cardBorder, true: Colors.primary }}
                thumbColor={Colors.textPrimary}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.textPrimary} />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </TouchableOpacity>

            {/* Biometrics button — shown only if a saved key exists */}
            {biometricType !== 'none' && (
              <TouchableOpacity
                style={styles.biometricBtn}
                onPress={handleBiometrics}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.biometricIcon}>
                  {Platform.OS === 'ios' ? BIOMETRIC_ICON[biometricType] : '🔒'}
                </Text>
                <Text style={styles.biometricText}>
                  Unlock with {BIOMETRIC_LABEL[biometricType]}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: Spacing.lg },

  logoContainer: { marginTop: Spacing.xl, marginBottom: Spacing.xxl },
  logoText: { fontSize: 32, fontWeight: '800', color: Colors.primary, letterSpacing: 2 },
  logoSub: { ...Typography.bodySmall, marginTop: 2 },

  headline: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 42,
    marginBottom: Spacing.xl,
  },

  form: { gap: Spacing.md },
  label: { ...Typography.label },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    color: Colors.textPrimary,
    padding: Spacing.md,
    fontSize: 15,
  },
  inputError: { borderColor: Colors.error },
  errorText: { color: Colors.error, fontSize: 13 },

  saveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  saveLabel: { ...Typography.body },

  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.textPrimary, fontSize: 17, fontWeight: '600' },

  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
  },
  biometricIcon: { fontSize: 20 },
  biometricText: { ...Typography.body, fontWeight: '500' },
});
