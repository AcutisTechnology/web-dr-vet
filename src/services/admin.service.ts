import { apiClient } from "@/lib/api-client";
import type { AdminAccountDetail, AdminOverview } from "@/types/admin";

export const adminService = {
  async getOverview(): Promise<AdminOverview> {
    const { data } = await apiClient.get<{ data: AdminOverview }>("/admin/overview");
    return data.data;
  },

  async getAccountDetail(accountId: string): Promise<AdminAccountDetail> {
    const { data } = await apiClient.get<{ data: AdminAccountDetail }>(`/admin/accounts/${accountId}`);
    return data.data;
  },
};
