import { QueryClient, QueryCache } from "@tanstack/react-query";
import { useToastStore } from "../store/toastStore";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only surface errors when there's no cached data (background refetch failures are silent)
      if (query.state.data === undefined) {
        useToastStore.getState().show((error as Error).message ?? "Request failed");
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
