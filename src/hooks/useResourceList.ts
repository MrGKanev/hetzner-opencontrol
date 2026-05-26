import { useState, useEffect, useCallback } from "react";
import { Alert, Platform } from "react-native";
import {
  showActionSheet,
  type ActionSheetOption,
} from "../components/common/ActionSheet";

export function useResourceList<T>(fetchFn: () => Promise<T[]>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<T | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await fetchFn());
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const openSheet = useCallback(
    (
      item: T,
      title: string,
      options: ActionSheetOption[],
      onSelect: (i: number) => void,
    ) => {
      setSelected(item);
      if (Platform.OS === "ios") {
        showActionSheet({ title, options, onSelect });
      } else {
        setSheetVisible(true);
      }
    },
    [],
  );

  return {
    data,
    setData,
    loading,
    refreshing,
    selected,
    setSelected,
    sheetVisible,
    setSheetVisible,
    load,
    refresh,
    openSheet,
  };
}
