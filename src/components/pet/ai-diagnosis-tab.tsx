"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Brain,
  FlaskConical,
  Pill,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  BookmarkCheck,
  RefreshCw,
  Info,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { petService } from "@/services/pet.service";
import type { AiDiagnosisResult } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AiDiagnosisTabProps {
  petId: string;
  petName: string;
  hasAnamnesis: boolean;
}

const confidenceConfig = {
  alta: {
    label: "Alta",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  média: {
    label: "Média",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  baixa: {
    label: "Baixa",
    color: "bg-rose-100 text-rose-800 border-rose-200",
    dot: "bg-rose-400",
  },
};

const priorityConfig = {
  urgente: {
    label: "Urgente",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: "🔴",
  },
  recomendado: {
    label: "Recomendado",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: "🟡",
  },
  opcional: {
    label: "Opcional",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: "🟢",
  },
};

export function AiDiagnosisTab({
  petId,
  petName,
  hasAnamnesis,
}: AiDiagnosisTabProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [result, setResult] = useState<AiDiagnosisResult | null>(null);
  const [savedToRecord, setSavedToRecord] = useState(false);

  const generateMutation = useMutation({
    mutationFn: () => petService.aiDiagnosis(petId),
    onSuccess: (data) => {
      setResult(data);
      setSavedToRecord(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Não foi possível gerar o diagnóstico.";
      toast({ title: msg, variant: "destructive" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      petService.saveAiDiagnosis(petId, {
        summary: result!.summary,
        diagnoses: result!.diagnoses,
        exams: result!.exams,
        medications: result!.medications,
        observations: result!.observations,
        disclaimer: result!.disclaimer,
      }),
    onSuccess: () => {
      setSavedToRecord(true);
      qc.invalidateQueries({ queryKey: ["medical-events", petId] });
      toast({
        title: "Diagnóstico salvo no prontuário!",
        description: `O resultado foi registrado no histórico de ${petName}.`,
      });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Erro ao salvar no prontuário.";
      toast({ title: msg, variant: "destructive" });
    },
  });

  /* ── Anamnese não preenchida ─────────────────────────────────────── */
  if (!hasAnamnesis) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center gap-4 px-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-violet-50 flex items-center justify-center">
            <Brain className="w-7 h-7 sm:w-8 sm:h-8 text-violet-400" />
          </div>
          <div>
            <p className="font-semibold text-base">Anamnese não preenchida</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Preencha os campos de Queixa Atual e Histórico Médico para que a
              IA gere uma análise clínica.
            </p>
          </div>
          <Badge variant="outline" className="text-muted-foreground text-center">
            Acesse as abas de Queixa Atual e Histórico Médico
          </Badge>
        </CardContent>
      </Card>
    );
  }

  /* ── Pronto para gerar ───────────────────────────────────────────── */
  if (!result && !generateMutation.isPending) {
    return (
      <Card className="overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />
        <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center gap-5 px-4">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center shadow-sm">
              <Sparkles className="w-8 h-8 sm:w-9 sm:h-9 text-violet-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-[9px] text-white font-bold">AI</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="font-bold text-lg">Análise Clínica por IA</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              A IA irá analisar a anamnese de{" "}
              <span className="font-semibold text-foreground">{petName}</span> e
              sugerir diagnósticos, exames e possíveis tratamentos com base nos
              sinais clínicos informados.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "Diagnósticos prováveis",
              "Exames sugeridos",
              "Classes terapêuticas",
            ].map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted border text-xs text-muted-foreground"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                {f}
              </span>
            ))}
          </div>

          <Button
            size="lg"
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md gap-2 w-full sm:w-auto sm:px-8"
            onClick={() => generateMutation.mutate()}
          >
            <Sparkles className="w-4 h-4" />
            Gerar Análise com IA
          </Button>

          <p className="text-[11px] text-muted-foreground/60">
            Powered by Google Gemini 2.5 Flash
          </p>
        </CardContent>
      </Card>
    );
  }

  /* ── Carregando ──────────────────────────────────────────────────── */
  if (generateMutation.isPending) {
    return (
      <Card className="overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 animate-pulse" />
        <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 gap-5 px-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
            <Loader2 className="w-8 h-8 sm:w-9 sm:h-9 text-violet-600 animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold text-base">Analisando a anamnese...</p>
            <p className="text-sm text-muted-foreground">
              O Gemini está avaliando os sinais clínicos de{" "}
              <span className="font-medium">{petName}</span>
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {[
              "Lendo anamnese",
              "Avaliando sinais clínicos",
              "Gerando diagnósticos",
            ].map((step) => (
              <div
                key={step}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Loader2 className="w-3 h-3 animate-spin text-violet-500 shrink-0" />
                {step}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  /* ── Resultado ───────────────────────────────────────────────────── */
  return (
    <div className="space-y-4">

      {/* Header com ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Identidade */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm">Análise Clínica por IA</p>
            <p className="text-xs text-muted-foreground truncate">
              Gemini 2.5 Flash • {petName}
            </p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex flex-wrap items-center gap-2">
          {savedToRecord ? (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Salvo no prontuário
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="gap-1.5 border-violet-200 text-violet-700 hover:bg-violet-50 flex-1 sm:flex-none"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <BookmarkCheck className="w-3.5 h-3.5" />
              )}
              {saveMutation.isPending ? "Salvando..." : "Salvar no Prontuário"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setResult(null);
              setSavedToRecord(false);
              generateMutation.mutate();
            }}
            className="gap-1.5 text-muted-foreground flex-1 sm:flex-none"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Nova análise
          </Button>
        </div>
      </div>

      {/* Resumo clínico */}
      <Card className="border-violet-100 bg-gradient-to-br from-violet-50/50 to-purple-50/30">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
              <Brain className="w-4 h-4 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 mb-1">
                Resumo Clínico
              </p>
              <p className="text-sm leading-relaxed break-words">
                {result?.summary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diagnósticos */}
      {result?.diagnoses && result.diagnoses.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-500" />
              Diagnósticos Sugeridos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {result.diagnoses.map((d, i) => {
              const conf =
                confidenceConfig[
                  d.confidence as keyof typeof confidenceConfig
                ] ?? confidenceConfig["baixa"];
              return (
                <div
                  key={i}
                  className="flex gap-3 p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  {/* Número */}
                  <div className="shrink-0 pt-0.5">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                        i === 0
                          ? "bg-indigo-600"
                          : i === 1
                            ? "bg-indigo-400"
                            : "bg-slate-400",
                      )}
                    >
                      {i + 1}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Nome + badge de confiança */}
                    <div className="flex flex-wrap items-start gap-1.5">
                      <p className="font-semibold text-sm break-words flex-1 min-w-0">
                        {d.name}
                      </p>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0",
                          conf.color,
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            conf.dot,
                          )}
                        />
                        Confiança {conf.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed break-words">
                      {d.justification}
                    </p>
                    {d.icd_vet && (
                      <p className="text-[11px] text-muted-foreground/60">
                        CID-Vet: {d.icd_vet}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Exames + Medicamentos — coluna única no mobile, lado a lado no md */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Exames */}
        {result?.exams && result.exams.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-cyan-500" />
                Exames Sugeridos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {result.exams.map((e, i) => {
                const p =
                  priorityConfig[
                    e.priority as keyof typeof priorityConfig
                  ] ?? priorityConfig["opcional"];
                return (
                  <div key={i} className="flex gap-2.5 items-start">
                    <ChevronRight className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-medium break-words">
                          {e.name}
                        </p>
                        <span
                          className={cn(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded-full border shrink-0",
                            p.color,
                          )}
                        >
                          {p.icon} {p.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed break-words">
                        {e.reason}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Medicamentos */}
        {result?.medications && result.medications.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-500" />
                Classes Terapêuticas Sugeridas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {result.medications.map((m, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border bg-emerald-50/40 space-y-1.5"
                >
                  {/* Classe + exemplo */}
                  <div className="flex flex-wrap items-start gap-1.5">
                    <p className="text-sm font-semibold text-emerald-800 break-words flex-1 min-w-0">
                      {m.class}
                    </p>
                    <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0 break-all">
                      ex: {m.example}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed break-words">
                    {m.indication}
                  </p>
                  {m.caution && (
                    <p className="text-[11px] text-amber-700 flex items-start gap-1 break-words">
                      <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                      {m.caution}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Observações */}
      {result?.observations && (
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Observações
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed break-words">
                  {result.observations}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <Alert className="border-amber-200 bg-amber-50/50">
        <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
        <AlertDescription className="text-xs text-amber-800 leading-relaxed break-words">
          <span className="font-semibold">Aviso importante: </span>
          {result?.disclaimer ??
            "Esta análise é gerada por inteligência artificial e tem caráter exclusivamente de apoio à decisão. O diagnóstico definitivo e a conduta terapêutica devem ser determinados pelo médico veterinário responsável após exame clínico presencial."}
        </AlertDescription>
      </Alert>
    </div>
  );
}
