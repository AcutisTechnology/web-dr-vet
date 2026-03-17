"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { clientService } from "@/services/client.service";
import { petService } from "@/services/pet.service";

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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(s: string) {
  return UUID_RE.test(s);
}

function useResolvedLabel(segments: string[], index: number): string {
  const seg = segments[index];
  const prev = segments[index - 1];
  const prev2 = segments[index - 2];

  const isClientId = isUuid(seg) && prev === "clientes";
  // path: /clientes/[clientId]/pets/[petId]  → prev="pets", prev2=clientUUID
  const isPetId = isUuid(seg) && prev === "pets" && isUuid(prev2);

  const { data: client } = useQuery({
    queryKey: ["clients", seg],
    queryFn: () => clientService.get(seg),
    enabled: isClientId,
    staleTime: 60_000,
  });

  const { data: pet } = useQuery({
    queryKey: ["pets", seg],
    queryFn: () => petService.get(seg),
    enabled: isPetId,
    staleTime: 60_000,
  });

  if (isPetId) return pet?.name ?? "Pet";
  if (isClientId) return client?.name ?? "Cliente";
  return routeLabels[seg] ?? seg;
}

function BreadcrumbSegment({
  segments,
  index,
}: {
  segments: string[];
  index: number;
}) {
  const label = useResolvedLabel(segments, index);
  const href = "/" + segments.slice(0, index + 1).join("/");
  const isLast = index === segments.length - 1;

  return (
    <span className="flex items-center gap-1">
      <ChevronRight className="w-3 h-3" />
      {isLast ? (
        <span className="text-foreground font-medium">{label}</span>
      ) : (
        <Link href={href} className="hover:text-foreground transition-colors">
          {label}
        </Link>
      )}
    </span>
  );
}

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
      {segments.map((_, i) => (
        <BreadcrumbSegment key={i} segments={segments} index={i} />
      ))}
    </nav>
  );
}
