"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  FileSearch,
  Mail,
  PawPrint,
  Phone,
  TriangleAlert,
  Users,
  ShieldCheck,
  ShieldOff,
  RefreshCw,
  Loader2,
  CalendarClock,
  AlertTriangle,
} from "lucide-react";
import { useAdminAccountDetail, adminKeys } from "@/hooks/use-admin-overview";
import { adminService } from "@/services/admin.service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { SubscriptionStatus } from "@/types/subscription";
import type { AdminSubscriptionAction } from "@/types/admin";

// ── Label / colour maps ───────────────────────────────────────────────────────
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

// ── Date helpers ──────────────────────────────────────────────────────────────
function formatDate(value: string | null) {
  if (!value) return "—";
  return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
}

function formatRelativeDate(value: string | null) {
  if (!value) return "Sem atividade";
  return formatDistanceToNowStrict(new Date(value), { addSuffix: true, locale: ptBR });
}

// ── Duration options ──────────────────────────────────────────────────────────
const ACTIVATE_OPTIONS = [
  { label: "30 dias (1 mês)", months: 1 },
  { label: "90 dias (3 meses)", months: 3 },
  { label: "180 dias (6 meses)", months: 6 },
  { label: "365 dias (1 ano)", months: 12 },
];

const TRIAL_OPTIONS = [
  { label: "+ 7 dias", days: 7 },
  { label: "+ 14 dias", days: 14 },
  { label: "+ 30 dias", days: 30 },
];

// ── Dialog state type ─────────────────────────────────────────────────────────
type DialogType = "activate" | "extend_trial" | "deactivate" | null;

// ── Subscription management card ──────────────────────────────────────────────
function SubscriptionManagementCard({
  accountId,
  account,
  onSuccess,
}: {
  accountId: string;
  account: ReturnType<typeof useAdminAccountDetail>["data"] extends infer T
    ? T extends { account: infer A }
      ? A
      : never
    : never;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [dialog, setDialog] = useState<DialogType>(null);
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [selectedDays, setSelectedDays] = useState(7);

  const mutation = useMutation({
    mutationFn: (payload: { action: AdminSubscriptionAction; months?: number; days?: number }) =>
      adminService.toggleSubscription(accountId, payload),
    onSuccess: (data) => {
      toast({ title: "Assinatura atualizada", description: data.message });
      setDialog(null);
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar assinatura", variant: "destructive" });
    },
  });

  const sub = account.subscription;
  const status = account.subscriptionStatus;
  const isActive = status === "active";
  const isTrial = status === "trial";
  const isBlocked = status === "expired" || status === "canceled" || status === "past_due";

  function handleConfirm() {
    if (dialog === "activate") {
      mutation.mutate({ action: "activate", months: selectedMonths });
    } else if (dialog === "extend_trial") {
      mutation.mutate({ action: "extend_trial", days: selectedDays });
    } else if (dialog === "deactivate") {
      mutation.mutate({ action: "deactivate" });
    }
  }

  return (
    <>
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Gerenciar Assinatura
              </CardTitle>
              <CardDescription>Ative, bloqueie ou estenda o acesso desta conta.</CardDescription>
            </div>
            <Badge variant="outline" className={statusColors[status]}>
              {statusLabels[status]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Subscription dates */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground mb-1">Trial até</div>
              <div className="font-medium">{formatDate(sub?.trialEndsAt ?? account.trialEndsAt)}</div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground mb-1">Período atual até</div>
              <div className="font-medium">{formatDate(sub?.currentPeriodEnd ?? account.currentPeriodEnd)}</div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground mb-1">Cancelada em</div>
              <div className="font-medium">{formatDate(sub?.canceledAt ?? null)}</div>
            </div>
          </div>

          <Separator />

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-success hover:bg-success/90 text-white"
              onClick={() => { setSelectedMonths(1); setDialog("activate"); }}
            >
              <ShieldCheck className="h-4 w-4 mr-1.5" />
              Ativar assinatura
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="border-info/40 text-info hover:bg-info/10"
              onClick={() => { setSelectedDays(7); setDialog("extend_trial"); }}
            >
              <CalendarClock className="h-4 w-4 mr-1.5" />
              Estender trial
            </Button>

            {(isActive || isTrial) && (
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/10 ml-auto"
                onClick={() => setDialog("deactivate")}
              >
                <ShieldOff className="h-4 w-4 mr-1.5" />
                Bloquear acesso
              </Button>
            )}
          </div>

          {isBlocked && (
            <p className="text-xs text-destructive bg-destructive/8 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Acesso bloqueado — o usuário vê erro 403 em todas as rotas protegidas.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Activate Dialog ── */}
      <Dialog open={dialog === "activate"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ativar Assinatura</DialogTitle>
            <DialogDescription>
              Selecione a duração da ativação. O período começa a contar a partir de agora.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 py-2">
            {ACTIVATE_OPTIONS.map((opt) => (
              <button
                key={opt.months}
                onClick={() => setSelectedMonths(opt.months)}
                className={`rounded-xl border p-3 text-sm font-medium text-left transition-colors ${
                  selectedMonths === opt.months
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button
              className="bg-success hover:bg-success/90 text-white"
              onClick={handleConfirm}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              Confirmar ativação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Extend Trial Dialog ── */}
      <Dialog open={dialog === "extend_trial"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Estender Trial</DialogTitle>
            <DialogDescription>
              Adiciona dias ao trial. Se o trial já expirou, o novo prazo começa hoje.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-2 py-2">
            {TRIAL_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setSelectedDays(opt.days)}
                className={`rounded-xl border p-3 text-sm font-medium text-center transition-colors ${
                  selectedDays === opt.days
                    ? "border-info bg-info/10 text-info"
                    : "border-border hover:border-info/40 hover:bg-muted/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button
              className="bg-info hover:bg-info/90 text-white"
              onClick={handleConfirm}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarClock className="h-4 w-4 mr-2" />}
              Confirmar extensão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Deactivate Dialog ── */}
      <Dialog open={dialog === "deactivate"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bloquear Acesso</DialogTitle>
            <DialogDescription>
              Esta ação marca a assinatura como expirada imediatamente. O usuário perderá o acesso a
              todas as funcionalidades da plataforma.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive" className="text-sm">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              A conta <strong>{account.clinicName}</strong> ficará bloqueada até que a assinatura
              seja reativada manualmente ou pelo próprio usuário.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldOff className="h-4 w-4 mr-2" />}
              Bloquear acesso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminAccountDetailPage() {
  const params = useParams<{ accountId: string }>();
  const accountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useAdminAccountDetail(accountId);

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: adminKeys.accountDetail(accountId) });
    queryClient.invalidateQueries({ queryKey: adminKeys.overview() });
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Button asChild variant="ghost" size="sm" className="px-0">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para admin
          </Link>
        </Button>

        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Erro ao carregar conta</AlertTitle>
          <AlertDescription>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { account, clients, users, pets, summary } = data;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Button asChild variant="ghost" size="sm" className="w-fit px-0 text-muted-foreground hover:text-foreground">
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para admin
            </Link>
          </Button>

          <div>
            <h1 className="text-2xl font-bold [font-family:var(--font-heading)]">{account.clinicName}</h1>
            <p className="text-sm text-muted-foreground">
              Visualizacao da conta SaaS e da carteira de clientes vinculada a esta conta.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusColors[account.subscriptionStatus]}>
            {statusLabels[account.subscriptionStatus]}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Subscription management card */}
      <SubscriptionManagementCard
        accountId={accountId}
        account={account}
        onSuccess={invalidateAll}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-primary p-3 text-white"><Building2 className="h-5 w-5" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Clientes</div>
              <div className="text-2xl font-bold">{account.clientsCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-accent p-3 text-white"><PawPrint className="h-5 w-5" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Pets</div>
              <div className="text-2xl font-bold">{account.petsCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-success p-3 text-white"><CreditCard className="h-5 w-5" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Plano</div>
              <div className="text-2xl font-bold">{formatCurrency(account.monthlyRevenue)}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-secondary-foreground p-3 text-white"><Users className="h-5 w-5" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Usuarios ativos</div>
              <div className="text-2xl font-bold">{summary.activeUsersCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-info p-3 text-white"><FileSearch className="h-5 w-5" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Pets usando exames</div>
              <div className="text-2xl font-bold">{summary.petsWithExamUsageCount}</div>
              <div className="text-xs text-muted-foreground">{summary.totalExamEventsCount} eventos de exame</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Responsavel</CardTitle>
            <CardDescription>Dados da conta principal exibida no painel admin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="font-medium text-foreground">{account.ownerName}</div>
              <div className="mt-1 flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" />{account.ownerEmail}</div>
              <div className="mt-1 flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />{account.ownerPhone || "Sem telefone"}</div>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="text-muted-foreground">Criada em</div>
              <div className="mt-1 font-medium">{formatDate(account.createdAt)}</div>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="text-muted-foreground">Renovacao</div>
              <div className="mt-1 font-medium">{formatDate(account.currentPeriodEnd ?? account.trialEndsAt)}</div>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="text-muted-foreground">Ultima atividade</div>
              <div className="mt-1 font-medium">{formatRelativeDate(account.lastActivityAt)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usuarios associados</CardTitle>
            <CardDescription>
              {account.accountType === "clinic_owner"
                ? "Equipe vinculada a esta clínica."
                : "Conta individual sem equipe de clínica."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ultima atualizacao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-foreground">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div>{user.role}</div>
                          <div className="text-xs text-muted-foreground">{user.phone || "Sem telefone"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge variant="outline" className={user.active ? "bg-success/12 text-success border-transparent" : "bg-muted text-muted-foreground border-transparent"}>
                            {user.active ? "Ativo" : "Inativo"}
                          </Badge>
                          {user.isPlatformAdmin && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-transparent">
                              Platform admin
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatRelativeDate(user.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pets da conta</CardTitle>
            <CardDescription>Visibilidade de uso da aba de exames por pet.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pet</TableHead>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Exames</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ultimo exame</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                        Nenhum pet encontrado para esta conta.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pets.map((pet) => (
                      <TableRow key={pet.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">{pet.name}</div>
                            <div className="text-xs text-muted-foreground">{pet.species} · {pet.breed}</div>
                          </div>
                        </TableCell>
                        <TableCell>{pet.clientName}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{pet.examEventsCount}</div>
                            <div className="text-xs text-muted-foreground">
                              {pet.hasExamUsage ? "Aba de exames utilizada" : "Sem uso da aba de exames"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={pet.status === "active" ? "bg-success/12 text-success border-transparent" : "bg-muted text-muted-foreground border-transparent"}>
                            {pet.status === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>{pet.lastExamAt ? formatRelativeDate(pet.lastExamAt) : "Nunca"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clientes desta conta</CardTitle>
            <CardDescription>Lista de clientes pertencentes a esta conta/clínica.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead className="text-right">Pets</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ultima atualizacao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                        Nenhum cliente encontrado para esta conta.
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">{client.name}</div>
                            <div className="text-xs text-muted-foreground">Desde {formatDate(client.createdAt)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div>{client.phone}</div>
                            <div className="text-xs text-muted-foreground">{client.email || "Sem email"}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{client.petsCount}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={client.active ? "bg-success/12 text-success border-transparent" : "bg-muted text-muted-foreground border-transparent"}>
                            {client.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatRelativeDate(client.updatedAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
