"use client";
import { useState } from "react";
import {
  UserCog, Plus, Pencil, Trash2, Eye, EyeOff, ShieldCheck,
  User, Stethoscope, Building2, Search, X, CheckCircle2, Ban,
} from "lucide-react";
import { useSessionStore } from "@/stores/session";
import { useUserRegistry } from "@/stores/user-registry";
import type { RegisteredUser } from "@/stores/user-registry";
import type { UserRole, AccountType } from "@/types";

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

// ─── Modal ────────────────────────────────────────────────────────────────────
interface UserFormState {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const EMPTY_FORM: UserFormState = { name: "", email: "", password: "", role: "vet" };

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
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

// ─── Main page ────────────────────────────────────────────────────────────────
export default function UsuariosPage() {
  const { user: currentUser } = useSessionStore();
  const { users, addUser, findByEmail } = useUserRegistry();

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | "delete" | null>(null);
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

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
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowPw(false);
    setModal("add");
  }

  function openEdit(u: RegisteredUser) {
    setSelectedUser(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role });
    setFormErrors({});
    setShowPw(false);
    setModal("edit");
  }

  function openDelete(u: RegisteredUser) {
    setSelectedUser(u);
    setModal("delete");
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
    if (!isEdit && form.password.length < 6)
      errs.password = "Mínimo 6 caracteres.";
    if (isEdit && form.password && form.password.length < 6)
      errs.password = "Mínimo 6 caracteres.";

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

  function handleAdd() {
    if (!validateForm(false)) return;
    const newUser: RegisteredUser = {
      id: crypto.randomUUID(),
      name: form.name,
      email: form.email,
      role: form.role,
      accountType: "clinic_user",
      clinicId: clinicId,
      clinicName: currentUser?.clinicName,
      active: true,
      createdAt: new Date().toISOString(),
      passwordHash: form.password,
    };
    addUser(newUser);
    closeModal();
    showSuccess(`Usuário ${form.name} criado com sucesso!`);
  }

  function handleEdit() {
    if (!validateForm(true) || !selectedUser) return;
    const updated: RegisteredUser = {
      ...selectedUser,
      name: form.name,
      email: form.email,
      role: form.role,
      passwordHash: form.password || selectedUser.passwordHash,
    };
    addUser(updated); // addUser replaces by email
    closeModal();
    showSuccess(`Usuário ${form.name} atualizado.`);
  }

  function handleToggleActive(u: RegisteredUser) {
    addUser({ ...u, active: !u.active });
    showSuccess(u.active ? `${u.name} desativado.` : `${u.name} reativado.`);
  }

  function handleDelete() {
    if (!selectedUser) return;
    // Mark as inactive (soft delete) — we never hard-delete session-linked users
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
                  </div>
                </div>

                {/* Actions — only for clinic_owner and not on self */}
                {isOwner && !isSelf && (
                  <div className="flex items-center gap-1 shrink-0">
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
          {clinicUsers.filter((u) => !u.active).length} inativo(s)
        </p>
      )}

      {/* ── Modal: Add user ──────────────────────────────────────────────────── */}
      {modal === "add" && (
        <Modal title="Novo usuário" onClose={closeModal}>
          <div className="space-y-4">
            <Field label="Nome completo" error={formErrors.name}>
              <TextInput
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome do usuário"
              />
            </Field>
            <Field label="Função" error={undefined}>
              <SelectInput
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
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
                placeholder="email@clinica.com"
              />
            </Field>
            <Field label="Senha" error={formErrors.password}>
              <div className="relative">
                <TextInput
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={closeModal}
                className="px-5 py-2 rounded-full text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                className="px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white hover:shadow-md hover:scale-105 transition-all"
              >
                Criar usuário
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: Edit user ─────────────────────────────────────────────────── */}
      {modal === "edit" && selectedUser && (
        <Modal title={`Editar: ${selectedUser.name}`} onClose={closeModal}>
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
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
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
            <Field label="Nova senha (deixe em branco para manter)" error={formErrors.password}>
              <div className="relative">
                <TextInput
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
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
