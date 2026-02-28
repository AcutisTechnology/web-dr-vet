import { create } from "zustand";

interface FiltersState {
  appointmentDate: string;
  appointmentView: "day" | "week" | "month";
  clientSearch: string;
  productSearch: string;
  financeStatus: string;
  financePeriodStart: string;
  financePeriodEnd: string;
  setAppointmentDate: (date: string) => void;
  setAppointmentView: (view: "day" | "week" | "month") => void;
  setClientSearch: (q: string) => void;
  setProductSearch: (q: string) => void;
  setFinanceStatus: (s: string) => void;
  setFinancePeriod: (start: string, end: string) => void;
}

const today = new Date().toISOString().split("T")[0];
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString()
  .split("T")[0];

export const useFiltersStore = create<FiltersState>((set) => ({
  appointmentDate: today,
  appointmentView: "week",
  clientSearch: "",
  productSearch: "",
  financeStatus: "all",
  financePeriodStart: firstOfMonth,
  financePeriodEnd: today,
  setAppointmentDate: (date) => set({ appointmentDate: date }),
  setAppointmentView: (view) => set({ appointmentView: view }),
  setClientSearch: (q) => set({ clientSearch: q }),
  setProductSearch: (q) => set({ productSearch: q }),
  setFinanceStatus: (s) => set({ financeStatus: s }),
  setFinancePeriod: (start, end) =>
    set({ financePeriodStart: start, financePeriodEnd: end }),
}));
