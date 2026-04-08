import { apiClient } from "@/lib/api-client";
import type { AdminOverview } from "@/types/admin";

export const adminService = {
  async getOverview(): Promise<AdminOverview> {
    const { data } = await apiClient.get<{ data: AdminOverview }>("/admin/overview");
    return data.data;
  },
};
