"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscription.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Sparkles,
  ShieldCheck,
  Clock,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(date: string) {
  return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

function calcTrialProgress(trialEndsAt: string) {
  const end   = new Date(trialEndsAt);
  const now   = new Date();
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

  const totalMs   = end.getTime() - start.getTime();
  const elapsedMs = Math.max(0, now.getTime() - start.getTime());
  const remainMs  = Math.max(0, end.getTime() - now.getTime());

  const daysLeft    = Math.floor(remainMs / (1000 * 60 * 60 * 24));
  const hoursLeft   = Math.floor((remainMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const progressPct = Math.min(100, Math.round((elapsedMs / totalMs) * 100));
  const isExpired   = remainMs === 0;

  return { daysLeft, hoursLeft, progressPct, isExpired };
}

// ── Status config ─────────────────────────────────────────────────────────────
const statusLabels: Record<string, string> = {
  trial:    "Período de Teste",
  active:   "Ativa",
  past_due: "Pagamento Pendente",
  canceled: "Cancelada",
  expired:  "Expirada",
};

const statusColors: Record<string, string> = {
  trial:    "bg-info/12 text-info border-0",
  active:   "bg-success/12 text-success border-0",
  past_due: "bg-warning/12 text-[color:var(--warning)] border-0",
  canceled: "bg-muted text-muted-foreground border-0",
  expired:  "bg-destructive/12 text-destructive border-0",
};

// ── Trial progress card ───────────────────────────────────────────────────────
function TrialProgressCard({ trialEndsAt }: { trialEndsAt: string }) {
  const { daysLeft, hoursLeft, progressPct, isExpired } = calcTrialProgress(trialEndsAt);

  const barColor = isExpired
    ? "bg-destructive"
    : daysLeft <= 1
    ? "bg-warning"
    : daysLeft <= 3
    ? "bg-warning"
    : "bg-accent";

  const cardClass = isExpired
    ? "border-destructive/25 bg-destructive/8"
    : daysLeft <= 3
    ? "border-warning/25 bg-warning/8"
    : "border-info/25 bg-info/8";

  const countdownColor = isExpired
    ? "text-destructive"
    : daysLeft <= 1
    ? "text-[color:var(--warning)]"
    : daysLeft <= 3
    ? "text-[color:var(--warning)]"
    : "text-primary";

  return (
    <Card className={cardClass}>
      <CardContent className="pt-5 pb-5 space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {isExpired
              ? <XCircle className="w-5 h-5 text-destructive shrink-0" />
              : <Sparkles className="w-5 h-5 text-info shrink-0" />}
            <span className="font-semibold text-sm">
              {isExpired ? "Período de teste encerrado" : "Período de teste gratuito"}
            </span>
          </div>
          {!isExpired && (
            <span className={`text-2xl font-extrabold tabular-nums ${countdownColor}`}>
              {daysLeft > 0
                ? `${daysLeft}d ${hoursLeft}h restantes`
                : `${hoursLeft}h restantes`}
            </span>
          )}
        </div>

        {/* Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Início do teste (7 dias)</span>
            <span className={isExpired ? "text-destructive font-medium" : ""}>
              {isExpired ? "Expirou em " : "Expira em "}
              {formatDate(trialEndsAt)}
            </span>
          </div>
        </div>

        {/* Urgency notice */}
        {!isExpired && daysLeft <= 3 && (
          <p className="text-xs text-[color:var(--warning)] bg-warning/15 rounded-lg px-3 py-2">
            ⚠️{" "}
            {daysLeft === 0
              ? `Apenas ${hoursLeft} hora${hoursLeft !== 1 ? "s" : ""} restante${hoursLeft !== 1 ? "s" : ""}! Adicione um pagamento para não perder o acesso.`
              : `Apenas ${daysLeft} dia${daysLeft !== 1 ? "s" : ""} restante${daysLeft !== 1 ? "s" : ""}! Adicione um pagamento para manter o acesso.`}
          </p>
        )}

        {isExpired && (
          <p className="text-xs text-destructive bg-destructive/12 rounded-lg px-3 py-2">
            Seu período de teste encerrou. Adicione um pagamento para voltar a usar a plataforma.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ["subscription"],
    queryFn: subscriptionService.getSubscription,
    retry: 1,
    refetchInterval: 60_000,
  });

  const createPaymentMutation = useMutation({
    mutationFn: subscriptionService.createPayment,
    onSuccess: (data) => {
      window.open(data.payment_url, "_blank");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast({ title: "Pagamento iniciado", description: "Conclua o pagamento na página aberta. Seu acesso será liberado automaticamente." });
    },
    onError: () => {
      toast({ title: "Erro ao criar pagamento", description: "Tente novamente em instantes.", variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: subscriptionService.cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast({ title: "Assinatura cancelada." });
    },
    onError: () => {
      toast({ title: "Não foi possível cancelar.", variant: "destructive" });
    },
  });

  const checkPaymentMutation = useMutation({
    mutationFn: subscriptionService.checkPaymentStatus,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      if (data.subscription?.status === "active") {
        toast({ title: "Pagamento confirmado!", description: "Sua assinatura foi ativada com sucesso." });
      } else {
        toast({
          title: "Pagamento ainda não confirmado",
          description: data.message || "Se você já pagou, aguarde alguns minutos e tente novamente. Em caso de dúvida, entre em contato com o suporte.",
        });
      }
    },
    onError: () => {
      toast({ title: "Não foi possível verificar o pagamento.", variant: "destructive" });
    },
  });

  // ── Loading / error ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !subscription) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar assinatura</AlertTitle>
          <AlertDescription>
            Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Configurando sua conta…</AlertTitle>
          <AlertDescription>Recarregue a página em alguns segundos.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // ── Derived state ────────────────────────────────────────────────────────
  const isTrialExpired = subscription.has_expired_trial && !subscription.is_active;
  const isOnTrial      = subscription.is_on_trial;
  // Show payment button for every non-active state except voluntarily canceled.
  // This covers: ongoing trial, expired trial, expired (admin block), past_due.
  // Show payment button for all non-active states, including canceled (re-subscribe flow).
  // The webhook handles activation for any status, so allowing payment here is safe.
  const needsPayment   = !subscription.is_active;
  const hasPending     = subscription.transactions?.some((t) => t.status === "pending");

  return (
    <div className="max-w-2xl mx-auto space-y-5 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary [font-family:var(--font-heading)]">Assinatura</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie seu plano e pagamentos</p>
      </div>

      {/* Trial progress — only for trial state, not expired/canceled/blocked */}
      {subscription.trial_ends_at &&
        subscription.status === "trial" && (
          <TrialProgressCard trialEndsAt={subscription.trial_ends_at} />
        )}

      {/* Active subscription banner */}
      {subscription.status === "active" && (
        <Alert className="border-success/30 bg-success/10">
          <ShieldCheck className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">Assinatura Ativa</AlertTitle>
          <AlertDescription className="text-success">
            Seu plano está ativo e todos os recursos estão disponíveis.
            {subscription.current_period_end && (
              <> Próxima cobrança em <strong>{formatDate(subscription.current_period_end)}</strong>.</>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Blocked by admin banner */}
      {subscription.status === "expired" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Bloqueado</AlertTitle>
          <AlertDescription>
            Seu acesso foi suspenso. Para restabelecer, reative sua assinatura abaixo ou entre em contato com o suporte.
          </AlertDescription>
        </Alert>
      )}

      {/* Past due banner */}
      {subscription.status === "past_due" && (
        <Alert className="border-warning/30 bg-warning/8">
          <AlertCircle className="h-4 w-4 text-[color:var(--warning)]" />
          <AlertTitle className="text-[color:var(--warning)]">Pagamento em Atraso</AlertTitle>
          <AlertDescription className="text-[color:var(--warning)]">
            Há um pagamento pendente. Regularize para manter o acesso à plataforma.
          </AlertDescription>
        </Alert>
      )}

      {/* Canceled banner */}
      {subscription.status === "canceled" && (
        <Alert className="border-gray-200 bg-gray-50">
          <AlertCircle className="h-4 w-4 text-gray-500" />
          <AlertTitle className="text-gray-700">Assinatura Cancelada</AlertTitle>
          <AlertDescription className="text-gray-600">
            Sua assinatura foi cancelada. Clique em &ldquo;Adicionar Pagamento&rdquo; abaixo para reativar o acesso.
          </AlertDescription>
        </Alert>
      )}

      {/* Plan card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Plano Atual</CardTitle>
              <CardDescription>Detalhes da sua assinatura</CardDescription>
            </div>
            <Badge className={statusColors[subscription.status] ?? "bg-gray-100 text-gray-700 border-0"}>
              {statusLabels[subscription.status] ?? subscription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Plano</p>
              <p className="font-semibold">Plano Mensal</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Valor</p>
              <p className="font-semibold">R$ 49,90/mês</p>
            </div>

            {subscription.trial_ends_at && (isOnTrial || isTrialExpired) && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  {isTrialExpired ? "Trial encerrou em" : "Trial termina em"}
                </p>
                <p className={`font-semibold ${isTrialExpired ? "text-destructive" : "text-info"}`}>
                  {formatDate(subscription.trial_ends_at)}
                </p>
              </div>
            )}

            {subscription.current_period_end && subscription.status === "active" && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Próxima cobrança</p>
                <p className="font-semibold">{formatDate(subscription.current_period_end)}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {needsPayment && (
              <Button
                onClick={() => createPaymentMutation.mutate()}
                disabled={createPaymentMutation.isPending}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {createPaymentMutation.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando...</>
                  : <><CreditCard className="w-4 h-4 mr-2" />Adicionar Pagamento</>}
              </Button>
            )}

            {hasPending && (
              <Button
                variant="outline"
                onClick={() => checkPaymentMutation.mutate()}
                disabled={checkPaymentMutation.isPending}
              >
                {checkPaymentMutation.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verificando...</>
                  : <><Clock className="w-4 h-4 mr-2" />Verificar Pagamento</>}
              </Button>
            )}

            {subscription.status === "active" && (
              <Button
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/5 ml-auto"
                disabled={cancelMutation.isPending}
                onClick={() => {
                  if (confirm("Tem certeza que deseja cancelar sua assinatura?")) {
                    cancelMutation.mutate();
                  }
                }}
              >
                {cancelMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : "Cancelar Assinatura"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Features included */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/10 border-accent/20">
        <CardContent className="pt-5">
          <p className="text-sm font-semibold text-primary mb-3">Tudo incluído no Plano Mensal</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              "Clientes e Pets ilimitados",
              "Agenda de consultas",
              "Prontuário eletrônico",
              "Diagnóstico por IA",
              "Financeiro completo",
              "PDV e Estoque",
              "Internação",
              "Usuários da equipe",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction history */}
      {subscription.transactions && subscription.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de Pagamentos</CardTitle>
            <CardDescription>Suas transações recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {subscription.transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 border rounded-xl">
                  <div className="flex items-center gap-3">
                    {t.status === "paid"
                      ? <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                      : t.status === "pending"
                      ? <Clock className="w-5 h-5 text-[color:var(--warning)] shrink-0" />
                      : <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                    <div>
                      <p className="text-sm font-medium">R$ {(t.amount / 100).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(t.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        {t.payment_method && ` · ${t.payment_method.toUpperCase()}`}
                        {" · "}
                        <span className={
                          t.status === "paid"    ? "text-success font-medium" :
                          t.status === "pending" ? "text-[color:var(--warning)] font-medium" :
                          "text-destructive font-medium"
                        }>
                          {t.status === "paid" ? "Pago" : t.status === "pending" ? "Pendente" : "Cancelado"}
                        </span>
                      </p>
                    </div>
                  </div>
                  {t.status === "pending" && t.payment_url && (
                    <Button variant="outline" size="sm" onClick={() => window.open(t.payment_url!, "_blank")}>
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Pagar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
