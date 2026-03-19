"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { X, ClipboardList, CheckCircle2, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { ApiMedicalEvent } from "@/types/api";

// ── Label maps ────────────────────────────────────────────────────────────────
const OPTS: Record<string, Record<string, string>> = {
  vomiting:       { nao: "Não", ocasional: "Ocasional", sim_agudo: "Sim (agudo)", sim_cronico: "Sim (crônico)" },
  diarrhea:       { nao: "Não", ocasional: "Ocasional", sim_agudo: "Sim (agudo)", sim_cronico: "Sim (crônico)" },
  eating:         { normal: "Normal", aumentado: "Aumentado", diminuido: "Diminuído", ausente: "Ausente" },
  drinking:       { normal: "Normal", aumentado: "Aumentado", diminuido: "Diminuído", ausente: "Ausente" },
  urination:      { normal: "Normal", aumentado: "Aumentada", diminuido: "Diminuída", ausente: "Ausente", doloroso: "Com esforço/dor", hematuria: "Com sangue" },
  defecation:     { normal: "Normal", aumentado: "Aumentado", diminuido: "Diminuído", ausente: "Ausente" },
  coughing:       { nao: "Não", ocasional: "Ocasional", frequente: "Frequente", constante: "Constante" },
  sneezing:       { nao: "Não", ocasional: "Ocasional", frequente: "Frequente", constante: "Constante" },
  dyspnea:        { nao: "Não", leve: "Leve", moderado: "Moderado", intenso: "Grave" },
  nasalDischarge: { nao: "Não", seroso: "Seroso", mucoso: "Mucoso", purulento: "Purulento", sanguinolento: "Sanguinolento" },
  ocularDischarge:{ nao: "Não", seroso: "Seroso", mucoso: "Mucoso", purulento: "Purulento", sanguinolento: "Sanguinolento" },
  pruritus:       { nao: "Não", leve: "Leve", moderado: "Moderado", intenso: "Intenso" },
  skinLesions:    { nao: "Não", sim_localizado: "Sim (localizado)", sim_generalizado: "Sim (generalizado)" },
  lameness:       { nao: "Não", leve: "Leve", moderado: "Moderado", intenso: "Grave" },
  seizures:       { nao: "Não", historico: "Histórico anterior", recente: "Episódio recente" },
  weightLoss:     { nao: "Não", leve: "Leve", moderado: "Moderado", intenso: "Grave" },
  fatigue:        { nao: "Não", leve: "Leve", moderado: "Moderado", intenso: "Grave" },
  ataxia:         { nao: "Não", leve: "Leve", moderado: "Moderado", intenso: "Grave" },
  tremors:        { nao: "Não", ocasional: "Ocasional", frequente: "Frequente", constante: "Constante" },
  mentalStatus:   { normal: "Normal / Alerta", deprimido: "Deprimido", estuporoso: "Estuporoso", comatoso: "Comatoso" },
  vestibularSigns:{ nao: "Não", sim: "Sim" },
  eyeDischarge:   { nao: "Não", seroso: "Seroso", mucoso: "Mucoso", purulento: "Purulento", sanguinolento: "Sanguinolento" },
  eyeRedness:     { nao: "Não", leve: "Leve", moderado: "Moderado", intenso: "Intenso" },
  eyeOpacity:     { nao: "Não", sim_unilateral: "Sim (unilateral)", sim_bilateral: "Sim (bilateral)" },
  eyePain:        { nao: "Não", sim: "Sim" },
  earDischarge:   { nao: "Não", seroso: "Seroso", marrom: "Marrom / Cera", purulento: "Purulento", sanguinolento: "Sanguinolento" },
  earOdor:        { nao: "Não", leve: "Leve", intenso: "Intenso" },
  earScratch:     { nao: "Não", ocasional: "Ocasional", frequente: "Frequente", constante: "Constante" },
  earAffected:    { nao: "Nenhum", esquerdo: "Ouvido esquerdo", direito: "Ouvido direito", bilateral: "Bilateral" },
};

function lbl(field: string, val: unknown): string | null {
  if (val === undefined || val === null || val === "") return null;
  if (typeof val === "boolean") return val ? "Sim" : "Não";
  const s = String(val);
  return OPTS[field]?.[s] ?? s;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-widest text-[#1B2A6B] bg-[#1B2A6B]/5 px-3 py-1.5 rounded-lg border border-[#1B2A6B]/10 mt-5 mb-2">
      {children}
    </h3>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0 w-44">{label}</span>
      <span className="text-xs font-medium text-right">{value}</span>
    </div>
  );
}

function BoolRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
      {value ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
      )}
      <span className={`text-xs ${value ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface AnamnesisDrawerProps {
  event: ApiMedicalEvent | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AnamnesisDrawer({ event, open, onOpenChange }: AnamnesisDrawerProps) {
  const snap = event?.anamnesis_snapshot as Record<string, unknown> | null;

  const g = (key: string) => snap?.[key] ?? null;
  const gb = (key: string): boolean => Boolean(snap?.[key]);

  const hasQueixa = !!(g("vomiting") || g("diarrhea") || g("eating") || g("drinking") ||
    g("urination") || g("defecation") || g("coughing") || g("sneezing") ||
    g("dyspnea") || g("nasalDischarge") || g("ocularDischarge") || g("pruritus") ||
    g("skinLesions") || g("lameness") || g("seizures") || g("weightLoss") ||
    g("fatigue") || g("complaintsNotes"));

  const hasAmb = !!(g("environment") || g("housingType") || g("walkFrequency") || g("foodType"));

  const hasPreventivos = !!(g("vaccinationProtocol") || g("ectoparasiteControl") ||
    g("dewormingLastDate") || g("vaccinationUpToDate") || g("dewormingUpToDate") ||
    g("heartwormPrevention"));

  const hasHistorico = !!(g("previousDiseases") || g("previousSurgeries") ||
    g("knownAllergies") || g("chronicConditions") || g("currentMedications") ||
    g("bloodType") || g("reproductiveHistory"));

  const hasNeuro = !!(g("mentalStatus") || g("ataxia") || g("tremors") ||
    g("vestibularSigns") || g("eyeDischarge") || g("eyeRedness") || g("eyeOpacity") ||
    g("eyePain") || g("earAffected") || g("earDischarge") || g("earOdor") || g("earScratch"));

  const hasComp = !!(g("temperament") || g("behaviorNotes") || g("clinicalObservations"));

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#1B2A6B]" />
              <DrawerTitle className="text-base">
                {event?.title ?? "Anamnese"}
              </DrawerTitle>
            </div>
            <DrawerClose className="rounded-full p-1 hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </DrawerClose>
          </div>
          {event && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <DrawerDescription className="flex items-center gap-2 m-0">
                <span>{formatDate(event.date)}</span>
                {event.vet && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span>Dr(a). {event.vet.name}</span>
                  </>
                )}
              </DrawerDescription>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-violet-100 text-violet-700">
                Anamnese
              </span>
            </div>
          )}
        </DrawerHeader>

        <div className="overflow-y-auto flex-1 px-4 pb-8">
          {!snap ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-2">
              <ClipboardList className="w-10 h-10 opacity-20" />
              <p className="text-sm">Nenhum dado de anamnese salvo neste registro.</p>
            </div>
          ) : (
            <div className="mt-2">
              {/* Queixa atual */}
              {hasQueixa && (
                <>
                  <SectionTitle>Queixa Atual e Sinais Clínicos</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                    <div>
                      <Row label="Vômito"            value={lbl("vomiting",        g("vomiting"))} />
                      <Row label="Diarreia"          value={lbl("diarrhea",        g("diarrhea"))} />
                      <Row label="Apetite"           value={lbl("eating",          g("eating"))} />
                      <Row label="Ingestão de água"  value={lbl("drinking",        g("drinking"))} />
                      <Row label="Urina"             value={lbl("urination",       g("urination"))} />
                      <Row label="Fezes"             value={lbl("defecation",      g("defecation"))} />
                      <Row label="Perda de peso"     value={lbl("weightLoss",      g("weightLoss"))} />
                      <Row label="Letargia / Cansaço"value={lbl("fatigue",         g("fatigue"))} />
                    </div>
                    <div>
                      <Row label="Tosse"             value={lbl("coughing",        g("coughing"))} />
                      <Row label="Espirro"           value={lbl("sneezing",        g("sneezing"))} />
                      <Row label="Dif. respiratória" value={lbl("dyspnea",         g("dyspnea"))} />
                      <Row label="Secreção nasal"    value={lbl("nasalDischarge",  g("nasalDischarge"))} />
                      <Row label="Secreção ocular"   value={lbl("ocularDischarge", g("ocularDischarge"))} />
                      <Row label="Coceira / Prurido" value={lbl("pruritus",        g("pruritus"))} />
                      <Row label="Lesões de pele"    value={lbl("skinLesions",     g("skinLesions"))} />
                      <Row label="Claudicação"       value={lbl("lameness",        g("lameness"))} />
                      <Row label="Convulsão"         value={lbl("seizures",        g("seizures"))} />
                    </div>
                  </div>
                  {g("complaintsNotes") && (
                    <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <p className="text-xs text-amber-700 font-medium mb-0.5">Observações complementares</p>
                      <p className="text-xs text-amber-900">{String(g("complaintsNotes"))}</p>
                    </div>
                  )}
                </>
              )}

              {/* Neurológico / Olhos / Ouvido */}
              {hasNeuro && (
                <>
                  <SectionTitle>Neurológico / Olhos / Ouvido</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                    <div>
                      <Row label="Estado mental"      value={lbl("mentalStatus",    g("mentalStatus"))} />
                      <Row label="Ataxia"             value={lbl("ataxia",          g("ataxia"))} />
                      <Row label="Tremores"           value={lbl("tremors",         g("tremors"))} />
                      <Row label="Sinais vestibulares"value={lbl("vestibularSigns", g("vestibularSigns"))} />
                    </div>
                    <div>
                      <Row label="Secreção ocular"    value={lbl("eyeDischarge",    g("eyeDischarge"))} />
                      <Row label="Vermelhidão ocular" value={lbl("eyeRedness",      g("eyeRedness"))} />
                      <Row label="Opacidade ocular"   value={lbl("eyeOpacity",      g("eyeOpacity"))} />
                      <Row label="Dor ocular"         value={lbl("eyePain",         g("eyePain"))} />
                      <Row label="Ouvido afetado"     value={lbl("earAffected",     g("earAffected"))} />
                      <Row label="Secreção auricular" value={lbl("earDischarge",    g("earDischarge"))} />
                      <Row label="Odor auricular"     value={lbl("earOdor",         g("earOdor"))} />
                      <Row label="Coçar / Chacoalhar" value={lbl("earScratch",      g("earScratch"))} />
                    </div>
                  </div>
                </>
              )}

              {/* Rotina e Alimentação */}
              {hasAmb && (
                <>
                  <SectionTitle>Rotina e Alimentação</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                    <div>
                      <Row label="Ambiente"     value={g("environment") ? String(g("environment")) : null} />
                      <Row label="Moradia"      value={g("housingType") ? String(g("housingType")) : null} />
                      <Row label="Passeios"     value={g("walkFrequency") ? String(g("walkFrequency")) : null} />
                      <BoolRow label="Contato com outros animais" value={gb("contactWithOtherAnimals")} />
                      <BoolRow label="Contato com animais silvestres" value={gb("contactWithWildAnimals")} />
                    </div>
                    <div>
                      <Row label="Alimentação"  value={g("foodType") ? String(g("foodType")) : null} />
                      <Row label="Marca"        value={g("foodBrand") ? String(g("foodBrand")) : null} />
                      <Row label="Refeições/dia"value={g("feedingsPerDay") ? String(g("feedingsPerDay")) : null} />
                      <Row label="Fonte de água"value={g("waterSource") ? String(g("waterSource")) : null} />
                    </div>
                  </div>
                </>
              )}

              {/* Preventivos */}
              {hasPreventivos && (
                <>
                  <SectionTitle>Preventivos</SectionTitle>
                  <BoolRow label="Vacinação em dia"    value={gb("vaccinationUpToDate")} />
                  <Row     label="Protocolo vacinal"   value={g("vaccinationProtocol") ? String(g("vaccinationProtocol")) : null} />
                  <BoolRow label="Vermifugação em dia" value={gb("dewormingUpToDate")} />
                  <Row     label="Última vermifugação" value={g("dewormingLastDate") ? String(g("dewormingLastDate")) : null} />
                  <Row     label="Ectoparasitas"       value={g("ectoparasiteControl") ? String(g("ectoparasiteControl")) : null} />
                  <BoolRow label="Prevenção heartworm" value={gb("heartwormPrevention")} />
                </>
              )}

              {/* Histórico Médico */}
              {hasHistorico && (
                <>
                  <SectionTitle>Histórico Médico</SectionTitle>
                  <Row label="Doenças anteriores"  value={g("previousDiseases") ? String(g("previousDiseases")) : null} />
                  <Row label="Cirurgias"           value={g("previousSurgeries") ? String(g("previousSurgeries")) : null} />
                  <Row label="Alergias"            value={g("knownAllergies") ? String(g("knownAllergies")) : null} />
                  <Row label="Condições crônicas"  value={g("chronicConditions") ? String(g("chronicConditions")) : null} />
                  <Row label="Medicações em uso"   value={g("currentMedications") ? String(g("currentMedications")) : null} />
                  <Row label="Tipo sanguíneo"      value={g("bloodType") ? String(g("bloodType")) : null} />
                  <Row label="Hist. reprodutivo"   value={g("reproductiveHistory") ? String(g("reproductiveHistory")) : null} />
                </>
              )}

              {/* Comportamento */}
              {hasComp && (
                <>
                  <SectionTitle>Comportamento e Observações</SectionTitle>
                  <Row label="Temperamento"          value={g("temperament") ? String(g("temperament")) : null} />
                  <Row label="Comportamento"         value={g("behaviorNotes") ? String(g("behaviorNotes")) : null} />
                  <Row label="Observações clínicas"  value={g("clinicalObservations") ? String(g("clinicalObservations")) : null} />
                </>
              )}

              {!hasQueixa && !hasAmb && !hasPreventivos && !hasHistorico && !hasNeuro && !hasComp && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
                  <ClipboardList className="w-8 h-8 opacity-20" />
                  <p className="text-sm">Nenhum campo de anamnese foi preenchido neste registro.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
