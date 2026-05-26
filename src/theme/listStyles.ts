import { StyleSheet } from "react-native";
import { Spacing, BorderRadius, Typography } from "./index";
import type { ThemeColors } from "./index";

export function makeBaseListStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    title: { ...Typography.h1, color: c.textPrimary },
    list: { padding: Spacing.lg },
    card: {
      backgroundColor: c.card,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.cardBorder,
      padding: Spacing.md,
      flexDirection: "row" as const,
      alignItems: "center" as const,
    },
    cardLeft: { flex: 1 },
    menuDots: {
      color: c.textMuted,
      fontSize: 16,
      letterSpacing: 1,
      padding: Spacing.xs,
    },
    empty: {
      ...Typography.bodySmall,
      color: c.textSecondary,
      textAlign: "center" as const,
      marginTop: 40,
    },
    center: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      padding: Spacing.xl,
      gap: Spacing.md,
      marginTop: 40,
    },
    emptyText: { ...Typography.body, color: c.textSecondary },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.sm,
      backgroundColor: c.surface,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginRight: Spacing.sm,
    },
    badge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
      marginLeft: Spacing.sm,
    },
    badgeText: { fontSize: 11, fontWeight: "600" as const },
  });
}
