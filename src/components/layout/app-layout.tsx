"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/session";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Toaster } from "@/components/ui/toaster";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSessionStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar onMobileMenuToggle={() => setMobileMenuOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
