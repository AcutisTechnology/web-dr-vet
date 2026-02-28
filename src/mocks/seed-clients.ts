import type { Client, Pet, MedicalEvent } from "@/types";

const now = new Date();
const d = (offsetDays: number, h = 0, m = 0) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() + offsetDays);
  dt.setHours(h, m, 0, 0);
  return dt.toISOString();
};

export const seedClients: Client[] = [
  { id: "c1", name: "Maria Silva", cpf: "123.456.789-00", email: "maria@email.com", phone: "(11) 98765-4321", address: { street: "Rua das Flores", number: "123", neighborhood: "Jardim América", city: "São Paulo", state: "SP", zip: "01310-100" }, active: true, createdAt: d(-200), updatedAt: d(-10) },
  { id: "c2", name: "João Pereira", cpf: "987.654.321-00", email: "joao@email.com", phone: "(11) 91234-5678", address: { street: "Av. Paulista", number: "1000", neighborhood: "Bela Vista", city: "São Paulo", state: "SP", zip: "01310-200" }, active: true, createdAt: d(-180), updatedAt: d(-5) },
  { id: "c3", name: "Carla Rodrigues", cpf: "456.789.123-00", email: "carla@email.com", phone: "(11) 99876-5432", address: { street: "Rua Augusta", number: "500", neighborhood: "Consolação", city: "São Paulo", state: "SP", zip: "01305-000" }, active: true, createdAt: d(-150), updatedAt: d(-2) },
  { id: "c4", name: "Pedro Oliveira", phone: "(11) 97654-3210", active: true, createdAt: d(-100), updatedAt: d(-1) },
  { id: "c5", name: "Lucia Ferreira", email: "lucia@email.com", phone: "(11) 96543-2109", active: true, createdAt: d(-80), updatedAt: d(-3) },
  { id: "c6", name: "Marcos Costa", phone: "(11) 95432-1098", active: false, createdAt: d(-300), updatedAt: d(-60) },
];

export const seedPets: Pet[] = [
  { id: "p1", clientId: "c1", name: "Bolinha", species: "dog", breed: "Labrador", sex: "male", birthDate: "2020-03-15", color: "Amarelo", neutered: true, status: "active", weight: 28.5, microchip: "985112345678901", notes: "Alérgico a frango", photos: [], createdAt: d(-200), updatedAt: d(-5) },
  { id: "p2", clientId: "c1", name: "Mimi", species: "cat", breed: "Persa", sex: "female", birthDate: "2021-07-20", color: "Branco", neutered: true, status: "active", weight: 4.2, photos: [], createdAt: d(-150), updatedAt: d(-3) },
  { id: "p3", clientId: "c2", name: "Rex", species: "dog", breed: "Pastor Alemão", sex: "male", birthDate: "2019-01-10", color: "Preto e Marrom", neutered: false, status: "active", weight: 35.0, photos: [], createdAt: d(-180), updatedAt: d(-7) },
  { id: "p4", clientId: "c3", name: "Luna", species: "dog", breed: "Golden Retriever", sex: "female", birthDate: "2022-05-05", color: "Dourado", neutered: true, status: "active", weight: 22.3, photos: [], createdAt: d(-150), updatedAt: d(-1) },
  { id: "p5", clientId: "c4", name: "Fifi", species: "cat", breed: "Siamês", sex: "female", birthDate: "2020-11-30", color: "Creme", neutered: true, status: "active", weight: 3.8, photos: [], createdAt: d(-100), updatedAt: d(-2) },
  { id: "p6", clientId: "c5", name: "Thor", species: "dog", breed: "Bulldog Francês", sex: "male", birthDate: "2021-09-12", color: "Tigrado", neutered: true, status: "active", weight: 12.1, photos: [], createdAt: d(-80), updatedAt: d(-4) },
  { id: "p7", clientId: "c2", name: "Pipoca", species: "rabbit", breed: "Angorá", sex: "female", birthDate: "2022-02-14", color: "Branco", neutered: false, status: "active", weight: 1.5, photos: [], createdAt: d(-120), updatedAt: d(-10) },
  { id: "p8", clientId: "c3", name: "Max", species: "dog", breed: "Poodle", sex: "male", birthDate: "2018-06-20", color: "Preto", neutered: true, status: "deceased", weight: 8.0, notes: "Faleceu em 10/01/2025 - insuficiência renal", photos: [], createdAt: d(-400), updatedAt: d(-40) },
];

export const seedMedicalEvents: MedicalEvent[] = [
  { id: "me1", petId: "p1", type: "consultation", date: d(-30), vetId: "u1", title: "Consulta de rotina", description: "Animal saudável, sem alterações. Recomendado controle de peso.", weightKg: 28.5, createdAt: d(-30) },
  { id: "me2", petId: "p1", type: "vaccine", date: d(-60), vetId: "u1", title: "Vacina V10", vaccineProtocol: "V10 Anual", vaccineNextDate: d(305), vaccineStatus: "active", description: "Aplicada sem intercorrências.", createdAt: d(-60) },
  { id: "me3", petId: "p1", type: "exam", date: d(-15), vetId: "u2", title: "Hemograma completo", examResult: "Resultados dentro da normalidade. Leve anemia.", description: "Solicitado para investigação de letargia.", createdAt: d(-15) },
  { id: "me4", petId: "p1", type: "prescription", date: d(-15), vetId: "u2", title: "Receita - Suplemento de Ferro", prescriptionItems: [{ medication: "Ferrodex", dosage: "1 comprimido", frequency: "1x ao dia", duration: "30 dias", notes: "Administrar com alimento" }], createdAt: d(-15) },
  { id: "me5", petId: "p1", type: "weight", date: d(-7), vetId: "u3", title: "Pesagem", weightKg: 28.5, createdAt: d(-7) },
  { id: "me6", petId: "p3", type: "consultation", date: d(-5), vetId: "u1", title: "Consulta - Otite", description: "Otite bilateral. Prescrito tratamento tópico.", pathologies: ["Otite"], createdAt: d(-5) },
  { id: "me7", petId: "p4", type: "vaccine", date: d(-10), vetId: "u2", title: "Vacina Antirrábica", vaccineProtocol: "Antirrábica Anual", vaccineNextDate: d(355), vaccineStatus: "active", createdAt: d(-10) },
  { id: "me8", petId: "p2", type: "surgery", date: d(-90), vetId: "u1", title: "Castração", description: "Procedimento realizado sem intercorrências. Alta no mesmo dia.", createdAt: d(-90) },
  { id: "me9", petId: "p6", type: "observation", date: d(-2), vetId: "u2", title: "Observação - Tosse", description: "Animal apresentando tosse seca. Aguardar evolução.", createdAt: d(-2) },
  { id: "me10", petId: "p5", type: "weight", date: d(-5), vetId: "u3", title: "Pesagem", weightKg: 3.8, createdAt: d(-5) },
];
