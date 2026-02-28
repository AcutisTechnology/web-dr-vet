import { create } from "zustand";
import type { SaleItem, PaymentMethod } from "@/types";
import { generateId } from "@/lib/utils";

interface CartState {
  clientId: string | null;
  petId: string | null;
  items: SaleItem[];
  discount: number;
  payments: { method: PaymentMethod; amount: number; installments?: number }[];
  setClient: (clientId: string | null) => void;
  setPet: (petId: string | null) => void;
  addItem: (item: Omit<SaleItem, "id">) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, data: Partial<SaleItem>) => void;
  setDiscount: (discount: number) => void;
  addPayment: (payment: { method: PaymentMethod; amount: number; installments?: number }) => void;
  removePayment: (index: number) => void;
  clearCart: () => void;
  subtotal: () => number;
  total: () => number;
  remaining: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  clientId: null,
  petId: null,
  items: [],
  discount: 0,
  payments: [],

  setClient: (clientId) => set({ clientId }),
  setPet: (petId) => set({ petId }),

  addItem: (item) =>
    set((s) => ({ items: [...s.items, { ...item, id: generateId() }] })),

  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

  updateItem: (id, data) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...data } : i)),
    })),

  setDiscount: (discount) => set({ discount }),

  addPayment: (payment) =>
    set((s) => ({ payments: [...s.payments, payment] })),

  removePayment: (index) =>
    set((s) => ({ payments: s.payments.filter((_, i) => i !== index) })),

  clearCart: () =>
    set({ clientId: null, petId: null, items: [], discount: 0, payments: [] }),

  subtotal: () => get().items.reduce((sum, i) => sum + i.total, 0),
  total: () => get().subtotal() - get().discount,
  remaining: () => {
    const paid = get().payments.reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, get().total() - paid);
  },
}));
