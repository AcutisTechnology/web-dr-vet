import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubscriptionBlockedPage() {
  return (
    <div className="max-w-2xl mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle>Acesso temporariamente bloqueado</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            A assinatura da sua clinica expirou e o acesso a plataforma foi bloqueado para toda a equipe.
          </p>
          <p>
            Solicite ao responsavel da clinica (conta administradora) que regularize a assinatura para liberar o uso novamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
