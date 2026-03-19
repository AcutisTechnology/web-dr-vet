"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserCog, Plus, Pencil, Trash2, ShieldCheck,
  User, Stethoscope, Building2, Search, X, CheckCircle2, Ban,
  Mail, Clock, Settings, Shield, ChevronDown, ChevronUp, Send,
  Loader2, RefreshCw, AlertCircle,
} from "lucide-react";
import { useSessionStore } from "@/stores/session";
import { apiClient } from "@/lib/api-client";
import type { UserRole, AccountType, ModulePermissions, PermissionModule } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accountType: AccountType;
  clinicId?: string;
  clinicName?: string;
  active: boolean;
  createdAt: string;
  permissions?: ModulePermissions;
}

interface PendingInvite {
  token: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: ModulePermissions;
  sentAt: string;
  expiresAt: string;
}

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

const MODULE_PERMISSIONS: { key: PermissionModule; label: string; description: string }[] = [
  { key: "financeiro",    label: "Financeiro",    description: "Acesso ao módulo financeiro, receitas e despesas" },
  { key: "pdv",          label: "PDV / Loja",    description: "Acesso ao ponto de venda e registro de vendas" },
  { key: "relatorios",   label: "Relatórios",    description: "Visualização de relatórios e exportações" },
  { key: "usuarios",     label: "Usuários",      description: "Gerenciamento de usuários da equipe" },
  { key: "configuracoes",label: "Configurações", description: "Acesso às configurações do sistema" },
];

function getDefaultPermissions(role: UserRole): ModulePermissions {
  switch (role) {
    case "admin":      return { financeiro: true,  pdv: true,  relatorios: true,  usuarios: true,  configuracoes: true };
    case "vet":        return { financeiro: false, pdv: false, relatorios: false, usuarios: false, configuracoes: false };
    case "attendant":  return { financeiro: false, pdv: true,  relatorios: false, usuarios: false, configuracoes: false };
    case "financial":  return { financeiro: true,  pdv: false, relatorios: true,  usuarios: false, configuracoes: false };
    default:           return {};
  }
}

// ─── UI primitives ────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, wide = false }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-lg" : "max-w-md"} my-4`}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
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

function PermissionsPanel({ permissions, onChange }: {
  permissions: ModulePermissions;
  onChange: (p: ModulePermissions) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-[#1B2A6B]/5 border border-[#1B2A6B]/10 text-sm font-semibold text-[#1B2A6B] hover:bg-[#1B2A6B]/8 transition-colors"
      >
        <span className="flex items-center gap-2"><Settings className="w-4 h-4" />Permissões de acesso</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expanded && (
        <div className="space-y-2 pl-1">
          {MODULE_PERMISSIONS.map(mod => (
            <label key={mod.key} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="relative flex items-center mt-0.5">
                <input type="checkbox" checked={!!permissions[mod.key]} onChange={() => onChange({ ...permissions, [mod.key]: !permissions[mod.key] })} className="sr-only" />
                <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${permissions[mod.key] ? "bg-[#1B2A6B] border-[#1B2A6B]" : "bg-white border-2 border-gray-300"}`}>
                  {permissions[mod.key] && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${permissions[mod.key] ? "text-gray-900" : "text-gray-500"}`}>{mod.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{mod.description}</p>
              </div>
            </label>
          ))}
          <p className="text-xs text-gray-400 pl-2">Clientes, Pets, Agenda e Internação são acessíveis por todos.</p>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface InviteForm {
  name: string;
  email: string;
  role: UserRole;
  permissions: ModulePermissions;
}

const EMPTY_INVITE: InviteForm = {
  name: "",
  email: "",
  role: "vet",
  permissions: getDefaultPermissions("vet"),
};

export default function UsuariosPage() {
  const { user: currentUser } = useSessionStore();

  const isOwner = currentUser?.accountType === "clinic_owner";

  // ── State ──────────────────────────────────────────────────────────────────
  const [users, setUsers]           = useState<ApiUser[]>([]);
  const [invites, setInvites]       = useState<PendingInvite[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [busy, setBusy]             = useState(false);

  const [modal, setModal] = useState<"invite" | "edit" | "delete" | "permissions" | null>(null);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [inviteForm, setInviteForm]     = useState<InviteForm>(EMPTY_INVITE);
  const [editForm, setEditForm]         = useState<Partial<InviteForm>>({});
  const [permForm, setPermForm]         = useState<ModulePermissions>({});
  const [formErrors, setFormErrors]     = useState<Record<string, string>>({});

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, invitesRes] = await Promise.all([
        apiClient.get<ApiUser[]>("/users"),
        isOwner ? apiClient.get<PendingInvite[]>("/invites") : Promise.resolve({ data: [] }),
      ]);
      setUsers(usersRes.data);
      setInvites((invitesRes as { data: PendingInvite[] }).data);
    } catch {
      setError("Não foi possível carregar os usuários. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [isOwner]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  }

  function closeModal() {
    setModal(null);
    setSelectedUser(null);
    setInviteForm(EMPTY_INVITE);
    setEditForm({});
    setPermForm({});
    setFormErrors({});
  }

  // ── Invite ─────────────────────────────────────────────────────────────────
  async function handleSendInvite() {
    const errs: Record<string, string> = {};
    if (!inviteForm.name.trim())                              errs.name  = "Nome é obrigatório.";
    if (!inviteForm.email.trim() || !/\S+@\S+\.\S+/.test(inviteForm.email)) errs.email = "E-mail inválido.";
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await apiClient.post("/invites", {
        name:        inviteForm.name,
        email:       inviteForm.email,
        role:        inviteForm.role,
        permissions: inviteForm.permissions,
      });
      closeModal();
      showSuccess(`Convite enviado para ${inviteForm.email}!`);
      fetchAll();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setFormErrors({ email: msg ?? "Erro ao enviar convite. Tente novamente." });
    } finally {
      setBusy(false);
    }
  }

  // ── Resend invite ──────────────────────────────────────────────────────────
  async function handleResend(invite: PendingInvite) {
    setBusy(true);
    try {
      await apiClient.post(`/invites/${invite.token}/resend`);
      showSuccess(`Convite reenviado para ${invite.email}.`);
      fetchAll();
    } catch {
      showSuccess("Erro ao reenviar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  // ── Edit user ──────────────────────────────────────────────────────────────
  function openEdit(u: ApiUser) {
    setSelectedUser(u);
    setEditForm({ name: u.name, role: u.role, permissions: u.permissions ?? getDefaultPermissions(u.role) });
    setFormErrors({});
    setModal("edit");
  }

  async function handleEdit() {
    if (!selectedUser) return;
    const errs: Record<string, string> = {};
    if (!editForm.name?.trim()) errs.name = "Nome é obrigatório.";
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await apiClient.patch(`/users/${selectedUser.id}`, {
        name:        editForm.name,
        role:        editForm.role,
        permissions: editForm.permissions,
      });
      closeModal();
      showSuccess("Usuário atualizado.");
      fetchAll();
    } catch {
      setFormErrors({ name: "Erro ao salvar. Tente novamente." });
    } finally {
      setBusy(false);
    }
  }

  // ── Permissions ────────────────────────────────────────────────────────────
  function openPermissions(u: ApiUser) {
    setSelectedUser(u);
    setPermForm(u.permissions ?? getDefaultPermissions(u.role));
    setModal("permissions");
  }

  async function handleSavePermissions() {
    if (!selectedUser) return;
    setBusy(true);
    try {
      await apiClient.patch(`/users/${selectedUser.id}/permissions`, { permissions: permForm });
      closeModal();
      showSuccess(`Permissões de ${selectedUser.name} atualizadas.`);
      fetchAll();
    } catch {
      showSuccess("Erro ao salvar permissões.");
    } finally {
      setBusy(false);
    }
  }

  // ── Toggle active ──────────────────────────────────────────────────────────
  async function handleToggleActive(u: ApiUser) {
    setBusy(true);
    try {
      await apiClient.patch(`/users/${u.id}/toggle-active`);
      showSuccess(u.active ? `${u.name} desativado.` : `${u.name} reativado.`);
      fetchAll();
    } catch {
      showSuccess("Erro ao alterar status.");
    } finally {
      setBusy(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!selectedUser) return;
    setBusy(true);
    try {
      await apiClient.delete(`/users/${selectedUser.id}`);
      closeModal();
      showSuccess(`${selectedUser.name} removido.`);
      fetchAll();
    } catch {
      showSuccess("Erro ao remover usuário.");
    } finally {
      setBusy(false);
    }
  }

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredInvites = invites.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.email.toLowerCase().includes(search.toLowerCase())
  );

  // ── Guard: autônomo ────────────────────────────────────────────────────────
  if (currentUser?.accountType === "autonomous") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#1B2A6B]/10 flex items-center justify-center">
          <UserCog className="w-8 h-8 text-[#1B2A6B]" />
        </div>
        <div>
          <p className="font-semibold text-gray-800">Conta Autônoma</p>
          <p className="text-sm text-gray-500 mt-1">Veterinários autônomos não possuem equipe vinculada.</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
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
            {currentUser?.clinicName ? `Equipe de ${currentUser.clinicName}` : "Gestão de usuários da clínica"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            disabled={loading}
            className="p-2.5 rounded-full border border-gray-200 text-gray-400 hover:text-[#1B2A6B] hover:border-[#1B2A6B]/30 transition-all"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {isOwner && (
            <button
              onClick={() => { setInviteForm(EMPTY_INVITE); setFormErrors({}); setModal("invite"); }}
              className="flex items-center gap-2 bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white font-semibold px-5 py-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 text-sm"
            >
              <Plus className="w-4 h-4" /> Convidar usuário
            </button>
          )}
        </div>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />{successMsg}
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
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/30 focus:border-[#1B2A6B] transition-all"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Carregando usuários...</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-4 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button onClick={fetchAll} className="font-semibold underline">Tentar novamente</button>
        </div>
      )}

      {/* ── Convites pendentes ──────────────────────────────────────────────── */}
      {!loading && !error && filteredInvites.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Convites pendentes ({filteredInvites.length})
          </h2>
          <div className="grid gap-2">
            {filteredInvites.map(invite => (
              <div key={invite.token} className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 text-sm font-bold shrink-0">
                  {invite.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{invite.name}</p>
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />Convite pendente
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{invite.email}</p>
                  <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 ${ROLE_COLORS[invite.role] ?? "bg-gray-100 text-gray-600"}`}>
                    {ROLE_LABELS[invite.role] ?? invite.role}
                  </span>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleResend(invite)}
                    disabled={busy}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                    title="Reenviar convite"
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Reenviar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Usuários ativos ─────────────────────────────────────────────────── */}
      {!loading && !error && (
        <div className="space-y-2">
          {filteredInvites.length > 0 && (
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Usuários ({filteredUsers.length})
            </h2>
          )}

          {filteredUsers.length === 0 && filteredInvites.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <UserCog className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhum usuário encontrado.</p>
              {isOwner && (
                <button onClick={() => { setInviteForm(EMPTY_INVITE); setModal("invite"); }} className="mt-4 text-sm text-[#1B2A6B] font-medium hover:underline">
                  + Convidar o primeiro usuário
                </button>
              )}
            </div>
          )}

          <div className="grid gap-3">
            {filteredUsers.map(u => {
              const isSelf = u.id === currentUser?.id || u.email === currentUser?.email;
              const AccountIcon = u.accountType === "autonomous" ? Stethoscope : u.accountType === "clinic_owner" ? Building2 : User;
              return (
                <div
                  key={u.id}
                  className={`bg-white rounded-2xl border px-5 py-4 flex items-center gap-4 transition-all ${u.active ? "border-gray-100 shadow-sm" : "border-gray-200 opacity-60"}`}
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${u.active ? "bg-gradient-to-br from-[#1B2A6B] to-[#2DC6C6]" : "bg-gray-300"}`}>
                    {u.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {u.name}
                        {isSelf && (
                          <span className="ml-1.5 text-[10px] bg-[#2DC6C6]/15 text-[#0a8f8f] px-1.5 py-0.5 rounded-full font-medium">você</span>
                        )}
                      </p>
                      {!u.active && (
                        <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full font-medium">Inativo</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{u.email}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                        <AccountIcon className="w-3 h-3" />
                        {ACCOUNT_LABELS[u.accountType] ?? u.accountType}
                      </span>
                      {u.permissions && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#1B2A6B] bg-[#1B2A6B]/5 px-1.5 py-0.5 rounded-full">
                          <Shield className="w-2.5 h-2.5" />
                          {Object.values(u.permissions).filter(Boolean).length} módulos
                        </span>
                      )}
                    </div>
                  </div>
                  {isOwner && !isSelf && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openPermissions(u)} className="p-2 rounded-lg text-gray-400 hover:text-[#1B2A6B] hover:bg-[#1B2A6B]/5 transition-colors" title="Permissões">
                        <Settings className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(u)} className="p-2 rounded-lg text-gray-400 hover:text-[#1B2A6B] hover:bg-[#1B2A6B]/5 transition-colors" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={busy}
                        className={`p-2 rounded-lg transition-colors ${u.active ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"}`}
                        title={u.active ? "Desativar" : "Reativar"}
                      >
                        {u.active ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setSelectedUser(u); setModal("delete"); }} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Remover">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      {!loading && !error && users.length > 0 && (
        <p className="text-xs text-gray-400">
          {users.filter(u => u.active).length} ativo(s) · {users.filter(u => !u.active).length} inativo(s) · {invites.length} convite(s) pendente(s)
        </p>
      )}

      {/* ── Modal: Convidar usuário ──────────────────────────────────────────── */}
      {modal === "invite" && (
        <Modal title="Convidar usuário" onClose={closeModal} wide>
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-3 border border-blue-100">
              <Mail className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">
                Um e-mail será enviado com um link para o usuário criar a própria senha e acessar o sistema.
              </p>
            </div>
            <Field label="Nome completo" error={formErrors.name}>
              <TextInput
                value={inviteForm.name}
                onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nome do usuário"
              />
            </Field>
            <Field label="E-mail" error={formErrors.email}>
              <TextInput
                type="email"
                value={inviteForm.email}
                onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@clinica.com"
              />
            </Field>
            <Field label="Função">
              <SelectInput
                value={inviteForm.role}
                onChange={e => {
                  const role = e.target.value as UserRole;
                  setInviteForm(f => ({ ...f, role, permissions: getDefaultPermissions(role) }));
                }}
              >
                {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </SelectInput>
            </Field>
            <PermissionsPanel permissions={inviteForm.permissions} onChange={p => setInviteForm(f => ({ ...f, permissions: p }))} />
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={closeModal} className="px-5 py-2 rounded-full text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
              <button
                onClick={handleSendInvite}
                disabled={busy}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white hover:shadow-md hover:scale-105 transition-all disabled:opacity-60 disabled:scale-100"
              >
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</> : <><Send className="w-4 h-4" />Enviar convite</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: Editar usuário ────────────────────────────────────────────── */}
      {modal === "edit" && selectedUser && (
        <Modal title={`Editar: ${selectedUser.name}`} onClose={closeModal} wide>
          <div className="space-y-4">
            <Field label="Nome completo" error={formErrors.name}>
              <TextInput value={editForm.name ?? ""} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Função">
              <SelectInput
                value={editForm.role ?? "vet"}
                onChange={e => {
                  const role = e.target.value as UserRole;
                  setEditForm(f => ({ ...f, role, permissions: getDefaultPermissions(role) }));
                }}
              >
                {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </SelectInput>
            </Field>
            <PermissionsPanel
              permissions={editForm.permissions ?? {}}
              onChange={p => setEditForm(f => ({ ...f, permissions: p }))}
            />
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={closeModal} className="px-5 py-2 rounded-full text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
              <button onClick={handleEdit} disabled={busy} className="px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white hover:shadow-md hover:scale-105 transition-all disabled:opacity-60">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar alterações"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: Permissões ────────────────────────────────────────────────── */}
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
            <div className="space-y-2">
              {MODULE_PERMISSIONS.map(mod => (
                <label key={mod.key} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="relative flex items-center mt-0.5">
                    <input type="checkbox" checked={!!permForm[mod.key]} onChange={() => setPermForm(p => ({ ...p, [mod.key]: !p[mod.key] }))} className="sr-only" />
                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-all border-2 ${permForm[mod.key] ? "bg-[#1B2A6B] border-[#1B2A6B]" : "bg-white border-gray-300"}`}>
                      {permForm[mod.key] && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${permForm[mod.key] ? "text-gray-900" : "text-gray-500"}`}>{mod.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{mod.description}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={closeModal} className="px-5 py-2 rounded-full text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
              <button onClick={handleSavePermissions} disabled={busy} className="px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white hover:shadow-md hover:scale-105 transition-all disabled:opacity-60">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar permissões"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: Confirmar remoção ─────────────────────────────────────────── */}
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
            <p className="text-sm text-gray-600">O usuário será removido e não poderá mais acessar o sistema.</p>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={closeModal} className="px-5 py-2 rounded-full text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
              <button onClick={handleDelete} disabled={busy} className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" />Remover</>}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
