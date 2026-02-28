"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  agenda: "Agenda",
  clientes: "Clientes & Pets",
  internacao: "Internação",
  pdv: "PDV / Vendas",
  estoque: "Estoque",
  financeiro: "Financeiro",
  fiscal: "Fiscal / Notas",
  mensagens: "Mensagens",
  usuarios: "Usuários",
  novo: "Novo",
  new: "Novo",
  editar: "Editar",
  pets: "Pets",
  atendimento: "Atendimento",
  prontuario: "Prontuário",
  vendas: "Vendas",
  pacotes: "Pacotes",
  escala: "Escala",
  configuracoes: "Configurações",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-sm text-muted-foreground"
    >
      <Link
        href="/dashboard"
        className="hover:text-foreground transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      {segments.map((seg, i) => {
        const href = "/" + segments.slice(0, i + 1).join("/");
        const label = routeLabels[seg] ?? seg;
        const isLast = i === segments.length - 1;
        return (
          <span key={href} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            {isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link
                href={href}
                className="hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
