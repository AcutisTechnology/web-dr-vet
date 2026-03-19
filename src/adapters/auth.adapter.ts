import type { User, AccountType, UserRole, ModulePermissions } from "@/types";
import type { ApiUser } from "@/types/api";

export function adaptApiUserToUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role as UserRole,
    accountType: apiUser.account_type as AccountType,
    clinicId: apiUser.clinic_id ?? undefined,
    clinicName: apiUser.clinic?.name ?? undefined,
    avatar: apiUser.avatar ?? undefined,
    logoUrl: apiUser.logo_url ?? undefined,
    permissions: (apiUser.permissions ?? undefined) as ModulePermissions | undefined,
    active: apiUser.active,
    createdAt: apiUser.created_at,
  };
}
