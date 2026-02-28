import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface RegisteredUser extends User {
  passwordHash: string;
}

interface UserRegistryState {
  users: RegisteredUser[];
  addUser: (user: RegisteredUser) => void;
  findByEmail: (email: string) => RegisteredUser | undefined;
}

export const useUserRegistry = create<UserRegistryState>()(
  persist(
    (set, get) => ({
      users: [],
      addUser: (user) =>
        set((state) => ({
          users: [...state.users.filter((u) => u.email !== user.email), user],
        })),
      findByEmail: (email) =>
        get().users.find((u) => u.email === email),
    }),
    { name: "drvet-user-registry" }
  )
);

export type { RegisteredUser };
