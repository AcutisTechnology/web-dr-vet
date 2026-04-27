import { apiClient } from "@/lib/api-client";
import type {
  AdminAccountDetail,
  AdminOverview,
  AdminSubscriptionAction,
  AdminSubscriptionDetails,
} from "@/types/admin";

export const adminService = {
  async getOverview(): Promise<AdminOverview> {
    const { data } = await apiClient.get<{ data: AdminOverview }>("/admin/overview");
    return data.data;
  },

  async getAccountDetail(accountId: string): Promise<AdminAccountDetail> {
    const { data } = await apiClient.get<{ data: AdminAccountDetail }>(`/admin/accounts/${accountId}`);
    return data.data;
  },

  async toggleSubscription(
    accountId: string,
    payload: { action: AdminSubscriptionAction; months?: number; days?: number },
  ): Promise<{ message: string; subscription: AdminSubscriptionDetails }> {
    const { data } = await apiClient.patch<{
      message: string;
      subscription: AdminSubscriptionDetails;
    }>(`/admin/accounts/${accountId}/subscription`, payload);
    return data;
  },
};
