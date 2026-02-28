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
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/clientes", label: "Clientes & Pets", icon: Users },
  { href: "/internacao", label: "Internação", icon: BedDouble },
  { href: "/pdv", label: "PDV / Vendas", icon: ShoppingCart },
  { href: "/estoque", label: "Estoque", icon: Package },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/usuarios", label: "Usuários", icon: UserCog },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-primary text-primary-foreground transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-4 border-b border-white/10",
          collapsed ? "justify-center px-2" : "",
        )}
      >
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 overflow-hidden">
            <Image
              src="/images/logo.jpeg"
              alt="DrVet"
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              <Image
                src="/images/logo.jpeg"
                alt="DrVet"
                width={36}
                height={36}
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">DrVet</p>
              <p className="text-xs text-white/60 leading-tight">
                SaaS for Vets
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-white/20 text-white font-medium"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
                collapsed && "justify-center px-0 mx-1",
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 flex items-center justify-center w-6 h-6 bg-primary border border-white/20 rounded-full text-white/80 hover:text-white transition-colors"
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </aside>
  );
}
