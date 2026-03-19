import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, ModulePermissions } from "@/types";

export interface RegisteredUser extends User {
  passwordHash?: string; // optional — users invited via email won't have it yet
  inviteStatus?: "pending" | "accepted"; // tracks if user has set their password
  inviteSentAt?: string;
  permissions?: ModulePermissions;
}

interface UserRegistryState {
  users: RegisteredUser[];
  addUser: (user: RegisteredUser) => void;
  updateUser: (email: string, updates: Partial<RegisteredUser>) => void;
  findByEmail: (email: string) => RegisteredUser | undefined;
  removeUser: (email: string) => void;
}

export const useUserRegistry = create<UserRegistryState>()(
  persist(
    (set, get) => ({
      users: [],
      addUser: (user) =>
        set((state) => ({
          users: [...state.users.filter((u) => u.email !== user.email), user],
        })),
      updateUser: (email, updates) =>
        set((state) => ({
          users: state.users.map((u) =>
            u.email === email ? { ...u, ...updates } : u
          ),
        })),
      findByEmail: (email) =>
        get().users.find((u) => u.email === email),
      removeUser: (email) =>
        set((state) => ({
          users: state.users.filter((u) => u.email !== email),
        })),
    }),
    { name: "drvet-user-registry" }
  )
);
