import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";

export const adminKeys = {
  overview: () => ["admin", "overview"] as const,
};

export function useAdminOverview() {
  return useQuery({
    queryKey: adminKeys.overview(),
    queryFn: adminService.getOverview,
    staleTime: 1000 * 60 * 2,
  });
}
