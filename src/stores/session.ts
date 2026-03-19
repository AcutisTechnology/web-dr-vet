import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface SessionState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updates) =>
        set((state) =>
          state.user ? { user: { ...state.user, ...updates } } : {},
        ),
    }),
    { name: "vetdom-session" },
  ),
);
