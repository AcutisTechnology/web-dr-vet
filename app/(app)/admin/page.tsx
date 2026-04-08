"use client";

import { useState } from "react";
import { formatDistanceToNowStrict, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Shield,
  Search,
  Activity,
  Users,
  PawPrint,
  CreditCard,
  TriangleAlert,
  Sparkles,
  RefreshCw,
  Building2,
} from "lucide-react";
import { useAdminOverview } from "@/hooks/use-admin-overview";
import type { AdminClinicAccount } from "@/types/admin";
import type { SubscriptionPlan, SubscriptionStatus } from "@/types/subscription";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn, formatCurrency } from "@/lib/utils";

const statusLabels: Record<SubscriptionStatus, string> = {
  trial: "Trial",
  active: "Ativa",
  past_due: "Em atraso",
  canceled: "Cancelada",
  expired: "Expirada",
};

const statusColors: Record<SubscriptionStatus, string> = {
  trial: "bg-info/12 text-info border-transparent",
  active: "bg-success/12 text-success border-transparent",
  past_due: "bg-warning/12 text-[color:var(--warning)] border-transparent",
  canceled: "bg-muted text-muted-foreground border-transparent",
  expired: "bg-destructive/12 text-destructive border-transparent",
};

const planLabels: Record<SubscriptionPlan, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  annual: "Anual",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
}

function formatRelativeDate(value: string | null) {
  if (!value) return "Sem atividade";
  return formatDistanceToNowStrict(new Date(value), {
    addSuffix: true,
    locale: ptBR,
  });
}

function getRenewalLabel(account: AdminClinicAccount) {
  if (account.subscriptionStatus === "trial") {
    return account.trialEndsAt ? `Trial ate ${formatDate(account.trialEndsAt)}` : "Trial sem data";
  }

  if (account.currentPeriodEnd) {
    return `Vence em ${formatDate(account.currentPeriodEnd)}`;
  }

  return "Sem ciclo definido";
}

function getUsageNote(account: AdminClinicAccount) {
  if (account.clientsCount === 0 && account.petsCount === 0) {
    return "Conta criada sem onboarding concluido";
  }

  if (!account.lastActivityAt) {
    return "Sem atividade registrada";
  }

  if (account.clientsCount >= 250 || account.petsCount >= 400) {
    return "Alto volume de uso";
  }

  if (account.subscriptionStatus === "past_due" || account.subscriptionStatus === "expired") {
    return "Requer acao de cobranca";
  }

  return "Uso dentro do esperado";
}

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
          </div>
          <div className={cn("rounded-2xl p-3 text-white", tone)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { data, isLoading, isError, refetch, isFetching } = useAdminOverview();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "all">("all");
  const [planFilter, setPlanFilter] = useState<SubscriptionPlan | "all">("all");

  const accounts = data?.accounts ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredAccounts = accounts.filter((account) => {
    const matchesStatus = statusFilter === "all" || account.subscriptionStatus === statusFilter;
    const matchesPlan = planFilter === "all" || account.plan === planFilter;
    const matchesSearch =
      normalizedSearch.length === 0 ||
      account.clinicName.toLowerCase().includes(normalizedSearch) ||
      account.ownerName.toLowerCase().includes(normalizedSearch) ||
      account.ownerEmail.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesPlan && matchesSearch;
  });

  const attentionAccounts = filteredAccounts.filter(
    (account) =>
      account.subscriptionStatus === "past_due" ||
      account.subscriptionStatus === "expired" ||
      account.subscriptionStatus === "trial",
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl">
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Erro ao carregar o painel admin</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>Nao foi possivel carregar os dados mockados da visao administrativa.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Shield className="h-3.5 w-3.5" />
            Administracao SaaS
          </div>
          <div>
            <h1 className="text-2xl font-bold [font-family:var(--font-heading)]">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe a saude da base, assinaturas e nivel de uso das contas da plataforma.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start">
          <Badge variant="outline" className="h-9 rounded-full px-3 text-xs">
            MRR mockado {formatCurrency(data.insights.monthlyRecurringRevenue)}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Contas"
          value={data.totals.totalAccounts}
          sub="Base total monitorada"
          icon={Building2}
          tone="bg-primary"
        />
        <KpiCard
          title="Assinaturas ativas"
          value={data.totals.activeSubscriptions}
          sub="Contas com acesso regular"
          icon={CreditCard}
          tone="bg-success"
        />
        <KpiCard
          title="Trials"
          value={data.totals.trialSubscriptions}
          sub={`${data.insights.expiringTrials} vencendo em breve`}
          icon={Sparkles}
          tone="bg-info"
        />
        <KpiCard
          title="Requer atencao"
          value={data.totals.attentionSubscriptions}
          sub="Em trial, atraso ou expiradas"
          icon={TriangleAlert}
          tone="bg-warning"
        />
        <KpiCard
          title="Clientes totais"
          value={data.totals.totalClients}
          sub="Cadastros consolidados"
          icon={Users}
          tone="bg-accent"
        />
        <KpiCard
          title="Pets totais"
          value={data.totals.totalPets}
          sub={`${data.insights.highUsageAccounts} contas com alto uso`}
          icon={PawPrint}
          tone="bg-secondary-foreground"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base">Contas monitoradas</CardTitle>
              <CardDescription>
                Filtre por status, plano e busque por clinica, responsavel ou email.
              </CardDescription>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_180px_180px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar clinica, responsavel ou email"
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SubscriptionStatus | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="past_due">Em atraso</SelectItem>
                  <SelectItem value="expired">Expirada</SelectItem>
                  <SelectItem value="canceled">Cancelada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={planFilter} onValueChange={(value) => setPlanFilter(value as SubscriptionPlan | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conta</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Usuarios</TableHead>
                    <TableHead className="text-right">Clientes</TableHead>
                    <TableHead className="text-right">Pets</TableHead>
                    <TableHead>Ultima atividade</TableHead>
                    <TableHead>Renovacao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-28 text-center text-sm text-muted-foreground">
                        Nenhuma conta encontrada com os filtros atuais.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="min-w-[240px]">
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">{account.clinicName}</div>
                            <div className="text-xs text-muted-foreground">{account.ownerName}</div>
                            <div className="text-xs text-muted-foreground">{account.ownerEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>{planLabels[account.plan]}</div>
                            <div className="text-xs text-muted-foreground">{formatCurrency(account.monthlyRevenue)}/mes</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[account.subscriptionStatus]}>
                            {statusLabels[account.subscriptionStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{account.usersCount}</TableCell>
                        <TableCell className="text-right font-medium">{account.clientsCount}</TableCell>
                        <TableCell className="text-right font-medium">{account.petsCount}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{formatRelativeDate(account.lastActivityAt)}</div>
                            <div className="text-xs text-muted-foreground">{getUsageNote(account)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{getRenewalLabel(account)}</div>
                            <div className="text-xs text-muted-foreground">{account.ownerPhone}</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Insights rapidos</CardTitle>
              <CardDescription>Leituras para priorizar suporte, cobranca e onboarding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <div className="text-muted-foreground">Trials vencendo</div>
                <div className="mt-1 text-2xl font-bold">{data.insights.expiringTrials}</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <div className="text-muted-foreground">Contas sem uso recente</div>
                <div className="mt-1 text-2xl font-bold">{data.insights.inactiveAccounts}</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <div className="text-muted-foreground">Alto volume de uso</div>
                <div className="mt-1 text-2xl font-bold">{data.insights.highUsageAccounts}</div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Activity className="h-4 w-4" />
            <AlertTitle>Fila de atencao</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{attentionAccounts.length} contas filtradas exigem acompanhamento comercial ou de suporte.</p>
              <div className="space-y-2">
                {attentionAccounts.slice(0, 4).map((account) => (
                  <div key={account.id} className="rounded-lg border border-border/60 bg-background px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">{account.clinicName}</span>
                      <Badge variant="outline" className={statusColors[account.subscriptionStatus]}>
                        {statusLabels[account.subscriptionStatus]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{getUsageNote(account)}</p>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
