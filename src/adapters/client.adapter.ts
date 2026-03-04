import type { Client } from "@/types";
import type { ApiClient } from "@/types/api";

export function adaptApiClientToClient(c: ApiClient): Client {
  return {
    id: c.id,
    name: c.name,
    email: c.email ?? undefined,
    phone: c.phone,
    cpf: c.cpf ?? undefined,
    active: c.active,
    address: c.address ?? undefined,
    notes: c.notes ?? undefined,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}
