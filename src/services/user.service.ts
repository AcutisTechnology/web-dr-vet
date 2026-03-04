import { apiClient } from "@/lib/api-client";
import type { ApiUser } from "@/types/api";

export const userService = {
  list: async (params?: Record<string, string>): Promise<ApiUser[]> => {
    const { data } = await apiClient.get<{ data: ApiUser[] }>("/users", { params });
    return data.data;
  },
};
