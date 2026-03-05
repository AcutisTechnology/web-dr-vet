import { apiClient } from "@/lib/api-client";

export interface ApiFinanceEntry {
  id: string;
  type: "income" | "expense";
  category_id: string;
  account_id: string;
  pet_id: string | null;
  due_date: string;
  paid_date?: string | null;
  amount: number | string;
  description: string;
  status: "paid" | "pending" | "overdue" | "cancelled";
  payment_method: string | null;
  recurring: boolean | string | null;
  notes: string | null;
  pet_finance_type?: string | null;
  from_sale?: boolean;
  category?: { id: string; name: string; type: string };
  account?: { id: string; name: string; type: string; balance: number };
  pet?: { id: string; name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface ApiFinanceCategory {
  id: string;
  name: string;
  type: "income" | "expense";
  created_at: string;
  updated_at: string;
}

export interface ApiFinanceAccount {
  id: string;
  name: string;
  type: "checking" | "savings" | "cash" | "credit_card";
  balance: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreFinanceEntryPayload {
  type: "income" | "expense";
  category_id: string;
  account_id: string;
  pet_id?: string;
  date?: string;
  due_date?: string;
  amount: number;
  description: string;
  status: string;
  payment_method?: string;
  notes?: string;
}

export const financeService = {
  listEntries: async (
    params?: Record<string, string>,
  ): Promise<ApiFinanceEntry[]> => {
    const { data } = await apiClient.get<ApiFinanceEntry[]>(
      "/finance-entries",
      { params },
    );
    return data;
  },

  createEntry: async (
    payload: StoreFinanceEntryPayload,
  ): Promise<ApiFinanceEntry> => {
    const { data } = await apiClient.post<ApiFinanceEntry>(
      "/finance-entries",
      payload,
    );
    return data;
  },

  updateEntry: async (
    id: string,
    payload: Partial<StoreFinanceEntryPayload>,
  ): Promise<ApiFinanceEntry> => {
    const { data } = await apiClient.put<ApiFinanceEntry>(
      `/finance-entries/${id}`,
      payload,
    );
    return data;
  },

  markPaid: async (id: string): Promise<ApiFinanceEntry> => {
    const { data } = await apiClient.patch<ApiFinanceEntry>(
      `/finance-entries/${id}/mark-paid`,
    );
    return data;
  },

  deleteEntry: async (id: string): Promise<void> => {
    await apiClient.delete(`/finance-entries/${id}`);
  },

  listCategories: async (): Promise<ApiFinanceCategory[]> => {
    const { data } = await apiClient.get<ApiFinanceCategory[]>(
      "/finance-categories",
    );
    return data;
  },

  createCategory: async (payload: {
    name: string;
    type: string;
  }): Promise<ApiFinanceCategory> => {
    const { data } = await apiClient.post<ApiFinanceCategory>(
      "/finance-categories",
      payload,
    );
    return data;
  },

  listAccounts: async (): Promise<ApiFinanceAccount[]> => {
    const { data } =
      await apiClient.get<ApiFinanceAccount[]>("/finance-accounts");
    return data;
  },

  createAccount: async (payload: {
    name: string;
    type: string;
    balance?: number;
  }): Promise<ApiFinanceAccount> => {
    const { data } = await apiClient.post<ApiFinanceAccount>(
      "/finance-accounts",
      payload,
    );
    return data;
  },

  listEntriesByPet: async (petId: string): Promise<ApiFinanceEntry[]> => {
    const { data } = await apiClient.get<ApiFinanceEntry[]>(
      `/finance-entries/pet/${petId}`,
    );
    return data;
  },
};
