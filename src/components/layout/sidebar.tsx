"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  BedDouble,
  ShoppingCart,
  Package,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  UserCog,
  CreditCard,
  X,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useSessionStore } from "@/stores/session";
import { useLogoStore } from "@/stores/logo";
import { canAccessRoute } from "@/lib/permissions";

const SIDEBAR_BG =
  "linear-gradient(160deg, color-mix(in srgb, var(--primary) 78%, #000 22%) 0%, var(--primary) 52%, color-mix(in srgb, var(--primary) 82%, var(--info) 18%) 100%)";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/clientes", label: "Clientes & Pets", icon: Users },
  { href: "/internacao", label: "Internação", icon: BedDouble },
  { href: "/pdv", label: "PDV / Vendas", icon: ShoppingCart },
  { href: "/estoque", label: "Estoque", icon: Package },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/usuarios", label: "Usuários", icon: UserCog },
  { href: "/assinatura", label: "Assinatura", icon: CreditCard },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function LogoDisplay({
  collapsed,
  isMobile,
  onMobileClose,
}: {
  collapsed: boolean;
  isMobile: boolean;
  onMobileClose?: () => void;
}) {
  const { user } = useSessionStore();
  const { getLogo } = useLogoStore();
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration for zustand persist
  useEffect(() => {
    setIsHydrated(true);
    // Reset logo state when user changes
    setLogoLoaded(false);
    setLogoError(false);
  }, [user?.id]);

  const userId = user?.id ?? "";
  const userLogoUrl = isHydrated && userId ? getLogo(userId) : null;
  const showCustomLogo = !!userLogoUrl && !logoError;

  if (!isMobile && collapsed) {
    return (
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative"
        style={{
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.28), 0 8px 16px rgba(5,10,24,0.35)",
        }}
      >
        {/* Skeleton while loading */}
        {!isHydrated && (
          <div className="absolute inset-0 bg-white/10 animate-pulse rounded-xl" />
        )}
        {isHydrated && showCustomLogo ? (
          <>
            {!logoLoaded && (
              <div className="absolute inset-0 bg-white/10 animate-pulse rounded-xl" />
            )}
            <Image
              src={userLogoUrl}
              alt="Logo"
              width={36}
              height={36}
              className="object-cover w-full h-full"
              unoptimized
              onLoad={() => setLogoLoaded(true)}
              onError={() => setLogoError(true)}
            />
          </>
        ) : isHydrated ? (
          <Image
            src="/images/logo.jpeg"
            alt="DrVet"
            width={36}
            height={36}
            className="object-cover"
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 w-full">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative"
        style={{
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.28), 0 8px 18px rgba(5,10,24,0.36)",
        }}
      >
        {/* Skeleton while hydrating */}
        {!isHydrated && (
          <div className="absolute inset-0 bg-white/10 animate-pulse rounded-xl" />
        )}
        {isHydrated && showCustomLogo ? (
          <>
            {!logoLoaded && (
              <div className="absolute inset-0 bg-white/10 animate-pulse rounded-xl" />
            )}
            <Image
              src={userLogoUrl}
              alt="Logo"
              width={40}
              height={40}
              className="object-cover w-full h-full"
              unoptimized
              onLoad={() => setLogoLoaded(true)}
              onError={() => setLogoError(true)}
            />
          </>
        ) : isHydrated ? (
          <Image
            src="/images/logo.jpeg"
            alt="DrVet"
            width={40}
            height={40}
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        {!isHydrated ? (
          // Skeleton for text
          <div className="space-y-1">
            <div className="h-3 bg-white/10 rounded animate-pulse w-16" />
          </div>
        ) : (
          <p className="font-bold text-sm leading-tight tracking-widest uppercase text-white truncate">
            {user?.clinicName ? user.clinicName : "DrVet"}
          </p>
        )}
      </div>
      {isMobile && onMobileClose && (
        <button
          onClick={onMobileClose}
          className="text-white/60 hover:text-white transition-colors ml-auto shrink-0"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

function SidebarContent({
  collapsed,
  setCollapsed,
  onMobileClose,
  isMobile = false,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onMobileClose?: () => void;
  isMobile?: boolean;
}) {
  const pathname = usePathname();
  const { user } = useSessionStore();
  const visibleItems = navItems.filter((item) => canAccessRoute(user, item.href));

  return (
    <aside
        className={cn(
          "relative flex flex-col text-white transition-all duration-300 shrink-0 overflow-hidden h-full",
          isMobile ? "w-64" : collapsed ? "w-16" : "w-60",
        )}
        style={{
        background: SIDEBAR_BG,
        borderRight: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {/* Orbs decorativos de fundo */}
      <div
        className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--accent)" }}
      />
      <div
        className="pointer-events-none absolute bottom-10 -right-10 w-40 h-40 rounded-full opacity-10 blur-3xl"
        style={{ background: "var(--info)" }}
      />

      {/* Logo */}
      <div
        className={cn(
          "relative z-10 flex items-center gap-3 px-4 py-5",
          !isMobile && collapsed ? "justify-center px-2" : "",
        )}
      >
        <LogoDisplay
          collapsed={collapsed}
          isMobile={isMobile}
          onMobileClose={onMobileClose}
        />
      </div>

      {/* Divisor com gradiente teal */}
      <div
        className="mx-3 mb-2 h-px opacity-30"
            style={{
              background:
            "linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 90%, transparent), transparent)",
            }}
          />

      {/* Nav */}
      <nav className="relative z-10 flex-1 px-2 py-2 overflow-y-auto space-y-1">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={isMobile ? onMobileClose : undefined}
              className={cn(
                "group relative flex items-center gap-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                !isMobile && collapsed ? "justify-center px-0" : "px-3",
                active
                  ? "text-white font-medium"
                  : "text-white/45 hover:text-white/80",
              )}
                style={
                  active
                    ? {
                      background:
                        "linear-gradient(135deg, rgba(45,198,198,0.16) 0%, rgba(45,198,198,0.06) 100%)",
                      boxShadow:
                        "inset 0 0 0 1px rgba(45,198,198,0.28), 0 4px 14px rgba(0,0,0,0.2)",
                    }
                  : undefined
              }
              onMouseEnter={(e) => {
                if (!active)
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                if (!active)
                  (e.currentTarget as HTMLElement).style.background = "";
              }}
              title={!isMobile && collapsed ? label : undefined}
            >
              <Icon
                className="w-[18px] h-[18px] shrink-0 transition-all duration-200"
                style={
                  active
                        ? {
                        color: "var(--accent)",
                        filter: "drop-shadow(0 0 4px color-mix(in srgb, var(--accent) 35%, transparent))",
                      }
                    : undefined
                }
              />
              {(isMobile || !collapsed) && (
                <span className="tracking-wide text-[13px]">{label}</span>
              )}
              {/* Dot indicador no collapsed */}
              {active && !isMobile && collapsed && (
                <span
                  className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "var(--accent)",
                    boxShadow: "0 0 4px color-mix(in srgb, var(--accent) 55%, transparent)",
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé */}
      {(isMobile || !collapsed) && (
        <div className="relative z-10 px-4 py-3">
          <div
            className="h-px mb-3 opacity-20"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 90%, transparent), transparent)",
            }}
          />
          <p className="text-[10px] text-white/25 text-center tracking-[0.2em] uppercase">
            v1.0
          </p>
        </div>
      )}

      {/* Collapse toggle — desktop only */}
      {!isMobile && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-22 z-20 flex items-center justify-center w-6 h-6 rounded-full text-white/60 hover:text-white transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 75%, #000 25%), var(--primary))",
            border: "1px solid rgba(255,255,255,0.24)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      )}
    </aside>
  );
}

export function Sidebar({
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <SidebarContent
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </div>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent
          collapsed={false}
          setCollapsed={() => {}}
          onMobileClose={onMobileClose}
          isMobile
        />
      </div>
    </>
  );
}
