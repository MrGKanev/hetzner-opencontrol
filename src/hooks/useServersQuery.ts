import { useQuery } from "@tanstack/react-query";
import { Platform, NativeModules } from "react-native";
import * as serverApi from "../api/servers";
import { queryClient } from "../api/queryClient";
import type { Server } from "../models";

export const SERVERS_KEY = ["servers"] as const;

function syncWidget(servers: Server[]) {
  if (Platform.OS !== "android") return;
  const { WidgetData } = NativeModules;
  if (!WidgetData) return;
  WidgetData.updateServers(
    JSON.stringify(servers.map((s) => ({ name: s.name, status: s.status }))),
  );
}

async function fetchServers(): Promise<Server[]> {
  const servers = await serverApi.getServers();
  syncWidget(servers);
  return servers;
}

export function useServersQuery() {
  return useQuery({
    queryKey: SERVERS_KEY,
    queryFn: fetchServers,
    staleTime: 30_000,
  });
}

export function invalidateServers() {
  return queryClient.invalidateQueries({ queryKey: SERVERS_KEY });
}

export function setServersData(updater: Server[] | ((prev: Server[]) => Server[])) {
  queryClient.setQueryData(SERVERS_KEY, (old: Server[] | undefined) => {
    const prev = old ?? [];
    return typeof updater === "function" ? updater(prev) : updater;
  });
}
