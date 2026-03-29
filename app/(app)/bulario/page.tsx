"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Beaker,
  Calculator,
  PawPrint,
  Pill,
  Search,
  ShieldAlert,
  Stethoscope,
  Syringe,
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
  getBularioCatalog,
  listManufacturers,
  listSpecies,
  searchBularioMedications,
} from "@/lib/bulario";

const catalog = getBularioCatalog();

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

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  );
}

export default function BularioPage() {
  const [search, setSearch] = useState("");
  const [manufacturer, setManufacturer] = useState("all");
  const [species, setSpecies] = useState("all");
  const [animalType, setAnimalType] = useState("all");
  const [selectedId, setSelectedId] = useState(catalog.medications[0]?.id ?? "");

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

  const selectedMedication = useMemo(
    () =>
      filteredMedications.find((item) => item.id === selectedId) ??
      filteredMedications[0] ??
      null,
    [filteredMedications, selectedId],
  );

  const visibleBularioEntries = useMemo(() => {
    if (!selectedMedication?.bulario) return [];

    return Object.entries(selectedMedication.bulario)
      .filter(([, value]) => Boolean(value))
      .slice(0, 10);
  }, [selectedMedication]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
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
              <h1 className="text-xl font-bold tracking-tight sm:text-3xl">Catálogo farmacológico completo</h1>
              <p className="max-w-3xl text-xs text-white/85 sm:text-sm">
                Consulte medicamentos, bulas e interações do catálogo interno. Para cálculos, use a calculadora veterinária dedicada.
              </p>
            </div>
            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 sm:flex">
              <Syringe className="h-7 w-7" />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs">Total: <strong>{catalog.metadata.total}</strong></div>
            <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs">Pequenos: <strong>{catalog.metadata.pequenos}</strong></div>
            <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs">Grandes: <strong>{catalog.metadata.grandes}</strong></div>
          </div>
          <div>
            <Button asChild variant="secondary" className="w-full bg-white text-primary hover:bg-white/90 sm:w-auto">
              <Link href="/bulario/calculadora">
                <Calculator className="mr-2 h-4 w-4" /> Abrir calculadora veterinária
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4 text-primary" /> Catálogo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="search">Buscar medicamento</Label>
                <Input
                  id="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nome, princípio ativo, classificação..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de animal</Label>
                <Select value={animalType} onValueChange={setAnimalType}>
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
                <Select value={manufacturer} onValueChange={setManufacturer}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {manufacturers.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Espécie</Label>
                <Select value={species} onValueChange={setSpecies}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {speciesOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card">
              <div className="max-h-[52vh] overflow-y-auto lg:max-h-[66vh]">
                {filteredMedications.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">Nenhum medicamento encontrado com os filtros atuais.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredMedications.map((item) => {
                      const active = selectedMedication?.id === item.id;
                      return (
                        <button
                          key={`${item.animalType}-${item.id}`}
                          type="button"
                          onClick={() => setSelectedId(item.id)}
                          className={`w-full p-3 text-left transition-colors ${active ? "bg-secondary" : "hover:bg-muted/40"}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-snug text-foreground line-clamp-2">{item.nome}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{item.empresa || "Fabricante não informado"}</p>
                            </div>
                            <span className="mt-0.5 text-muted-foreground">
                              {item.animalType === "grandes" ? (
                                <Stethoscope className="h-4 w-4" />
                              ) : (
                                <PawPrint className="h-4 w-4" />
                              )}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.classificacao && <Badge variant="secondary">{item.classificacao}</Badge>}
                            {item.especies && <Badge variant="outline">{item.especies}</Badge>}
                            <Badge variant="outline">ID {item.id}</Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm lg:sticky lg:top-4 lg:self-start">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Beaker className="h-4 w-4 text-primary" /> Ficha do medicamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedMedication ? (
              <p className="text-sm text-muted-foreground">Selecione um medicamento para ver os detalhes.</p>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-foreground">{selectedMedication.nome}</p>
                  <p className="text-sm text-muted-foreground">{selectedMedication.descricao || "Sem descrição disponível."}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedMedication.empresa && <Badge variant="secondary">{selectedMedication.empresa}</Badge>}
                  {selectedMedication.classificacao && <Badge variant="info">{selectedMedication.classificacao}</Badge>}
                  {selectedMedication.especies && <Badge variant="outline">{selectedMedication.especies}</Badge>}
                  <Badge variant={selectedMedication.animalType === "grandes" ? "warning" : "success"}>
                    {selectedMedication.animalType === "grandes" ? "Grandes animais" : "Pequenos animais"}
                  </Badge>
                </div>

                {selectedMedication.principiosAtivos?.length ? (
                  <DetailField label="Princípios ativos" value={selectedMedication.principiosAtivos.join(", ")} />
                ) : null}

                {visibleBularioEntries.length ? (
                  <div className="space-y-2">
                    {visibleBularioEntries.map(([key, value]) => (
                      <DetailField key={key} label={bularioLabels[key] ?? key} value={formatBularioValue(value as string | string[])} />
                    ))}
                  </div>
                ) : null}

                {selectedMedication.interacoes?.length ? (
                  <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
                    <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-warning">
                      <ShieldAlert className="h-3.5 w-3.5" /> Interações cadastradas
                    </p>
                    <ul className="space-y-1.5 text-sm text-foreground">
                      {selectedMedication.interacoes.slice(0, 6).map((item) => (
                        <li key={item.medicamento}>
                          <strong>{item.medicamento}:</strong> {item.detalhes.join(" | ")}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-sm text-foreground">
                    Para cálculo de dose, infusão, hidratação e CRI, use a calculadora completa.
                  </p>
                  <Button asChild className="mt-2 w-full sm:w-auto">
                    <Link href="/bulario/calculadora">
                      <Calculator className="mr-2 h-4 w-4" /> Ir para calculadora <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
