import type { DoseCalculatorInput, DoseCalculatorResult } from "@/types/bulario";

function round(value: number, decimals = 3) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function calculateDose(input: DoseCalculatorInput): DoseCalculatorResult {
  const doseMaxMgKg = input.doseMaxMgKg ?? input.doseMinMgKg;
  const doseMinMg = round(input.weightKg * input.doseMinMgKg);
  const doseMaxMg = round(input.weightKg * doseMaxMgKg);

  const hasConcentration = typeof input.concentrationMgMl === "number" && input.concentrationMgMl > 0;
  const volumeMinMl = hasConcentration ? round(doseMinMg / input.concentrationMgMl!, 3) : null;
  const volumeMaxMl = hasConcentration ? round(doseMaxMg / input.concentrationMgMl!, 3) : null;

  const dosesPerDay =
    typeof input.frequencyHours === "number" && input.frequencyHours > 0
      ? round(24 / input.frequencyHours, 2)
      : null;

  const dailyMinMg = dosesPerDay ? round(doseMinMg * dosesPerDay) : null;
  const dailyMaxMg = dosesPerDay ? round(doseMaxMg * dosesPerDay) : null;

  const totalMinMg =
    dailyMinMg && typeof input.durationDays === "number" && input.durationDays > 0
      ? round(dailyMinMg * input.durationDays)
      : null;

  const totalMaxMg =
    dailyMaxMg && typeof input.durationDays === "number" && input.durationDays > 0
      ? round(dailyMaxMg * input.durationDays)
      : null;

  return {
    doseMinMg,
    doseMaxMg,
    volumeMinMl,
    volumeMaxMl,
    dosesPerDay,
    dailyMinMg,
    dailyMaxMg,
    totalMinMg,
    totalMaxMg,
  };
}

export function buildPrescriptionText(params: {
  medicationName: string;
  weightKg: number;
  route: string;
  frequencyHours?: number;
  durationDays?: number;
  result: DoseCalculatorResult;
}) {
  const { medicationName, weightKg, route, frequencyHours, durationDays, result } = params;

  const lines = [
    `Medicamento: ${medicationName}`,
    `Peso: ${weightKg} kg`,
    `Via: ${route}`,
    `Dose por aplicacao: ${result.doseMinMg} mg${result.doseMaxMg !== result.doseMinMg ? ` ate ${result.doseMaxMg} mg` : ""}`,
  ];

  if (result.volumeMinMl !== null) {
    lines.push(
      `Volume por aplicacao: ${result.volumeMinMl} mL${result.volumeMaxMl !== null && result.volumeMaxMl !== result.volumeMinMl ? ` ate ${result.volumeMaxMl} mL` : ""}`,
    );
  }

  if (frequencyHours) lines.push(`Frequencia: a cada ${frequencyHours} horas`);
  if (durationDays) lines.push(`Duracao sugerida: ${durationDays} dias`);

  lines.push("Revisar dose final com julgamento clinico e bula oficial.");

  return lines.join("\n");
}
