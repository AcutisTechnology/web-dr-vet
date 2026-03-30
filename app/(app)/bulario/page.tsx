"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Beaker,
  Calculator,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Info,
  Loader2,
  PawPrint,
  Pill,
  Search,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Syringe,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  getBularioCatalog,
  getDoseSuggestion,
  listManufacturers,
  listSpecies,
  searchBularioMedications,
} from "@/lib/bulario";
import type { DoseSuggestion } from "@/types/bulario";
import { bularioService, type BularioAiPrescription } from "@/services/bulario.service";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { BularioMedication } from "@/types/bulario";

const catalog = getBularioCatalog();
const ITEMS_PER_PAGE = 20;

const bularioLabels: Record<string, string> = {
  receita: "Tipo de receita",
  composicao: "Composição",
  armazenamento: "Armazenamento",
  apresentacoes: "Apresentações",
  indicacoes: "Indicações",
  contraindicacoes: "Contraindicações",
  efeitosAdversos: "Efeitos adversos",
  modoUsar: "Modo de uso",
  observacoes: "Observações",
  frequenciaUtilizacao: "Frequência",
  duracaoTratamento: "Duração do tratamento",
  farmacodinamica: "Farmacodinâmica",
  farmacocinetica: "Farmacocinética",
};

function formatBularioValue(value: string | string[]) {
  if (Array.isArray(value)) return value.join(", ");
  return value;
}

function hasBulario(med: BularioMedication | null): boolean {
  if (!med?.bulario) return false;
  return Object.values(med.bulario).some((v) => Boolean(v));
}

/* ─── Detail content ───────────────────────────────────────────────── */

function DoseConcentrationBlock({ dose }: { dose: DoseSuggestion }) {
  const hasDose =
    dose.doseMinMgKg !== null || dose.doseMaxMgKg !== null;
  const hasConc = dose.concentrationMgMl !== null;

  if (!hasDose && !hasConc) return null;

  const doseLabel =
    dose.doseMinMgKg !== null
      ? dose.doseMaxMgKg !== null && dose.doseMaxMgKg !== dose.doseMinMgKg
        ? `${dose.doseMinMgKg} – ${dose.doseMaxMgKg}`
        : `${dose.doseMinMgKg}`
      : "—";

  return (
    <div
      className={cn(
        "grid gap-2",
        hasDose && hasConc ? "grid-cols-2" : "grid-cols-1",
      )}
    >
      {hasDose && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/70">
            Dose
          </p>
          <p className="mt-0.5 text-xl font-bold leading-none text-primary">
            {doseLabel}
            <span className="ml-1 text-sm font-medium text-primary/70">
              mg/kg
            </span>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Por administração
          </p>
        </div>
      )}
      {hasConc && (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50/50 p-3 dark:border-cyan-800/40 dark:bg-cyan-950/20">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Concentração
          </p>
          <p className="mt-0.5 text-xl font-bold leading-none text-cyan-700 dark:text-cyan-300">
            {dose.concentrationMgMl}
            <span className="ml-1 text-sm font-medium text-cyan-600/70 dark:text-cyan-400/70">
              mg/mL
            </span>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Da apresentação
          </p>
        </div>
      )}
    </div>
  );
}

function MedicationDetail({
  medication,
  aiPrescription,
  isLoadingAi,
  aiError,
}: {
  medication: BularioMedication;
  aiPrescription: BularioAiPrescription | null;
  isLoadingAi: boolean;
  aiError: string | null;
}) {
  const dose = useMemo(() => getDoseSuggestion(medication), [medication]);
  const bularioEntries = useMemo(() => {
    if (medication.bulario) {
      const entries = Object.entries(medication.bulario)
        .filter(([, v]) => Boolean(v))
        .slice(0, 13);
      if (entries.length) return { entries, source: "catalog" as const };
    }
    if (aiPrescription) {
      const entries = Object.entries(aiPrescription)
        .filter(([, v]) => Boolean(v)) as [string, string][];
      if (entries.length) return { entries, source: "ai" as const };
    }
    return null;
  }, [medication, aiPrescription]);

  return (
    <div className="space-y-3">
      {/* Nome + descrição */}
      <div className="space-y-1">
        <p className="text-lg font-semibold leading-snug text-foreground">
          {medication.nome}
        </p>
        <p className="text-sm text-muted-foreground">
          {medication.descricao || "Sem descrição disponível."}
        </p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {medication.empresa && (
          <Badge variant="secondary">{medication.empresa}</Badge>
        )}
        {medication.classificacao && (
          <Badge variant="info">{medication.classificacao}</Badge>
        )}
        {medication.especies && (
          <Badge variant="outline">{medication.especies}</Badge>
        )}
        <Badge
          variant={medication.animalType === "grandes" ? "warning" : "success"}
        >
          {medication.animalType === "grandes"
            ? "Grandes animais"
            : "Pequenos animais"}
        </Badge>
      </div>

      {/* Princípios ativos */}
      {medication.principiosAtivos?.length ? (
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Princípios ativos
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {medication.principiosAtivos.join(", ")}
          </p>
        </div>
      ) : null}

      {/* Dose e Concentração */}
      <DoseConcentrationBlock dose={dose} />

      {/* Estado de loading IA */}
      {isLoadingAi && (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Carregando informações...
          </p>
        </div>
      )}

      {/* Erro IA */}
      {aiError && !isLoadingAi && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
            <Info className="h-3.5 w-3.5" />
            {aiError}
          </p>
        </div>
      )}


      {/* Campos do bulário */}
      {bularioEntries && !isLoadingAi && (
        <div className="space-y-2">
          {bularioEntries.entries.map(([key, value]) => (
            <div
              key={key}
              className="rounded-lg border border-border bg-card p-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {bularioLabels[key] ?? key}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                {formatBularioValue(value as string | string[])}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Interações */}
      {medication.interacoes?.length ? (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-warning">
            <ShieldAlert className="h-3.5 w-3.5" /> Interações cadastradas
          </p>
          <ul className="space-y-1.5 text-sm text-foreground">
            {medication.interacoes.slice(0, 6).map((item) => (
              <li key={item.medicamento}>
                <strong>{item.medicamento}:</strong>{" "}
                {item.detalhes.join(" | ")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* CTA calculadora */}
      {(() => {
        const params = new URLSearchParams({ nome: medication.nome });
        if (dose.doseMinMgKg !== null)
          params.set("dose", String(dose.doseMinMgKg));
        if (dose.concentrationMgMl !== null)
          params.set("concentracao", String(dose.concentrationMgMl));

        return (
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-sm text-foreground">
              Para cálculo de dose, infusão, hidratação e CRI, use a
              calculadora completa.
            </p>
            <Button asChild className="mt-2 w-full sm:w-auto">
              <Link href={`/bulario/calculadora?${params.toString()}`}>
                <Calculator className="mr-2 h-4 w-4" /> Ir para calculadora
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        );
      })()}
    </div>
  );
}

/* ─── Pagination ────────────────────────────────────────────────────── */

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPage,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  return (
    <div className="flex items-center justify-between border-t border-border px-3 py-2.5 text-xs text-muted-foreground">
      <span>
        {start}–{end} de {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={currentPage === 1}
          onClick={() => onPage(currentPage - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="min-w-[3rem] text-center font-medium text-foreground">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={currentPage === totalPages}
          onClick={() => onPage(currentPage + 1)}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Medication list item ──────────────────────────────────────────── */

function MedicationListItem({
  item,
  active,
  onClick,
}: {
  item: BularioMedication;
  active: boolean;
  onClick: () => void;
}) {
  const noBulario = !hasBulario(item);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full p-3 text-left transition-colors",
        active ? "bg-secondary" : "hover:bg-muted/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
              {item.nome}
            </p>
            {noBulario && (
              <span className="shrink-0 rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-violet-600">
                IA
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {item.empresa || "Fabricante não informado"}
          </p>
        </div>
        <span className="mt-0.5 shrink-0 text-muted-foreground">
          {item.animalType === "grandes" ? (
            <Stethoscope className="h-4 w-4" />
          ) : (
            <PawPrint className="h-4 w-4" />
          )}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {item.classificacao && (
          <Badge variant="secondary" className="text-[10px]">
            {item.classificacao}
          </Badge>
        )}
        {item.especies && (
          <Badge variant="outline" className="text-[10px]">
            {item.especies}
          </Badge>
        )}
      </div>
    </button>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */

export default function BularioPage() {
  const { toast } = useToast();

  // Filters
  const [search, setSearch] = useState("");
  const [manufacturer, setManufacturer] = useState("all");
  const [species, setSpecies] = useState("all");
  const [animalType, setAnimalType] = useState("all");

  // Selection
  const [selectedId, setSelectedId] = useState(catalog.medications[0]?.id ?? "");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // AI prescription state
  const [aiPrescription, setAiPrescription] =
    useState<BularioAiPrescription | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const manufacturers = useMemo(() => listManufacturers(catalog.medications), []);
  const speciesOptions = useMemo(() => listSpecies(catalog.medications), []);

  const filteredMedications = useMemo(
    () =>
      searchBularioMedications(
        catalog.medications,
        search,
        manufacturer === "all" ? "" : manufacturer,
        species === "all" ? "" : species,
        animalType,
      ),
    [search, manufacturer, species, animalType],
  );

  function setFilter<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setCurrentPage(1);
    };
  }

  const totalPages = Math.ceil(filteredMedications.length / ITEMS_PER_PAGE);

  const paginatedMedications = useMemo(
    () =>
      filteredMedications.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
      ),
    [filteredMedications, currentPage],
  );

  const selectedMedication = useMemo(
    () => filteredMedications.find((m) => m.id === selectedId) ?? null,
    [filteredMedications, selectedId],
  );

  // AI generation mutation
  const aiMutation = useMutation({
    mutationFn: (med: BularioMedication) =>
      bularioService.generatePrescription(
        med.slug,
        med.animalType,
        med.nome,
      ),
    onSuccess: (data) => {
      setAiPrescription(data);
      setAiError(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Não foi possível gerar a bula com IA.";
      setAiError(msg);
      toast({ title: msg, variant: "destructive" });
    },
  });

  // Trigger only when user explicitly selects a medication
  function handleSelectMedication(item: BularioMedication) {
    setSelectedId(item.id);
    setAiPrescription(null);
    setAiError(null);
    setDrawerOpen(true);
    if (!hasBulario(item)) {
      aiMutation.mutate(item);
    }
  }

  const detailProps = selectedMedication
    ? {
        medication: selectedMedication,
        aiPrescription,
        isLoadingAi: aiMutation.isPending,
        aiError,
      }
    : null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      {/* Header */}
      <Card
        className="border-0 text-primary-foreground"
        style={{
          background:
            "linear-gradient(130deg, color-mix(in srgb, var(--primary) 88%, #000 12%) 0%, var(--primary) 55%, color-mix(in srgb, var(--accent) 70%, var(--primary) 30%) 100%)",
        }}
      >
        <CardContent className="flex flex-col gap-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                <Pill className="h-3.5 w-3.5" /> Bulário Digital DrVet
              </p>
              <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
                Catálogo farmacológico completo
              </h1>
              <p className="max-w-3xl text-xs text-white/85 sm:text-sm">
                Consulte medicamentos, bulas e interações. Medicamentos sem bula
                têm prescrição gerada automaticamente por IA.
              </p>
            </div>
            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 sm:flex">
              <Syringe className="h-7 w-7" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs">
              Total: <strong>{catalog.metadata.total}</strong>
            </div>
            <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs">
              Pequenos: <strong>{catalog.metadata.pequenos}</strong>
            </div>
            <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs">
              Grandes: <strong>{catalog.metadata.grandes}</strong>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs">
              <Sparkles className="h-3 w-3 shrink-0" />
              <span>Bulas por IA</span>
            </div>
          </div>

          <div>
            <Button
              asChild
              variant="secondary"
              className="w-full bg-white text-primary hover:bg-white/90 sm:w-auto"
            >
              <Link href="/bulario/calculadora">
                <Calculator className="mr-2 h-4 w-4" /> Abrir calculadora
                veterinária
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left: catalog list */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4 text-primary" /> Catálogo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Filters */}
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="search">Buscar medicamento</Label>
                <Input
                  id="search"
                  value={search}
                  onChange={(e) => setFilter(setSearch)(e.target.value)}
                  placeholder="Nome, princípio ativo, classificação..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de animal</Label>
                <Select value={animalType} onValueChange={setFilter(setAnimalType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pequenos">Pequenos</SelectItem>
                    <SelectItem value="grandes">Grandes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fabricante</Label>
                <Select value={manufacturer} onValueChange={setFilter(setManufacturer)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {manufacturers.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Espécie</Label>
                <Select value={species} onValueChange={setFilter(setSpecies)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {speciesOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* List */}
            <div className="rounded-xl border border-border bg-card">
              {filteredMedications.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  Nenhum medicamento encontrado com os filtros atuais.
                </p>
              ) : (
                <>
                  <div className="divide-y divide-border">
                    {paginatedMedications.map((item) => (
                      <MedicationListItem
                        key={`${item.animalType}-${item.id}`}
                        item={item}
                        active={selectedMedication?.id === item.id}
                        onClick={() => handleSelectMedication(item)}
                      />
                    ))}
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredMedications.length}
                    onPage={setCurrentPage}
                  />
                </>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-violet-600">
                IA
              </span>
              <span>= bula gerada automaticamente por IA ao selecionar</span>
            </div>
          </CardContent>
        </Card>

        {/* Right: detail (desktop only) */}
        <Card className="hidden border-border shadow-sm lg:block lg:sticky lg:top-4 lg:self-start">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Beaker className="h-4 w-4 text-primary" /> Ficha do medicamento
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[calc(100vh-12rem)] overflow-y-auto space-y-3">
            {!selectedMedication ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <FlaskConical className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Selecione um medicamento para ver os detalhes.
                </p>
              </div>
            ) : (
              detailProps && <MedicationDetail {...detailProps} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[92dvh]">
          <DrawerHeader className="flex flex-row items-center justify-between pb-2">
            <DrawerTitle className="flex items-center gap-2 text-base">
              <Beaker className="h-4 w-4 text-primary" /> Ficha do medicamento
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">
            {selectedMedication && detailProps ? (
              <MedicationDetail {...detailProps} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Selecione um medicamento.
              </p>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
