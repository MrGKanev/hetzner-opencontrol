import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
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
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const APP_VERSION = '0.0.1';
const KEYCHAIN_SERVICE = 'HetznerOpenControl';

export default function SettingsScreen({ navigation }: Props) {
  const { logout } = useAuthStore();
  const [maskedToken, setMaskedToken] = useState<string | null>(null);
  const [tokenVisible, setTokenVisible] = useState(false);

  const revealToken = async () => {
    if (tokenVisible) {
      setTokenVisible(false);
      setMaskedToken(null);
      return;
    }
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
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Icon name="close" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Account */}
        <SectionHeader title="Account" />
        <View style={styles.card}>
          <SettingsRow
            icon="key-outline"
            label="API Token"
            value={tokenVisible && maskedToken ? maskedToken : '••••••••••••••••••••'}
            onPress={revealToken}
            actionIcon={tokenVisible ? 'eye-off-outline' : 'eye-outline'}
          />
          <Divider />
          <SettingsRow
            icon="logout"
            label="Sign Out"
            labelColor={Colors.error}
            onPress={handleLogout}
          />
        </View>

        {/* About */}
        <SectionHeader title="About" />
        <View style={styles.card}>
          <SettingsRow
            icon="information-outline"
            label="Version"
            value={APP_VERSION}
          />
          <Divider />
          <SettingsRow
            icon="github"
            label="Source Code"
            value="GitHub"
            onPress={() => Linking.openURL('https://github.com/mrgkanev/hetzner-opencontrol')}
            actionIcon="open-in-new"
          />
          <Divider />
          <SettingsRow
            icon="shield-check-outline"
            label="Hetzner API"
            value="docs.hetzner.cloud"
            onPress={() => Linking.openURL('https://docs.hetzner.cloud')}
            actionIcon="open-in-new"
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function Divider() {
  return <View style={styles.divider} />;
}

function SettingsRow({
  icon,
  label,
  labelColor,
  value,
  onPress,
  actionIcon,
}: {
  icon: string;
  label: string;
  labelColor?: string;
  value?: string;
  onPress?: () => void;
  actionIcon?: string;
}) {
  const content = (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Icon name={icon} size={20} color={labelColor ?? Colors.textSecondary} style={styles.rowIcon} />
        <Text style={[styles.rowLabel, labelColor ? { color: labelColor } : {}]}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
        {actionIcon ? <Icon name={actionIcon} size={16} color={Colors.textMuted} style={{ marginLeft: 6 }} /> : null}
        {onPress && !actionIcon ? <Icon name="chevron-right" size={18} color={Colors.textMuted} /> : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...Typography.h2 },
  content: { padding: Spacing.lg, gap: Spacing.sm },
  sectionHeader: {
    ...Typography.label,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: Colors.cardBorder },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowIcon: { marginRight: Spacing.sm },
  rowLabel: { ...Typography.body },
  rowRight: { flexDirection: 'row', alignItems: 'center', maxWidth: '55%' },
  rowValue: { ...Typography.bodySmall, color: Colors.textMuted, flexShrink: 1 },
});
