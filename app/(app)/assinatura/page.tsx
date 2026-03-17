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
  Calendar,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const planNames = {
  monthly: "Plano Mensal",
  quarterly: "Plano Mensal",
  annual: "Plano Mensal",
};

const planPrices = {
  monthly: "R$ 49,90",
  quarterly: "R$ 49,90",
  annual: "R$ 49,90",
};

const statusLabels = {
  trial: "Período de Teste",
  active: "Ativa",
  past_due: "Pagamento Pendente",
  canceled: "Cancelada",
  expired: "Expirada",
};

const statusColors = {
  trial: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  past_due: "bg-yellow-100 text-yellow-800",
  canceled: "bg-gray-100 text-gray-800",
  expired: "bg-red-100 text-red-800",
};

export default function SubscriptionPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: subscriptionService.getSubscription,
  });

  const createPaymentMutation = useMutation({
    mutationFn: subscriptionService.createPayment,
    onSuccess: (data) => {
      window.open(data.payment_url, "_blank");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast({
        title: "Pagamento iniciado",
        description: "Você será redirecionado para a página de pagamento.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: subscriptionService.cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a assinatura.",
        variant: "destructive",
      });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: subscriptionService.reactivateSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast({
        title: "Assinatura reativada",
        description:
          "Sua assinatura foi reativada com 7 dias de teste gratuito!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível reativar a assinatura.",
        variant: "destructive",
      });
    },
  });

  const checkPaymentMutation = useMutation({
    mutationFn: subscriptionService.checkPaymentStatus,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast({
        title: data.message || "Status verificado",
        description:
          data.subscription?.status === "active"
            ? "Sua assinatura foi ativada com sucesso!"
            : "Aguardando confirmação do pagamento.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível verificar o status do pagamento.",
        variant: "destructive",
      });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: subscriptionService.confirmPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast({
        title: "Pagamento confirmado!",
        description: "Sua assinatura foi ativada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível confirmar o pagamento.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nenhuma assinatura encontrada</AlertTitle>
          <AlertDescription>
            Você não possui uma assinatura ativa. Entre em contato com o
            suporte.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const daysRemaining = subscription.trial_ends_at
    ? Math.ceil(
        (new Date(subscription.trial_ends_at).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assinatura</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie sua assinatura e pagamentos
        </p>
      </div>

      {subscription.is_on_trial && (
        <Alert className="border-blue-200 bg-blue-50">
          <Calendar className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">
            Período de Teste Ativo
          </AlertTitle>
          <AlertDescription className="text-blue-800">
            Você tem {daysRemaining} {daysRemaining === 1 ? "dia" : "dias"}{" "}
            restantes no seu período de teste gratuito.
            {daysRemaining <= 3 &&
              " Não esqueça de adicionar um método de pagamento!"}
          </AlertDescription>
        </Alert>
      )}

      {subscription.has_expired_trial && !subscription.is_active && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Período de Teste Expirado</AlertTitle>
          <AlertDescription>
            Seu período de teste expirou. Adicione um método de pagamento para
            continuar usando a plataforma.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plano Atual</CardTitle>
              <CardDescription>Detalhes da sua assinatura</CardDescription>
            </div>
            <Badge className={statusColors[subscription.status]}>
              {statusLabels[subscription.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Plano</p>
              <p className="text-lg font-semibold">
                {planNames[subscription.plan]}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="text-lg font-semibold">R$ 49,90/mês</p>
            </div>
          </div>

          {subscription.trial_ends_at && subscription.is_on_trial && (
            <div>
              <p className="text-sm text-muted-foreground">Teste termina em</p>
              <p className="text-lg font-semibold">
                {format(
                  new Date(subscription.trial_ends_at),
                  "dd 'de' MMMM 'de' yyyy",
                  {
                    locale: ptBR,
                  },
                )}
              </p>
            </div>
          )}

          {subscription.current_period_end &&
            subscription.status === "active" && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Próxima cobrança
                </p>
                <p className="text-lg font-semibold">
                  {format(
                    new Date(subscription.current_period_end),
                    "dd 'de' MMMM 'de' yyyy",
                    {
                      locale: ptBR,
                    },
                  )}
                </p>
              </div>
            )}

          <Separator />

          <div className="flex gap-3">
            {(subscription.status === "canceled" ||
              subscription.status === "past_due" ||
              subscription.status === "expired") && (
              <Button
                onClick={() => reactivateMutation.mutate()}
                disabled={reactivateMutation.isPending}
                className="flex-1"
              >
                {reactivateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reativando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Reativar Assinatura
                  </>
                )}
              </Button>
            )}

            {(subscription.is_on_trial || subscription.has_expired_trial) &&
              subscription.status !== "canceled" && (
                <>
                  <Button
                    onClick={() => createPaymentMutation.mutate()}
                    disabled={createPaymentMutation.isPending}
                    className="flex-1"
                  >
                    {createPaymentMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Adicionar Pagamento
                      </>
                    )}
                  </Button>
                  {subscription.transactions.some(
                    (t) => t.status === "pending",
                  ) && (
                    <Button
                      variant="outline"
                      onClick={() => checkPaymentMutation.mutate()}
                      disabled={checkPaymentMutation.isPending}
                    >
                      {checkPaymentMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        "Verificar Pagamento"
                      )}
                    </Button>
                  )}
                </>
              )}

            {subscription.status === "active" && (
              <Button
                variant="outline"
                onClick={() => {
                  if (
                    confirm("Tem certeza que deseja cancelar sua assinatura?")
                  ) {
                    cancelMutation.mutate();
                  }
                }}
                disabled={cancelMutation.isPending}
              >
                Cancelar Assinatura
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {subscription.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Pagamentos</CardTitle>
            <CardDescription>Suas transações recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscription.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {transaction.status === "paid" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : transaction.status === "pending" ? (
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">
                        R$ {(transaction.amount / 100).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(
                          new Date(transaction.created_at),
                          "dd/MM/yyyy",
                          {
                            locale: ptBR,
                          },
                        )}
                        {transaction.payment_method &&
                          ` • ${transaction.payment_method.toUpperCase()}`}
                      </p>
                    </div>
                  </div>
                  {transaction.status === "pending" &&
                    transaction.payment_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(transaction.payment_url!, "_blank")
                        }
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
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
