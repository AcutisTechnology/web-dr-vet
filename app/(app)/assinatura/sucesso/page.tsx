"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function SubscriptionSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/assinatura");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[80vh] font-sans">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-success/12 p-3">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
          </div>
          <CardTitle className="text-2xl [font-family:var(--font-heading)]">Pagamento Confirmado!</CardTitle>
          <CardDescription>
            Sua assinatura foi ativada com sucesso
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Obrigado por assinar o DrVet. Você já pode aproveitar todos os recursos da plataforma.
          </p>
          <Button onClick={() => router.push("/dashboard")} className="w-full">
            Ir para o Dashboard
          </Button>
          <p className="text-xs text-muted-foreground">
            Você será redirecionado automaticamente em alguns segundos...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
