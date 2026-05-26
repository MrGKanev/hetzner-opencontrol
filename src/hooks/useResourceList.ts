import { useState, useCallback } from "react";
import { Platform } from "react-native";
import { useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import {
  showActionSheet,
  type ActionSheetOption,
} from "../components/common/ActionSheet";

export function useResourceList<T>(queryKey: QueryKey, fetchFn: () => Promise<T[]>) {
  const queryClient = useQueryClient();
  const query = useQuery<T[]>({
    queryKey,
    queryFn: fetchFn,
    staleTime: 60_000,
  });

  const [selected, setSelected] = useState<T | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const setData = useCallback(
    (updater: T[] | ((prev: T[]) => T[])) => {
      queryClient.setQueryData(queryKey, (old: T[] | undefined) => {
        const prev = old ?? [];
        return typeof updater === "function" ? updater(prev) : updater;
      });
    },
    [queryClient, queryKey],
  );

  const load = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey });
  }, [queryClient, queryKey]);

  const refresh = useCallback(() => {
    queryClient.refetchQueries({ queryKey });
  }, [queryClient, queryKey]);

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
    data: query.data ?? [],
    setData,
    loading: query.isLoading,
    refreshing: query.isRefetching && !query.isLoading,
    selected,
    setSelected,
    sheetVisible,
    setSheetVisible,
    load,
    refresh,
    openSheet,
  };
}
