import { apiClient } from "@/lib/api-client";
import type { AuthResponse, LoginPayload, RegisterPayload } from "@/types/api";

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/login", payload);
    return data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/register", payload);
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/logout");
  },

  me: async (): Promise<AuthResponse["data"]["user"]> => {
    const { data } = await apiClient.get<{ data: AuthResponse["data"]["user"] }>("/me");
    return data.data;
  },
};
