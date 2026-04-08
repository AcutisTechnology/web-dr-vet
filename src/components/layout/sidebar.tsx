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
  Pill,
  LogOut,
  UserCircle,
  Shield,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/session";
import { useLogoStore } from "@/stores/logo";
import { canAccessRoute } from "@/lib/permissions";
import type { UserRole } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  vet: "Veterinário",
  attendant: "Atendente",
  financial: "Financeiro",
};

const navGroups = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/agenda", label: "Agenda", icon: Calendar },
      { href: "/clientes", label: "Clientes & Pets", icon: Users },
      { href: "/bulario", label: "Bulário Digital", icon: Pill },
    ],
  },
  {
    label: "CLÍNICA",
    items: [
      { href: "/internacao", label: "Internação", icon: BedDouble },
      { href: "/pdv", label: "PDV / Vendas", icon: ShoppingCart },
      { href: "/estoque", label: "Estoque", icon: Package },
    ],
  },
  {
    label: "GESTÃO",
    items: [
      { href: "/financeiro", label: "Financeiro", icon: DollarSign },
      { href: "/usuarios", label: "Usuários", icon: UserCog },
      { href: "/admin", label: "Admin SaaS", icon: Shield },
      { href: "/assinatura", label: "Assinatura", icon: CreditCard },
    ],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function UserAvatar({ name, avatar, size = 36 }: { name: string; avatar?: string; size?: number }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (avatar) {
    return (
      <Image
        src={avatar}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 text-white font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 70%, var(--accent)))",
      }}
    >
      {initials}
    </div>
  );
}

function LogoSection({
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
  const isHydrated = useHydrated();

  const userId = user?.id ?? "";
  const userLogoUrl = isHydrated && userId ? getLogo(userId) : null;
  const showCustomLogo = !!userLogoUrl && !logoError;

  if (!isMobile && collapsed) {
    return (
      <div className="flex justify-center py-4">
        <div className="w-9 h-9 rounded-xl overflow-hidden relative shrink-0 border border-gray-200">
          {!isHydrated && <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-xl" />}
          {isHydrated && showCustomLogo ? (
            <>
              {!logoLoaded && <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-xl" />}
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
            <Image src="/images/logo.jpeg" alt="DrVet" width={36} height={36} className="object-cover" />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl overflow-hidden relative shrink-0 border border-gray-200">
          {!isHydrated && <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-xl" />}
          {isHydrated && showCustomLogo ? (
            <>
              {!logoLoaded && <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-xl" />}
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
            <Image src="/images/logo.jpeg" alt="DrVet" width={36} height={36} className="object-cover" />
          ) : null}
        </div>
        {!isHydrated ? (
          <div className="h-3 bg-gray-100 rounded animate-pulse w-16" />
        ) : (
          <span className="font-bold text-sm text-gray-900 truncate tracking-wide">
            {user?.clinicName ?? "DrVet"}
          </span>
        )}
      </div>
      {isMobile && onMobileClose && (
        <button
          onClick={onMobileClose}
          className="text-gray-400 hover:text-gray-600 transition-colors ml-2 shrink-0"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

function UserProfileCard({ collapsed }: { collapsed: boolean }) {
  const { user, logout } = useSessionStore();
  const isHydrated = useHydrated();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (!isHydrated || !user) return null;

  const trigger = collapsed ? (
    <div className="flex justify-center px-2 mb-3 cursor-pointer">
      <UserAvatar name={user.name} avatar={user.avatar} size={32} />
    </div>
  ) : (
    <div className="mx-3 mb-3">
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/80 cursor-pointer hover:bg-gray-100/80 transition-colors group">
        <UserAvatar name={user.name} avatar={user.avatar} size={34} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-gray-800 truncate leading-tight">{user.name}</p>
          <p className="text-[11px] text-gray-500 truncate leading-tight mt-0.5">
            {roleLabels[user.role] ?? user.role}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 group-hover:text-gray-600 transition-colors" />
      </div>
    </div>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-48">
        <DropdownMenuItem onClick={() => router.push("/perfil")}>
          <UserCircle className="w-4 h-4 mr-2 text-gray-500" />
          Meu perfil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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

  return (
    <aside
      className={cn(
        "relative flex flex-col transition-all duration-300 shrink-0 h-full bg-white",
        isMobile ? "w-64" : collapsed ? "w-16" : "w-60",
      )}
      style={{ borderRight: "1px solid #e5e7eb" }}
    >
      {/* Logo */}
      <LogoSection collapsed={collapsed} isMobile={isMobile} onMobileClose={onMobileClose} />

      {/* Divider */}
      <div className="mx-3 mb-3 h-px bg-gray-100" />

      {/* User profile */}
      <UserProfileCard collapsed={collapsed} />

      {/* Nav */}
      <nav className="flex-1 px-2 overflow-y-auto">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => canAccessRoute(user, item.href));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label ?? "main"} className="mb-1">
              {group.label && !collapsed && (
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-gray-400 tracking-widest uppercase">
                  {group.label}
                </p>
              )}
              {group.label && collapsed && <div className="mt-3 mx-3 h-px bg-gray-100" />}
              <div className="space-y-0.5">
                {visibleItems.map(({ href, label, icon: Icon }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={isMobile ? onMobileClose : undefined}
                      title={!isMobile && collapsed ? label : undefined}
                      className={cn(
                        "group flex items-center gap-3 py-2 rounded-lg text-sm transition-all duration-150",
                        !isMobile && collapsed ? "justify-center px-0 mx-1" : "px-3",
                        active
                          ? "font-medium"
                          : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/80",
                      )}
                      style={
                        active
                          ? {
                              color: "var(--primary)",
                              background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                            }
                          : undefined
                      }
                    >
                      <Icon
                        className={cn("shrink-0 transition-colors", collapsed && !isMobile ? "w-5 h-5" : "w-[17px] h-[17px]")}
                        style={active ? { color: "var(--primary)" } : undefined}
                      />
                      {(isMobile || !collapsed) && (
                        <span className="text-[13px] tracking-wide truncate">{label}</span>
                      )}
                      {active && !isMobile && collapsed && (
                        <span
                          className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full"
                          style={{ background: "var(--primary)" }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {(isMobile || !collapsed) && (
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-300 text-center tracking-[0.2em] uppercase">v1.0</p>
        </div>
      )}

      {/* Collapse toggle — desktop only */}
      {!isMobile && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[22px] z-20 flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all duration-200 shadow-sm"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      )}
    </aside>
  );
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
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
