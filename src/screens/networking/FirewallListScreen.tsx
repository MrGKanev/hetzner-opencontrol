import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { getFirewalls, deleteFirewall } from "../../api/networking";
import { Spacing, BorderRadius, Typography } from "../../theme";
import type { ThemeColors } from "../../theme";
import { useColors } from "../../store/themeStore";
import { ActionSheetModal } from "../../components/common/ActionSheet";
import type { Firewall } from "../../models";
import type { NetworkingStackParamList } from "../../navigation/NetworkingNavigator";
import { useResourceList } from "../../hooks/useResourceList";
import { confirmDelete } from "../../utils/dialogs";

type Nav = NativeStackNavigationProp<NetworkingStackParamList>;

const ACTIONS = [
  { label: "View Rules", icon: "📋" },
  { label: "Delete Firewall", icon: "🗑", destructive: true },
];

export default function FirewallListScreen() {
  const navigation = useNavigation<Nav>();
  const colors = useColors();
  const styles = makeStyles(colors);

  const {
    data: firewalls,
    setData: setFirewalls,
    loading,
    refreshing,
    selected,
    sheetVisible,
    setSheetVisible,
    refresh,
    openSheet,
  } = useResourceList(getFirewalls);

  const handleAction = (index: number, fw: Firewall) => {
    switch (index) {
      case 0:
        navigation.navigate("FirewallDetail", { firewallId: fw.id });
        break;
      case 1:
        confirmDelete(fw.name, async () => {
          await deleteFirewall(fw.id);
          setFirewalls((prev) => prev.filter((f) => f.id !== fw.id));
        });
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Firewalls</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("CreateFirewall")}
        >
          <Text style={styles.addIcon}>＋</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={firewalls}
          keyExtractor={(f) => String(f.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                navigation.navigate("FirewallDetail", { firewallId: item.id })
              }
              onLongPress={() =>
                openSheet(item, item.name, ACTIONS, (i) =>
                  handleAction(i, item),
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.fwName}>{item.name}</Text>
                <Text style={styles.fwMeta}>
                  {item.rules.length} rule{item.rules.length !== 1 ? "s" : ""} ·{" "}
                  {item.applied_to.length} applied
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  openSheet(item, item.name, ACTIONS, (i) =>
                    handleAction(i, item),
                  )
                }
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.menuDots}>•••</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No firewalls found</Text>
          }
        />
      )}

      <ActionSheetModal
        visible={sheetVisible}
        title={selected?.name}
        options={ACTIONS}
        onSelect={(i) => {
          if (selected) handleAction(i, selected);
        }}
        onCancel={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    title: { ...Typography.h1, color: c.textPrimary },
    addBtn: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.full,
      borderWidth: 1.5,
      borderColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    addIcon: { color: c.primary, fontSize: 18 },
    list: { padding: Spacing.lg },
    row: {
      backgroundColor: c.card,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.cardBorder,
      padding: Spacing.md,
      flexDirection: "row",
      alignItems: "center",
    },
    rowLeft: { flex: 1 },
    fwName: { ...Typography.h3, color: c.textPrimary },
    fwMeta: { ...Typography.bodySmall, color: c.textSecondary, marginTop: 2 },
    menuDots: {
      color: c.textMuted,
      fontSize: 16,
      letterSpacing: 1,
      padding: Spacing.xs,
    },
    empty: {
      ...Typography.bodySmall,
      color: c.textSecondary,
      textAlign: "center",
      marginTop: 40,
    },
  });
