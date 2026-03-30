import { apiClient } from "@/lib/api-client";

export interface BularioAiPrescription {
  receita: string | null;
  composicao: string | null;
  armazenamento: string | null;
  apresentacoes: string | null;
  indicacoes: string | null;
  contraindicacoes: string | null;
  efeitosAdversos: string | null;
  modoUsar: string | null;
  observacoes: string | null;
  frequenciaUtilizacao: string | null;
  duracaoTratamento: string | null;
  farmacodinamica: string | null;
  farmacocinetica: string | null;
}

export const bularioService = {
  getPrescription: async (
    slug: string,
    animalType: string,
  ): Promise<BularioAiPrescription | null> => {
    const { data } = await apiClient.get<{ data: BularioAiPrescription | null }>(
      "/bulario/prescription",
      { params: { slug, animal_type: animalType } },
    );
    return data.data;
  },

  generatePrescription: async (
    slug: string,
    animalType: string,
    medicationName: string,
  ): Promise<BularioAiPrescription> => {
    const { data } = await apiClient.post<{ data: BularioAiPrescription }>(
      "/bulario/prescription",
      { slug, animal_type: animalType, medication_name: medicationName },
    );
    return data.data;
  },
};
