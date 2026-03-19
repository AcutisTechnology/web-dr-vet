"use client";
import { useState } from "react";
import {
  UserCog, Plus, Pencil, Trash2, ShieldCheck,
  User, Stethoscope, Building2, Search, X, CheckCircle2, Ban,
  Mail, Clock, Settings, Shield, ChevronDown, ChevronUp, Send,
  Loader2,
} from "lucide-react";
import { useSessionStore } from "@/stores/session";
import { useUserRegistry } from "@/stores/user-registry";
import type { RegisteredUser } from "@/stores/user-registry";
import type { UserRole, AccountType, ModulePermissions, PermissionModule } from "@/types";
import { apiClient } from "@/lib/api-client";

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  vet: "Veterinário(a)",
  attendant: "Atendente / Recepcionista",
  financial: "Financeiro",
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-[#1B2A6B]/10 text-[#1B2A6B]",
  vet: "bg-[#2DC6C6]/10 text-[#0a8f8f]",
  attendant: "bg-amber-50 text-amber-700",
  financial: "bg-emerald-50 text-emerald-700",
};

const ACCOUNT_LABELS: Record<AccountType, string> = {
  clinic_owner: "Dono / Gestor",
  clinic_user: "Usuário da Clínica",
  autonomous: "Autônomo",
};

// Module permissions configuration
const MODULE_PERMISSIONS: { key: PermissionModule; label: string; description: string; icon: React.ElementType }[] = [
  {
    key: "financeiro",
    label: "Financeiro",
    description: "Acesso ao módulo financeiro, receitas e despesas",
    icon: Shield,
  },
  {
    key: "pdv",
    label: "PDV / Loja",
    description: "Acesso ao ponto de venda e registro de vendas",
    icon: Shield,
  },
  {
    key: "relatorios",
    label: "Relatórios",
    description: "Visualização de relatórios e exportações",
    icon: Shield,
  },
  {
    key: "usuarios",
    label: "Usuários",
    description: "Gerenciamento de usuários da equipe",
    icon: Shield,
  },
  {
    key: "configuracoes",
    label: "Configurações",
    description: "Acesso às configurações do sistema",
    icon: Shield,
  },
];

// Default permissions by role
function getDefaultPermissions(role: UserRole): ModulePermissions {
  switch (role) {
    case "admin":
      return { financeiro: true, pdv: true, relatorios: true, usuarios: true, configuracoes: true };
    case "vet":
      return { financeiro: false, pdv: false, relatorios: false, usuarios: false, configuracoes: false };
    case "attendant":
      return { financeiro: false, pdv: true, relatorios: false, usuarios: false, configuracoes: false };
    case "financial":
      return { financeiro: true, pdv: false, relatorios: true, usuarios: false, configuracoes: false };
    default:
      return {};
  }
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface UserFormState {
  name: string;
  email: string;
  role: UserRole;
  permissions: ModulePermissions;
}

const EMPTY_FORM: UserFormState = {
  name: "",
  email: "",
  role: "vet",
  permissions: getDefaultPermissions("vet"),
};

function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-lg" : "max-w-md"} my-4`}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function TextInput({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/30 focus:border-[#1B2A6B] transition-all ${className}`}
      {...props}
    />
  );
}

function SelectInput({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/30 focus:border-[#1B2A6B] transition-all bg-white"
      {...props}
    >
      {children}
    </select>
  );
}

// ─── Permissions Panel ────────────────────────────────────────────────────────
function PermissionsPanel({
  permissions,
  onChange,
}: {
  permissions: ModulePermissions;
  onChange: (p: ModulePermissions) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const toggle = (key: PermissionModule) => {
    onChange({ ...permissions, [key]: !permissions[key] });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-[#1B2A6B]/5 border border-[#1B2A6B]/10 text-sm font-semibold text-[#1B2A6B] hover:bg-[#1B2A6B]/8 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Permissões de acesso
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="space-y-2 pl-1">
          {MODULE_PERMISSIONS.map((mod) => (
            <label
              key={mod.key}
              className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="relative flex items-center mt-0.5">
                <input
                  type="checkbox"
                  checked={!!permissions[mod.key]}
                  onChange={() => toggle(mod.key)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                    permissions[mod.key]
                      ? "bg-[#1B2A6B] border-[#1B2A6B]"
                      : "bg-white border-2 border-gray-300"
                  }`}
                >
                  {permissions[mod.key] && (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${permissions[mod.key] ? "text-gray-900" : "text-gray-500"}`}>
                  {mod.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{mod.description}</p>
              </div>
            </label>
          ))}
          <p className="text-xs text-gray-400 pl-2">
            Clientes, Pets, Agenda e Internação são acessíveis por todos os usuários.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function UsuariosPage() {
  const { user: currentUser } = useSessionStore();
  const { users, addUser, updateUser: updateRegistryUser, findByEmail, removeUser } = useUserRegistry();

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | "delete" | "permissions" | null>(null);
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [permissionsForm, setPermissionsForm] = useState<ModulePermissions>({});

  // Only clinic_owner can manage users; autonomous has no team
  const isOwner = currentUser?.accountType === "clinic_owner";
  const clinicId = currentUser?.clinicId;

  // Filter: show only users belonging to the same clinic
  const clinicUsers = users.filter((u) =>
    clinicId ? u.clinicId === clinicId : u.id === currentUser?.id
  );

  const filtered = clinicUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModal("add");
  }

  function openEdit(u: RegisteredUser) {
    setSelectedUser(u);
    setForm({
      name: u.name,
      email: u.email,
      role: u.role,
      permissions: u.permissions ?? getDefaultPermissions(u.role),
    });
    setFormErrors({});
    setModal("edit");
  }

  function openDelete(u: RegisteredUser) {
    setSelectedUser(u);
    setModal("delete");
  }

  function openPermissions(u: RegisteredUser) {
    setSelectedUser(u);
    setPermissionsForm(u.permissions ?? getDefaultPermissions(u.role));
    setModal("permissions");
  }

  function closeModal() {
    setModal(null);
    setSelectedUser(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  }

  function validateForm(isEdit = false): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Nome é obrigatório.";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      errs.email = "E-mail inválido.";

    // Check duplicate email (exclude self when editing)
    if (!errs.email) {
      const existing = findByEmail(form.email);
      if (existing && (!isEdit || existing.id !== selectedUser?.id)) {
        errs.email = "Este e-mail já está em uso.";
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleAdd() {
    if (!validateForm(false)) return;

    setSendingInvite(true);
    try {
      // Call Laravel API: creates the user record + sends invite email in one step
      const { data } = await apiClient.post("/users/invite", {
        name: form.name,
        email: form.email,
        role: form.role,
        permissions: form.permissions,
      });

      // Sync to local Zustand registry so UI updates immediately
      const newUser: RegisteredUser = {
        id: data?.user?.id ?? crypto.randomUUID(),
        name: form.name,
        email: form.email,
        role: form.role,
        accountType: "clinic_user",
        clinicId: clinicId,
        clinicName: currentUser?.clinicName,
        active: false,
        createdAt: new Date().toISOString(),
        inviteStatus: "pending",
        inviteSentAt: new Date().toISOString(),
        permissions: form.permissions,
      };
      addUser(newUser);
      closeModal();
      showSuccess(`Usuário ${form.name} criado e convite enviado para ${form.email}!`);
    } catch {
      // If Laravel is unavailable, fall back to local only
      const newUser: RegisteredUser = {
        id: crypto.randomUUID(),
        name: form.name,
        email: form.email,
        role: form.role,
        accountType: "clinic_user",
        clinicId: clinicId,
        clinicName: currentUser?.clinicName,
        active: false,
        createdAt: new Date().toISOString(),
        inviteStatus: "pending",
        permissions: form.permissions,
      };
      addUser(newUser);
      closeModal();
      showSuccess(`Usuário ${form.name} criado. Falha ao enviar e-mail – tente reenviar o convite.`);
    } finally {
      setSendingInvite(false);
    }
  }

  function handleEdit() {
    if (!validateForm(true) || !selectedUser) return;
    const updated: RegisteredUser = {
      ...selectedUser,
      name: form.name,
      email: form.email,
      role: form.role,
      permissions: form.permissions,
    };
    // Update local registry immediately
    addUser(updated);
    // Also sync to Laravel in background
    apiClient.patch(`/users/${selectedUser.id}`, {
      name: form.name,
      email: form.email,
      role: form.role,
      permissions: form.permissions,
    }).catch(() => {/* silent fail — local state already updated */});
    closeModal();
    showSuccess(`Usuário ${form.name} atualizado.`);
  }

  function handleSavePermissions() {
    if (!selectedUser) return;
    updateRegistryUser(selectedUser.email, { permissions: permissionsForm });
    // Sync to Laravel in background
    apiClient.patch(`/users/${selectedUser.id}/permissions`, {
      permissions: permissionsForm,
    }).catch(() => {/* silent fail */});
    closeModal();
    showSuccess(`Permissões de ${selectedUser.name} atualizadas.`);
  }

  function handleToggleActive(u: RegisteredUser) {
    addUser({ ...u, active: !u.active });
    apiClient.patch(`/users/${u.id}/toggle-active`).catch(() => {/* silent fail */});
    showSuccess(u.active ? `${u.name} desativado.` : `${u.name} reativado.`);
  }

  async function handleResendInvite(u: RegisteredUser) {
    setSendingInvite(true);
    try {
      // Call Laravel API to resend the invite
      await apiClient.post(`/users/${u.id}/resend-invite`);
      updateRegistryUser(u.email, { inviteSentAt: new Date().toISOString() });
      showSuccess(`Convite reenviado para ${u.email}.`);
    } catch {
      showSuccess("Erro ao reenviar convite. Tente novamente.");
    } finally {
      setSendingInvite(false);
    }
  }

  function handleDelete() {
    if (!selectedUser) return;
    addUser({ ...selectedUser, active: false });
    closeModal();
    showSuccess(`${selectedUser.name} removido.`);
  }

  // ─── Access guard ────────────────────────────────────────────────────────────
  if (currentUser?.accountType === "autonomous") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#1B2A6B]/10 flex items-center justify-center">
          <UserCog className="w-8 h-8 text-[#1B2A6B]" />
        </div>
        <div>
          <p className="font-semibold text-gray-800">Conta Autônoma</p>
          <p className="text-sm text-gray-500 mt-1">
            Veterinários autônomos não possuem equipe vinculada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-[#1B2A6B]" />
            Usuários
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentUser?.clinicName
              ? `Equipe de ${currentUser.clinicName}`
              : "Gestão de usuários da clínica"}
          </p>
        </div>
        {isOwner && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white font-semibold px-5 py-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 text-sm"
          >
            <Plus className="w-4 h-4" /> Novo usuário
          </button>
        )}
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Non-owner notice */}
      {!isOwner && (
        <div className="flex items-center gap-3 bg-[#1B2A6B]/5 border border-[#1B2A6B]/20 rounded-xl px-4 py-3 text-sm text-[#1B2A6B]">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          Apenas o administrador da clínica pode adicionar ou editar usuários.
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/30 focus:border-[#1B2A6B] transition-all"
        />
      </div>

      {/* User list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <UserCog className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum usuário encontrado.</p>
          {isOwner && (
            <button
              onClick={openAdd}
              className="mt-4 text-sm text-[#1B2A6B] font-medium hover:underline"
            >
              + Adicionar o primeiro usuário
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((u) => {
            const isSelf = u.id === currentUser?.id || u.email === currentUser?.email;
            const AccountIcon =
              u.accountType === "autonomous"
                ? Stethoscope
                : u.accountType === "clinic_owner"
                ? Building2
                : User;
            const isPending = u.inviteStatus === "pending";
            return (
              <div
                key={u.id}
                className={`bg-white rounded-2xl border px-5 py-4 flex items-center gap-4 transition-all ${
                  u.active ? "border-gray-100 shadow-sm" : "border-gray-200 opacity-60"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                    u.active
                      ? "bg-gradient-to-br from-[#1B2A6B] to-[#2DC6C6]"
                      : "bg-gray-300"
                  }`}
                >
                  {u.name?.[0]?.toUpperCase() ?? "?"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {u.name}
                      {isSelf && (
                        <span className="ml-1.5 text-[10px] bg-[#2DC6C6]/15 text-[#0a8f8f] px-1.5 py-0.5 rounded-full font-medium">
                          você
                        </span>
                      )}
                    </p>
                    {!u.active && (
                      <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full font-medium">
                        Inativo
                      </span>
                    )}
                    {isPending && (
                      <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        Convite pendente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{u.email}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                      <AccountIcon className="w-3 h-3" />
                      {ACCOUNT_LABELS[u.accountType] ?? u.accountType}
                    </span>
                    {/* Show permission count */}
                    {u.permissions && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#1B2A6B] bg-[#1B2A6B]/5 px-1.5 py-0.5 rounded-full">
                        <Shield className="w-2.5 h-2.5" />
                        {Object.values(u.permissions).filter(Boolean).length} módulos
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions — only for clinic_owner and not on self */}
                {isOwner && !isSelf && (
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Permissions */}
                    <button
                      onClick={() => openPermissions(u)}
                      className="p-2 rounded-lg text-gray-400 hover:text-[#1B2A6B] hover:bg-[#1B2A6B]/5 transition-colors"
                      title="Gerenciar permissões"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    {/* Resend invite if pending */}
                    {isPending && (
                      <button
                        onClick={() => handleResendInvite(u)}
                        disabled={sendingInvite}
                        className="p-2 rounded-lg text-gray-400 hover:text-[#2DC6C6] hover:bg-[#2DC6C6]/5 transition-colors"
                        title="Reenviar convite"
                      >
                        {sendingInvite ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(u)}
                      className="p-2 rounded-lg text-gray-400 hover:text-[#1B2A6B] hover:bg-[#1B2A6B]/5 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`p-2 rounded-lg transition-colors ${
                        u.active
                          ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                          : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                      }`}
                      title={u.active ? "Desativar" : "Reativar"}
                    >
                      {u.active ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openDelete(u)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {clinicUsers.length > 0 && (
        <p className="text-xs text-gray-400">
          {clinicUsers.filter((u) => u.active).length} usuário(s) ativo(s) ·{" "}
          {clinicUsers.filter((u) => !u.active).length} inativo(s) ·{" "}
          {clinicUsers.filter((u) => u.inviteStatus === "pending").length} com convite pendente
        </p>
      )}

      {/* ── Modal: Add user ──────────────────────────────────────────────────── */}
      {modal === "add" && (
        <Modal title="Novo usuário" onClose={closeModal} wide>
          <div className="space-y-4">
            {/* Info box */}
            <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-3 border border-blue-100">
              <Mail className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">
                Um e-mail será enviado ao usuário para que ele crie sua própria senha. Nenhuma senha precisa ser informada.
              </p>
            </div>

            <Field label="Nome completo" error={formErrors.name}>
              <TextInput
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome do usuário"
              />
            </Field>
            <Field label="E-mail de acesso" error={formErrors.email}>
              <TextInput
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@clinica.com"
              />
            </Field>
            <Field label="Função" error={undefined}>
              <SelectInput
                value={form.role}
                onChange={(e) => {
                  const role = e.target.value as UserRole;
                  setForm((f) => ({
                    ...f,
                    role,
                    permissions: getDefaultPermissions(role),
                  }));
                }}
              >
                {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </SelectInput>
            </Field>

            {/* Permissions */}
            <PermissionsPanel
              permissions={form.permissions}
              onChange={(p) => setForm((f) => ({ ...f, permissions: p }))}
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={closeModal}
                className="px-5 py-2 rounded-full text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={sendingInvite}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white hover:shadow-md hover:scale-105 transition-all disabled:opacity-60 disabled:scale-100"
              >
                {sendingInvite ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Enviando convite...</>
                ) : (
                  <><Send className="w-4 h-4" />Criar e enviar convite</>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: Edit user ─────────────────────────────────────────────────── */}
      {modal === "edit" && selectedUser && (
        <Modal title={`Editar: ${selectedUser.name}`} onClose={closeModal} wide>
          <div className="space-y-4">
            <Field label="Nome completo" error={formErrors.name}>
              <TextInput
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </Field>
            <Field label="Função">
              <SelectInput
                value={form.role}
                onChange={(e) => {
                  const role = e.target.value as UserRole;
                  setForm((f) => ({
                    ...f,
                    role,
                    permissions: getDefaultPermissions(role),
                  }));
                }}
              >
                {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="E-mail de acesso" error={formErrors.email}>
              <TextInput
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </Field>

            {/* Permissions */}
            <PermissionsPanel
              permissions={form.permissions}
              onChange={(p) => setForm((f) => ({ ...f, permissions: p }))}
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={closeModal}
                className="px-5 py-2 rounded-full text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEdit}
                className="px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white hover:shadow-md hover:scale-105 transition-all"
              >
                Salvar alterações
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: Permissions ────────────────────────────────────────────────── */}
      {modal === "permissions" && selectedUser && (
        <Modal title={`Permissões: ${selectedUser.name}`} onClose={closeModal} wide>
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-[#1B2A6B]/5 rounded-xl p-3 border border-[#1B2A6B]/10">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1B2A6B] to-[#2DC6C6] flex items-center justify-center text-white text-sm font-bold shrink-0">
                {selectedUser.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{selectedUser.name}</p>
                <p className="text-xs text-gray-500">{ROLE_LABELS[selectedUser.role]} · {selectedUser.email}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Controle quais módulos este usuário pode acessar. Clientes, Pets, Agenda e Internação são sempre acessíveis.
            </p>

            <div className="space-y-2">
              {MODULE_PERMISSIONS.map((mod) => (
                <label
                  key={mod.key}
                  className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="relative flex items-center mt-0.5">
                    <input
                      type="checkbox"
                      checked={!!permissionsForm[mod.key]}
                      onChange={() =>
                        setPermissionsForm((p) => ({
                          ...p,
                          [mod.key]: !p[mod.key],
                        }))
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center transition-all border-2 ${
                        permissionsForm[mod.key]
                          ? "bg-[#1B2A6B] border-[#1B2A6B]"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {permissionsForm[mod.key] && (
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${permissionsForm[mod.key] ? "text-gray-900" : "text-gray-500"}`}>
                      {mod.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{mod.description}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={closeModal}
                className="px-5 py-2 rounded-full text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePermissions}
                className="px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white hover:shadow-md hover:scale-105 transition-all"
              >
                Salvar permissões
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: Delete confirmation ───────────────────────────────────────── */}
      {modal === "delete" && selectedUser && (
        <Modal title="Remover usuário" onClose={closeModal}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-red-50 rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B2A6B] to-[#2DC6C6] flex items-center justify-center text-white text-sm font-bold shrink-0">
                {selectedUser.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{selectedUser.name}</p>
                <p className="text-xs text-gray-500">{selectedUser.email}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              O usuário será desativado e não poderá mais acessar o sistema. Esta ação pode ser revertida posteriormente.
            </p>
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={closeModal}
                className="px-5 py-2 rounded-full text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 rounded-full text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
