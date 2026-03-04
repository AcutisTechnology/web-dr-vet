import type { Pet, PetSpecies, PetSex, PetAnamnesis } from "@/types";
import type { ApiPet } from "@/types/api";

export function adaptApiPetToPet(p: ApiPet): Pet {
  return {
    id: p.id,
    clientId: p.client?.id ?? "",
    name: p.name,
    species: (p.species as PetSpecies) ?? "other",
    breed: p.breed ?? "",
    sex: (p.sex === "female" ? "female" : "male") as PetSex,
    birthDate: p.birth_date ?? undefined,
    color: p.color ?? undefined,
    microchip: p.microchip ?? undefined,
    neutered: p.neutered ?? false,
    status: (p.status ?? "active") as Pet["status"],
    weight: p.weight ?? undefined,
    notes: p.notes ?? undefined,
    anamnesis: p.anamnesis
      ? (p.anamnesis as unknown as PetAnamnesis)
      : undefined,
    photos: [],
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}
