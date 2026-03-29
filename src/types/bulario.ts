export type BularioAnimalType = "pequenos" | "grandes";

export interface BularioDoseEntry {
  especie: string;
  dose: string;
  subgrupo?: string;
}

export interface BularioInteraction {
  medicamento: string;
  detalhes: string[];
}

export interface RawBularioMedication {
  id: string;
  slug: string;
  url: string;
  nome: string;
  empresa?: string;
  linhaComercial?: string;
  classificacao?: string;
  especies?: string;
  descricao?: string;
  principiosAtivos?: string[];
  bulario?: Record<string, string | string[] | undefined>;
  interacoes?: BularioInteraction[];
  dosagens?: BularioDoseEntry[];
  animalType?: BularioAnimalType;
}

export interface BularioMedication extends RawBularioMedication {
  animalType: BularioAnimalType;
}

export interface BularioDatasetMetadata {
  fonte: string;
  data_coleta?: string;
  total_coletado: number;
}

export interface BularioDatasetFile {
  metadata: BularioDatasetMetadata;
  medicamentos: RawBularioMedication[];
}

export interface BularioCatalog {
  metadata: {
    total: number;
    pequenos: number;
    grandes: number;
    fontes: string[];
    dataColeta: string;
  };
  medications: BularioMedication[];
}

export interface DoseSuggestion {
  doseMinMgKg: number | null;
  doseMaxMgKg: number | null;
  concentrationMgMl: number | null;
}

export interface DoseCalculatorInput {
  weightKg: number;
  doseMinMgKg: number;
  doseMaxMgKg?: number;
  concentrationMgMl?: number;
  frequencyHours?: number;
  durationDays?: number;
}

export interface DoseCalculatorResult {
  doseMinMg: number;
  doseMaxMg: number;
  volumeMinMl: number | null;
  volumeMaxMl: number | null;
  dosesPerDay: number | null;
  dailyMinMg: number | null;
  dailyMaxMg: number | null;
  totalMinMg: number | null;
  totalMaxMg: number | null;
}
