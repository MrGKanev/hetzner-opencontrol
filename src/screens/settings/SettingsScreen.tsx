import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Keychain from 'react-native-keychain';

import type { RootStackParamList } from '../../navigation';
import { useAuthStore } from '../../store/authStore';
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors, useThemeStore } from '../../store/themeStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const APP_VERSION = '0.0.1';
const KEYCHAIN_SERVICE = 'HetznerOpenControl';

export default function SettingsScreen({ navigation }: Props) {
  const { logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const colors = useColors();
  const styles = makeStyles(colors);
  const [maskedToken, setMaskedToken] = useState<string | null>(null);
  const [tokenVisible, setTokenVisible] = useState(false);

  const revealToken = async () => {
    if (tokenVisible) { setTokenVisible(false); setMaskedToken(null); return; }
    try {
      const credentials = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
      if (credentials && credentials.password) {
        const t = credentials.password;
        setMaskedToken(t.slice(0, 6) + '••••••••••••••••' + t.slice(-4));
        setTokenVisible(true);
      } else {
        setMaskedToken('No saved token');
        setTokenVisible(true);
      }
    } catch {
      setMaskedToken('Unable to read token');
      setTokenVisible(true);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'This will remove your saved API token and return you to the login screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Icon name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Appearance */}
        <Text style={styles.sectionHeader}>Appearance</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon name={isDark ? 'weather-night' : 'weather-sunny'} size={20} color={colors.textSecondary} style={styles.rowIcon} />
              <Text style={styles.rowLabel}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
            </View>
            <Switch
              value={!isDark}
              onValueChange={toggle}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor={colors.textPrimary}
            />
          </View>
        </View>

        {/* Account */}
        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="key-outline"
            label="API Token"
            value={tokenVisible && maskedToken ? maskedToken : '••••••••••••••••••••'}
            onPress={revealToken}
            actionIcon={tokenVisible ? 'eye-off-outline' : 'eye-outline'}
            colors={colors}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="logout"
            label="Sign Out"
            labelColor={colors.error}
            onPress={handleLogout}
            colors={colors}
          />
        </View>

        {/* About */}
        <Text style={styles.sectionHeader}>About</Text>
        <View style={styles.card}>
          <SettingsRow icon="information-outline" label="Version" value={APP_VERSION} colors={colors} />
          <View style={styles.divider} />
          <SettingsRow
            icon="github"
            label="Source Code"
            value="GitHub"
            onPress={() => Linking.openURL('https://github.com/GabrielKanev/Hetzner-OpenControl')}
            actionIcon="open-in-new"
            colors={colors}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="shield-check-outline"
            label="Hetzner API"
            value="docs.hetzner.cloud"
            onPress={() => Linking.openURL('https://docs.hetzner.cloud')}
            actionIcon="open-in-new"
            colors={colors}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({
  icon, label, labelColor, value, onPress, actionIcon, colors,
}: {
  icon: string;
  label: string;
  labelColor?: string;
  value?: string;
  onPress?: () => void;
  actionIcon?: string;
  colors: ThemeColors;
}) {
  const styles = makeStyles(colors);
  const content = (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Icon name={icon} size={20} color={labelColor ?? colors.textSecondary} style={styles.rowIcon} />
        <Text style={[styles.rowLabel, labelColor ? { color: labelColor } : {}]}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
        {actionIcon ? <Icon name={actionIcon} size={16} color={colors.textMuted} style={{ marginLeft: 6 }} /> : null}
        {onPress && !actionIcon ? <Icon name="chevron-right" size={18} color={colors.textMuted} /> : null}
      </View>
    </View>
  );
  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  }
  return content;
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...Typography.h2, color: c.textPrimary },
  content: { padding: Spacing.lg, gap: Spacing.sm },
  sectionHeader: {
    ...Typography.label,
    color: c.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: c.cardBorder },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowIcon: { marginRight: Spacing.sm },
  rowLabel: { ...Typography.body, color: c.textPrimary },
  rowRight: { flexDirection: 'row', alignItems: 'center', maxWidth: '55%' },
  rowValue: { ...Typography.bodySmall, color: c.textMuted, flexShrink: 1 },
});
