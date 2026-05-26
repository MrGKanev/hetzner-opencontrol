import { setServersData } from "../hooks/useServersQuery";
import type { Server } from "../models";

export function updateServerInList(server: Server) {
  setServersData((prev) => prev.map((s) => (s.id === server.id ? server : s)));
}
