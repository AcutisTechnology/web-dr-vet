import { apiClient } from "@/lib/api-client";
import type { ApiDashboardStats } from "@/types/api";

export const dashboardService = {
  stats: async (): Promise<ApiDashboardStats> => {
    const { data } = await apiClient.get<{ data: ApiDashboardStats }>("/dashboard/stats");
    return data.data;
  },
};
