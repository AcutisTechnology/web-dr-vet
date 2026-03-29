import pequenosJson from "@/data/medicamentos_pequenos_animais.json";
import grandesJson from "@/data/medicamentos_grandes_animais.json";
import complementaresJson from "@/data/medicamentos_complementares.json";
import catalogoCompletoJson from "@/data/medicamentos_catalogo_completo.json";
import type {
  BularioCatalog,
  BularioDoseEntry,
  BularioMedication,
  BularioDatasetFile,
  DoseSuggestion,
} from "@/types/bulario";

const pequenos = pequenosJson as unknown as BularioDatasetFile;
const grandes = grandesJson as unknown as BularioDatasetFile;
const complementares = complementaresJson as unknown as BularioDatasetFile;
const catalogoCompleto = catalogoCompletoJson as unknown as BularioDatasetFile;

function medicationRichness(item: BularioMedication) {
  let score = 0;
  if (item.descricao) score += 1;
  if (item.empresa) score += 1;
  if (item.classificacao) score += 1;
  if (item.especies) score += 1;
  if (item.principiosAtivos?.length) score += 1;
  if (item.bulario && Object.keys(item.bulario).length) score += 2;
  if (item.interacoes?.length) score += 1;
  if (item.dosagens?.length) score += 1;
  return score;
}

function mergeSources(sources: BularioMedication[]) {
  const byKey = new Map<string, BularioMedication>();

  for (const item of sources) {
    const key = `${item.animalType}:${item.id}`;
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, item);
      continue;
    }

    if (medicationRichness(item) >= medicationRichness(current)) {
      byKey.set(key, { ...current, ...item });
    }
  }

  return Array.from(byKey.values());
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function extractDoseRangeMgKg(source: string) {
  const rangeMatch = source.match(/(\d+[.,]?\d*)\s*-\s*(\d+[.,]?\d*)\s*mg\s*\/?\s*kg/i);
  if (rangeMatch) {
    const min = parseNumber(rangeMatch[1]);
    const max = parseNumber(rangeMatch[2]);
    if (min !== null && max !== null) return { min, max };
  }

  const singleMatch = source.match(/(\d+[.,]?\d*)\s*mg\s*\/?\s*kg/i);
  if (singleMatch) {
    const value = parseNumber(singleMatch[1]);
    if (value !== null) return { min: value, max: value };
  }

  return { min: null, max: null };
}

function extractConcentrationMgMl(source: string) {
  const concentrationMatch = source.match(/(\d+[.,]?\d*)\s*mg\s*\/?\s*m[li]/i);
  if (!concentrationMatch) return null;
  return parseNumber(concentrationMatch[1]);
}

export function getBularioCatalog(): BularioCatalog {
  const detailedMedications: BularioMedication[] = [
    ...pequenos.medicamentos.map((item) => ({ ...item, animalType: "pequenos" as const })),
    ...grandes.medicamentos.map((item) => ({ ...item, animalType: "grandes" as const })),
  ];

  const fullCatalogMedications: BularioMedication[] = catalogoCompleto.medicamentos.map((item) => ({
    ...item,
    animalType: item.animalType === "grandes" ? "grandes" : "pequenos",
  }));

  const complementary: BularioMedication[] = complementares.medicamentos.map((item) => ({
    ...item,
    animalType: item.animalType === "grandes" ? "grandes" : "pequenos",
  }));

  const medications = mergeSources([
    ...fullCatalogMedications,
    ...complementary,
    ...detailedMedications,
  ]).sort((a, b) => a.nome.localeCompare(b.nome));

  const pequenosCount = medications.filter((item) => item.animalType === "pequenos").length;
  const grandesCount = medications.filter((item) => item.animalType === "grandes").length;

  return {
    metadata: {
      total: medications.length,
      pequenos: pequenosCount,
      grandes: grandesCount,
      fontes: ["Base DrVet"],
      dataColeta: pequenos.metadata.data_coleta ?? "",
    },
    medications,
  };
}

export function searchBularioMedications(
  medications: BularioMedication[],
  query: string,
  manufacturer: string,
  species: string,
  animalType: string,
) {
  const normalizedQuery = normalizeText(query);
  const normalizedManufacturer = normalizeText(manufacturer);
  const normalizedSpecies = normalizeText(species);

  return medications.filter((medication) => {
    const haystack = normalizeText(
      [
        medication.nome,
        medication.empresa ?? "",
        medication.classificacao ?? "",
        medication.especies ?? "",
        ...(medication.principiosAtivos ?? []),
      ].join(" "),
    );

    const medicationManufacturer = normalizeText(medication.empresa ?? "");
    const medicationSpecies = normalizeText(medication.especies ?? "");

    const matchQuery = !normalizedQuery || haystack.includes(normalizedQuery);
    const matchManufacturer = !normalizedManufacturer || medicationManufacturer === normalizedManufacturer;
    const matchSpecies = !normalizedSpecies || medicationSpecies.includes(normalizedSpecies);
    const matchType = !animalType || animalType === "all" || medication.animalType === animalType;

    return matchQuery && matchManufacturer && matchSpecies && matchType;
  });
}

export function listManufacturers(medications: BularioMedication[]) {
  return Array.from(
    new Set(
      medications
        .map((medication) => medication.empresa)
        .filter((value): value is string => Boolean(value && value.trim().length)),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export function listSpecies(medications: BularioMedication[]) {
  return Array.from(
    new Set(
      medications
        .map((medication) => medication.especies)
        .filter((value): value is string => Boolean(value && value.trim().length)),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

function flattenDoseText(dosagens: BularioDoseEntry[] | undefined, bularioDoseText: string | undefined) {
  const dosageFromArray = (dosagens ?? []).map((item) => `${item.especie} ${item.dose}`).join(" | ");
  return [dosageFromArray, bularioDoseText ?? ""].filter(Boolean).join(" | ");
}

export function getDoseSuggestion(medication: BularioMedication | null): DoseSuggestion {
  if (!medication) {
    return {
      doseMinMgKg: null,
      doseMaxMgKg: null,
      concentrationMgMl: null,
    };
  }

  const bularioDoseText = typeof medication.bulario?.dosagens === "string" ? medication.bulario.dosagens : undefined;
  const doseSource = flattenDoseText(medication.dosagens, bularioDoseText);
  const compositionSource = typeof medication.bulario?.composicao === "string" ? medication.bulario.composicao : "";
  const modeSource = typeof medication.bulario?.modoUsar === "string" ? medication.bulario.modoUsar : "";

  const doseRange = extractDoseRangeMgKg([doseSource, modeSource].join(" | "));
  const concentration = extractConcentrationMgMl([compositionSource, modeSource, doseSource].join(" | "));

  return {
    doseMinMgKg: doseRange.min,
    doseMaxMgKg: doseRange.max,
    concentrationMgMl: concentration,
  };
}
