import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LogoEntry {
  userId: string;
  logoUrl: string;
  updatedAt: string;
}

interface LogoState {
  logos: LogoEntry[];
  getLogo: (userId: string) => string | null;
  setLogo: (userId: string, logoUrl: string) => void;
  removeLogo: (userId: string) => void;
}

export const useLogoStore = create<LogoState>()(
  persist(
    (set, get) => ({
      logos: [],
      getLogo: (userId) =>
        get().logos.find((l) => l.userId === userId)?.logoUrl ?? null,
      setLogo: (userId, logoUrl) =>
        set((state) => ({
          logos: [
            ...state.logos.filter((l) => l.userId !== userId),
            { userId, logoUrl, updatedAt: new Date().toISOString() },
          ],
        })),
      removeLogo: (userId) =>
        set((state) => ({
          logos: state.logos.filter((l) => l.userId !== userId),
        })),
    }),
    { name: "drvet-logos" },
  ),
);
