import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientService } from "@/services/client.service";
import { petService } from "@/services/pet.service";
import { adaptApiClientToClient } from "@/adapters/client.adapter";
import { adaptApiPetToPet } from "@/adapters/pet.adapter";
import type { StoreClientPayload, StorePetPayload } from "@/types/api";

export const clientKeys = {
  all: () => ["clients"] as const,
  detail: (id: string) => ["clients", id] as const,
};

export const petKeys = {
  all: () => ["pets"] as const,
  detail: (id: string) => ["pets", id] as const,
  byClient: (clientId: string) => ["pets", "client", clientId] as const,
};

export function useClients() {
  return useQuery({
    queryKey: clientKeys.all(),
    queryFn: () => clientService.list(),
    select: (data) => data.map(adaptApiClientToClient),
    staleTime: 1000 * 60 * 5,
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => clientService.get(id),
    select: adaptApiClientToClient,
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StoreClientPayload) => clientService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.all() }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<StoreClientPayload>;
    }) => clientService.update(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: clientKeys.all() });
      qc.invalidateQueries({ queryKey: clientKeys.detail(id) });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.all() }),
  });
}

export function usePets() {
  return useQuery({
    queryKey: petKeys.all(),
    queryFn: () => petService.list(),
    select: (data) => data.map(adaptApiPetToPet),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePet(id: string) {
  return useQuery({
    queryKey: petKeys.detail(id),
    queryFn: () => petService.get(id),
    select: adaptApiPetToPet,
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePetsByClient(clientId: string) {
  return useQuery({
    queryKey: petKeys.byClient(clientId),
    queryFn: () => petService.byClient(clientId),
    select: (data) => data.map(adaptApiPetToPet),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreatePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StorePetPayload) => petService.create(payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: petKeys.all() });
      if (vars.client_id)
        qc.invalidateQueries({ queryKey: petKeys.byClient(vars.client_id) });
    },
  });
}

export function useUpdatePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<StorePetPayload>;
    }) => petService.update(id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: petKeys.all() });
      qc.invalidateQueries({ queryKey: petKeys.detail(data.id) });
      if (data.client?.id)
        qc.invalidateQueries({ queryKey: petKeys.byClient(data.client.id) });
    },
  });
}

export function useDeletePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => petService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: petKeys.all() });
    },
  });
}
