import React, { useState, useEffect, useRef } from 'react';
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
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';
import { Haptics } from '../../services/haptics';
import HetznerLogo from '../../components/common/HetznerLogo';

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
  const colors = useColors();
  const styles = makeStyles(colors);

  const { login, unlockWithBiometrics, isLoading, error, clearError, biometricType } = useAuthStore();
  const biometricPromptedRef = useRef(false);

  // Auto-prompt biometrics once when the screen first appears with a known biometric type
  useEffect(() => {
    if (biometricType !== 'none' && !biometricPromptedRef.current) {
      biometricPromptedRef.current = true;
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
            <HetznerLogo size={72} />
            <Text style={styles.appName}>OpenControl</Text>
            <Text style={styles.unofficial}>Unofficial Hetzner Cloud App</Text>
          </View>

          <Text style={styles.headline}>Manage your{'\n'}Hetzner Cloud</Text>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>API Key</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="Enter your API key"
              placeholderTextColor={colors.textMuted}
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
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor={colors.textPrimary}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.textPrimary} />
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

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: c.background },
  scroll: { flexGrow: 1, padding: Spacing.lg },

  logoContainer: { marginTop: Spacing.xl, marginBottom: Spacing.xxl, alignItems: 'flex-start', gap: Spacing.sm },
  appName: { fontSize: 26, fontWeight: '800', color: c.textPrimary, letterSpacing: 0.5 },
  unofficial: { ...Typography.caption, color: c.textMuted },

  headline: {
    fontSize: 34,
    fontWeight: '700',
    color: c.textPrimary,
    lineHeight: 42,
    marginBottom: Spacing.xl,
  },

  form: { gap: Spacing.md },
  label: { ...Typography.label, color: c.textSecondary },
  input: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.cardBorder,
    borderRadius: BorderRadius.md,
    color: c.textPrimary,
    padding: Spacing.md,
    fontSize: 15,
  },
  inputError: { borderColor: c.error },
  errorText: { color: c.error, fontSize: 13 },

  saveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  saveLabel: { ...Typography.body, color: c.textPrimary },

  button: {
    backgroundColor: c.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: c.textPrimary, fontSize: 17, fontWeight: '600' },

  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    borderRadius: BorderRadius.md,
  },
  biometricIcon: { fontSize: 20 },
  biometricText: { ...Typography.body, color: c.textPrimary, fontWeight: '500' },
});
