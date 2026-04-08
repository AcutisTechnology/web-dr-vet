import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";

export const adminKeys = {
  overview: () => ["admin", "overview"] as const,
  accountDetail: (accountId: string) => ["admin", "accounts", accountId] as const,
};

export function useAdminOverview() {
  return useQuery({
    queryKey: adminKeys.overview(),
    queryFn: adminService.getOverview,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAdminAccountDetail(accountId: string) {
  return useQuery({
    queryKey: adminKeys.accountDetail(accountId),
    queryFn: () => adminService.getAccountDetail(accountId),
    enabled: Boolean(accountId),
    staleTime: 1000 * 60 * 2,
  });
}
