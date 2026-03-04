import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";

export const dashboardKeys = {
  stats: () => ["dashboard", "stats"] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: dashboardService.stats,
    staleTime: 1000 * 60 * 2,
  });
}
