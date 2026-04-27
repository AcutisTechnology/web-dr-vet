"use client";

import { useQuery } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscription.service";
import { AlertTriangle, CreditCard, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export function SubscriptionExpiredBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: subscriptionService.getSubscription,
    // staleTime 0 — always refetch on mount so the banner reflects the latest
    // subscription state (important after admin blocks/unblocks the account).
    staleTime: 0,
    retry: 1,
  });

  // Hide on the subscription page itself — user already sees the details there
  if (pathname?.startsWith("/assinatura")) return null;
  if (dismissed) return null;
  if (!subscription) return null;

  // is_active already encodes trial+active logic from the backend.
  // We show the banner for every non-active state except a healthy ongoing trial.
  if (subscription.is_active) return null;

  const status = subscription.status;

  // A trial that is still in the future counts as active on the backend,
  // so reaching here with status='trial' means the trial genuinely expired.
  const isExpired =
    status === "expired" ||
    status === "past_due" ||
    (status === "trial" && subscription.has_expired_trial);
  const isCanceled = status === "canceled";

  if (!isExpired && !isCanceled) return null;

  const message =
    status === "expired"
      ? "Acesso bloqueado. Renove sua assinatura para continuar usando o DrVet."
      : status === "past_due"
      ? "Pagamento em atraso. Regularize sua assinatura para evitar perda de acesso."
      : isCanceled
      ? "Sua assinatura foi cancelada. Reative para continuar usando o DrVet."
      : "Seu período de teste expirou. Adicione um pagamento para continuar.";

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-destructive text-white text-sm font-medium shrink-0 z-50">
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span className="truncate">{message}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => router.push("/assinatura")}
          className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 rounded-md px-2.5 py-1 transition-colors whitespace-nowrap"
        >
          <CreditCard className="w-3.5 h-3.5" />
          Gerenciar assinatura
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/70 hover:text-white transition-colors"
          aria-label="Fechar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
