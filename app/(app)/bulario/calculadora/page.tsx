"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Calculator,
  Droplets,
  Gauge,
  HeartPulse,
  Syringe,
  Timer,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function parse(value: string) {
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function round(value: number, decimals = 3) {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

export default function BularioCalculadoraPage() {
  const [weightKg, setWeightKg] = useState("");
  const [doseMgKg, setDoseMgKg] = useState("");
  const [concentrationMgMl, setConcentrationMgMl] = useState("");
  const [frequencyHours, setFrequencyHours] = useState("12");

  const [hydrationWeight, setHydrationWeight] = useState("");
  const [dehydrationPercent, setDehydrationPercent] = useState("8");
  const [maintenanceMlKgDay, setMaintenanceMlKgDay] = useState("50");
  const [ongoingLossesMl, setOngoingLossesMl] = useState("0");
  const [rehydrationHours, setRehydrationHours] = useState("24");

  const [dripVolumeMl, setDripVolumeMl] = useState("");
  const [dripHours, setDripHours] = useState("");
  const [dripFactor, setDripFactor] = useState("20");

  const [criWeight, setCriWeight] = useState("");
  const [criDose, setCriDose] = useState("");
  const [criConc, setCriConc] = useState("");
  const [criRate, setCriRate] = useState("5");

  const doseResult = useMemo(() => {
    const w = parse(weightKg);
    const d = parse(doseMgKg);
    const c = parse(concentrationMgMl);
    const h = parse(frequencyHours);
    if (!w || !d) return null;

    const mgDose = w * d;
    const mlDose = c && c > 0 ? mgDose / c : null;
    const dosesDay = h && h > 0 ? 24 / h : null;
    const mgDay = dosesDay ? mgDose * dosesDay : null;

    return {
      mgDose: round(mgDose),
      mlDose: mlDose !== null ? round(mlDose) : null,
      dosesDay: dosesDay !== null ? round(dosesDay, 2) : null,
      mgDay: mgDay !== null ? round(mgDay) : null,
    };
  }, [weightKg, doseMgKg, concentrationMgMl, frequencyHours]);

  const hydrationResult = useMemo(() => {
    const w = parse(hydrationWeight);
    const dehyd = parse(dehydrationPercent);
    const maint = parse(maintenanceMlKgDay);
    const losses = parse(ongoingLossesMl);
    const hours = parse(rehydrationHours);

    if (!w || dehyd === null || !maint || !hours || hours <= 0) return null;

    const deficit = w * (dehyd / 100) * 1000;
    const maintenance = w * maint;
    const total24h = deficit + maintenance + (losses ?? 0);
    const mlHour = total24h / hours;

    return {
      deficitMl: round(deficit),
      maintenanceMlDay: round(maintenance),
      totalMl: round(total24h),
      mlHour: round(mlHour),
    };
  }, [hydrationWeight, dehydrationPercent, maintenanceMlKgDay, ongoingLossesMl, rehydrationHours]);

  const infusionResult = useMemo(() => {
    const volume = parse(dripVolumeMl);
    const hours = parse(dripHours);
    const factor = parse(dripFactor);
    if (!volume || !hours || !factor || hours <= 0) return null;

    const mlHour = volume / hours;
    const dropsMin = (volume * factor) / (hours * 60);

    return {
      mlHour: round(mlHour),
      dropsMin: round(dropsMin),
    };
  }, [dripVolumeMl, dripHours, dripFactor]);

  const criResult = useMemo(() => {
    const w = parse(criWeight);
    const dose = parse(criDose);
    const conc = parse(criConc);
    const rate = parse(criRate);
    if (!w || !dose || !conc || !rate) return null;

    const mgHour = w * dose;
    const mlHourDrug = mgHour / conc;
    const concentrationInBag = (mgHour * 60) / rate;

    return {
      mgHour: round(mgHour),
      mlHourDrug: round(mlHourDrug),
      concentrationInBag: round(concentrationInBag),
    };
  }, [criWeight, criDose, criConc, criRate]);

  return (
    <div className="space-y-4">
      <Card
        className="border-0 text-primary-foreground"
        style={{
          background:
            "linear-gradient(130deg, color-mix(in srgb, var(--primary) 90%, #000 10%) 0%, var(--primary) 60%, color-mix(in srgb, var(--accent) 74%, var(--primary) 26%) 100%)",
        }}
      >
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                <Calculator className="h-3.5 w-3.5" /> Calculadora Veterinária DrVet
              </p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Cálculos clínicos essenciais</h1>
              <p className="max-w-2xl text-sm text-white/85">
                Dose, fluidoterapia, gotejamento e CRI em uma tela otimizada para desktop e mobile.
              </p>
            </div>
            <Button asChild variant="secondary" className="w-full bg-white text-primary hover:bg-white/90 sm:w-auto">
              <Link href="/bulario">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao bulário
              </Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="border-white/20 bg-white/20 text-white hover:bg-white/20">Dose mg/kg</Badge>
            <Badge className="border-white/20 bg-white/20 text-white hover:bg-white/20">Fluidoterapia</Badge>
            <Badge className="border-white/20 bg-white/20 text-white hover:bg-white/20">Gotejamento</Badge>
            <Badge className="border-white/20 bg-white/20 text-white hover:bg-white/20">CRI</Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="dose" className="space-y-3">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-muted p-1 md:grid-cols-4">
          <TabsTrigger value="dose" className="text-xs sm:text-sm">Dose</TabsTrigger>
          <TabsTrigger value="fluido" className="text-xs sm:text-sm">Fluidoterapia</TabsTrigger>
          <TabsTrigger value="gotejamento" className="text-xs sm:text-sm">Gotejamento</TabsTrigger>
          <TabsTrigger value="cri" className="text-xs sm:text-sm">CRI</TabsTrigger>
        </TabsList>

        <TabsContent value="dose">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Syringe className="h-4 w-4 text-primary" /> Cálculo de dose</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Peso (kg)</Label><Input value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="Ex.: 12,5" /></div>
                <div className="space-y-1.5"><Label>Dose (mg/kg)</Label><Input value={doseMgKg} onChange={(e) => setDoseMgKg(e.target.value)} placeholder="Ex.: 0,2" /></div>
                <div className="space-y-1.5"><Label>Concentração (mg/mL)</Label><Input value={concentrationMgMl} onChange={(e) => setConcentrationMgMl(e.target.value)} placeholder="Ex.: 50" /></div>
                <div className="space-y-1.5"><Label>Intervalo (horas)</Label><Input value={frequencyHours} onChange={(e) => setFrequencyHours(e.target.value)} placeholder="Ex.: 12" /></div>
              </div>
              {doseResult ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <MetricCard label="Dose por aplicação" value={`${doseResult.mgDose} mg`} />
                  <MetricCard label="Volume por aplicação" value={doseResult.mlDose !== null ? `${doseResult.mlDose} mL` : "-"} />
                  <MetricCard label="Aplicações por dia" value={doseResult.dosesDay !== null ? `${doseResult.dosesDay}` : "-"} />
                  <MetricCard label="Dose diária total" value={doseResult.mgDay !== null ? `${doseResult.mgDay} mg` : "-"} />
                </div>
              ) : (
                <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">Informe peso e dose para calcular.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fluido">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Droplets className="h-4 w-4 text-primary" /> Fluidoterapia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Peso (kg)</Label><Input value={hydrationWeight} onChange={(e) => setHydrationWeight(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Desidratação (%)</Label><Input value={dehydrationPercent} onChange={(e) => setDehydrationPercent(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Manutenção (mL/kg/dia)</Label><Input value={maintenanceMlKgDay} onChange={(e) => setMaintenanceMlKgDay(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Perdas contínuas (mL/24h)</Label><Input value={ongoingLossesMl} onChange={(e) => setOngoingLossesMl(e.target.value)} /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Horas para reposição</Label><Input value={rehydrationHours} onChange={(e) => setRehydrationHours(e.target.value)} /></div>
              </div>
              {hydrationResult ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <MetricCard label="Déficit" value={`${hydrationResult.deficitMl} mL`} />
                  <MetricCard label="Manutenção 24h" value={`${hydrationResult.maintenanceMlDay} mL`} />
                  <MetricCard label="Volume total" value={`${hydrationResult.totalMl} mL`} />
                  <MetricCard label="Taxa" value={`${hydrationResult.mlHour} mL/h`} />
                </div>
              ) : (
                <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">Informe os campos para calcular.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gotejamento">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Timer className="h-4 w-4 text-primary" /> Gotejamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-3"><Label>Volume total (mL)</Label><Input value={dripVolumeMl} onChange={(e) => setDripVolumeMl(e.target.value)} /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Tempo (horas)</Label><Input value={dripHours} onChange={(e) => setDripHours(e.target.value)} /></div>
                <div className="space-y-1.5">
                  <Label>Equipo (gtt/mL)</Label>
                  <Select value={dripFactor} onValueChange={setDripFactor}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="60">60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {infusionResult ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <MetricCard label="Taxa" value={`${infusionResult.mlHour} mL/h`} />
                  <MetricCard label="Gotejamento" value={`${infusionResult.dropsMin} gotas/min`} />
                </div>
              ) : (
                <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">Informe volume e tempo para calcular.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cri">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><HeartPulse className="h-4 w-4 text-primary" /> CRI (infusão contínua)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Peso (kg)</Label><Input value={criWeight} onChange={(e) => setCriWeight(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Dose desejada (mg/kg/h)</Label><Input value={criDose} onChange={(e) => setCriDose(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Concentração da droga (mg/mL)</Label><Input value={criConc} onChange={(e) => setCriConc(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Velocidade da bomba (mL/h)</Label><Input value={criRate} onChange={(e) => setCriRate(e.target.value)} /></div>
              </div>
              {criResult ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  <MetricCard label="Necessidade" value={`${criResult.mgHour} mg/h`} />
                  <MetricCard label="Volume da droga" value={`${criResult.mlHourDrug} mL/h`} />
                  <MetricCard label="Concentração no fluido" value={`${criResult.concentrationInBag} mg/L`} />
                </div>
              ) : (
                <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">Informe os campos para calcular.</p>
              )}
              <div className="rounded-xl border border-info/30 bg-info/10 p-3 text-sm text-foreground">
                <p className="inline-flex items-center gap-1.5 font-medium"><Gauge className="h-4 w-4 text-info" /> Revisar parâmetros antes da prescrição final.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
