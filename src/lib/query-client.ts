import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 2, // 2 min: datos "fresh", sin refetch
        gcTime: 1000 * 60 * 10, // 10 min: tiempo en caché tras quedar inactivos
      },
    },
  });
}
