import { Alert } from "react-native";

export function confirmDelete(
  name: string,
  onConfirm: () => Promise<void>,
): void {
  Alert.alert("Delete", `Delete "${name}"? This cannot be undone.`, [
    { text: "Cancel", style: "cancel" },
    {
      text: "Delete",
      style: "destructive",
      onPress: async () => {
        try {
          await onConfirm();
        } catch (e: any) {
          Alert.alert("Error", e.message);
        }
      },
    },
  ]);
}
