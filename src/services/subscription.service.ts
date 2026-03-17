import { apiClient } from "@/lib/api-client";
import type {
  Subscription,
  CreateSubscriptionPayload,
  CreatePaymentResponse,
} from "@/types/subscription";

export const subscriptionService = {
  async getSubscription(): Promise<Subscription | null> {
    try {
      const response = await apiClient.get<{ data: Subscription }>(
        "/subscription",
      );
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async createSubscription(
    payload: CreateSubscriptionPayload,
  ): Promise<Subscription> {
    const response = await apiClient.post<{ data: Subscription }>(
      "/subscription",
      payload,
    );
    return response.data.data;
  },

  async createPayment(): Promise<CreatePaymentResponse> {
    const response = await apiClient.post<{ data: CreatePaymentResponse }>(
      "/subscription/payment",
    );
    return response.data.data;
  },

  async cancelSubscription(): Promise<void> {
    await apiClient.post("/subscription/cancel");
  },

  async reactivateSubscription(): Promise<Subscription> {
    const response = await apiClient.post<{ data: Subscription }>(
      "/subscription/reactivate",
    );
    return response.data.data;
  },

  async checkPaymentStatus(): Promise<any> {
    const response = await apiClient.post("/subscription/check-payment");
    return response.data;
  },

  async confirmPayment(): Promise<any> {
    const response = await apiClient.post("/subscription/confirm-payment");
    return response.data;
  },
};
