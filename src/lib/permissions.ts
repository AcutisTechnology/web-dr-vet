import type { User } from "@/types";

type ModuleKey = "financeiro" | "pdv" | "usuarios" | "configuracoes" | "relatorios";

function hasModulePermission(user: User | null | undefined, module: ModuleKey): boolean {
  if (!user) return false;

  // Clinic owners and autonomous admins have full access.
  if (user.accountType === "clinic_owner" || user.accountType === "autonomous") {
    return true;
  }

  // Clinic users must rely on explicit module permissions.
  return Boolean(user.permissions?.[module]);
}

export function canAccessRoute(user: User | null | undefined, pathname: string): boolean {
  if (!user) return false;

  if (pathname.startsWith("/financeiro")) return hasModulePermission(user, "financeiro");
  if (pathname.startsWith("/pdv")) return hasModulePermission(user, "pdv");
  if (pathname.startsWith("/usuarios")) return hasModulePermission(user, "usuarios");

  // Billing should only be visible for clinic owner.
  if (pathname.startsWith("/assinatura")) return user.accountType === "clinic_owner";

  // All other routes remain accessible.
  return true;
}
