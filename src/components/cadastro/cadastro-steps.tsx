"use client";
import { Building2, ClipboardList, Stethoscope, Check, Users, User, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Field, TextInput, SelectInput, PasswordInput } from "./cadastro-ui";
import type { RegFormData, AdditionalUser, ClinicType, UserRole } from "./cadastro-types";
import { ROLE_LABELS, BR_STATES } from "./cadastro-types";

// ─── Step 0: Tipo de uso ──────────────────────────────────────────────────────
export function StepTipo({
  form,
  errors,
  setField,
}: {
  form: RegFormData;
  errors: Record<string, string>;
  setField: <K extends keyof RegFormData>(k: K, v: RegFormData[K]) => void;
}) {
  const options: { value: ClinicType; icon: React.ElementType; title: string; desc: string }[] = [
    { value: "clinic", icon: Building2, title: "Clínica Veterinária", desc: "Estabelecimento com múltiplos veterinários, atendentes e equipe." },
    { value: "hospital", icon: ClipboardList, title: "Hospital Veterinário", desc: "Hospital com internação, UTI e equipe ampla." },
    { value: "autonomous", icon: Stethoscope, title: "Veterinário Autônomo", desc: "Trabalho solo ou consultório individual sem equipe fixa." },
  ];

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900">Como você vai usar o DrVet?</h2>
        <p className="text-gray-500 mt-1 text-sm">Isso nos ajuda a configurar sua conta do jeito certo.</p>
      </div>
      {errors.clinicType && <p className="text-xs text-red-500">{errors.clinicType}</p>}
      {options.map(({ value, icon: Icon, title, desc }) => (
        <button
          key={value}
          type="button"
          onClick={() => setField("clinicType", value)}
          className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
            form.clinicType === value
              ? "border-[#1B2A6B] bg-[#1B2A6B]/5 shadow-md"
              : "border-gray-200 hover:border-[#2DC6C6] hover:bg-gray-50"
          }`}
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${form.clinicType === value ? "bg-gradient-to-br from-[#1B2A6B] to-[#2DC6C6] text-white" : "bg-gray-100 text-gray-500"}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className={`font-semibold text-sm ${form.clinicType === value ? "text-[#1B2A6B]" : "text-gray-800"}`}>{title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${form.clinicType === value ? "border-[#1B2A6B] bg-[#1B2A6B]" : "border-gray-300"}`}>
            {form.clinicType === value && <Check className="w-3 h-3 text-white" />}
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Step 1: Dados da clínica / veterinário ───────────────────────────────────
export function StepDados({
  form,
  errors,
  setField,
}: {
  form: RegFormData;
  errors: Record<string, string>;
  setField: <K extends keyof RegFormData>(k: K, v: RegFormData[K]) => void;
}) {
  const isAuto = form.clinicType === "autonomous";
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900">{isAuto ? "Seus dados profissionais" : "Dados da sua clínica"}</h2>
        <p className="text-gray-500 mt-1 text-sm">{isAuto ? "Algumas informações básicas sobre você." : "Preencha as informações do seu estabelecimento."}</p>
      </div>
      {!isAuto && (
        <Field label="Nome da clínica / hospital" error={errors.clinicName}>
          <TextInput value={form.clinicName} onChange={(e) => setField("clinicName", e.target.value)} placeholder="Ex: Clínica VetCare" />
        </Field>
      )}
      <Field label={isAuto ? "Seu nome completo" : "Nome do responsável"} error={errors.ownerName}>
        <TextInput value={form.ownerName} onChange={(e) => setField("ownerName", e.target.value)} placeholder="Nome completo" />
      </Field>
      <Field label="Telefone / WhatsApp" error={errors.phone}>
        <TextInput type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="(00) 00000-0000" />
      </Field>
      {!isAuto && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cidade" error={errors.city}>
            <TextInput value={form.city} onChange={(e) => setField("city", e.target.value)} placeholder="Sua cidade" />
          </Field>
          <Field label="Estado" error={errors.state}>
            <SelectInput value={form.state} onChange={(e) => setField("state", e.target.value)}>
              <option value="">Selecione</option>
              {BR_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </SelectInput>
          </Field>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Conta de acesso ──────────────────────────────────────────────────
export function StepConta({
  form,
  errors,
  setField,
}: {
  form: RegFormData;
  errors: Record<string, string>;
  setField: <K extends keyof RegFormData>(k: K, v: RegFormData[K]) => void;
}) {
  const isAuto = form.clinicType === "autonomous";
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900">Crie seu acesso</h2>
        <p className="text-gray-500 mt-1 text-sm">Dados de login do {isAuto ? "seu usuário" : "administrador da conta"}.</p>
      </div>
      <Field label="E-mail" error={errors.ownerEmail}>
        <TextInput type="email" value={form.ownerEmail} onChange={(e) => setField("ownerEmail", e.target.value)} placeholder="seuemail@email.com" />
      </Field>
      <Field label="Senha" error={errors.ownerPassword}>
        <PasswordInput value={form.ownerPassword} onChange={(v) => setField("ownerPassword", v)} />
      </Field>
      <Field label="Confirmar senha" error={errors.ownerConfirmPassword}>
        <PasswordInput value={form.ownerConfirmPassword} onChange={(v) => setField("ownerConfirmPassword", v)} placeholder="Repita a senha" />
      </Field>
      <div className="bg-[#1B2A6B]/5 rounded-xl p-4 border border-[#2DC6C6]/30 text-sm">
        <p className="font-semibold text-[#1B2A6B] mb-1">{isAuto ? "Conta autônoma" : "Conta administrador"}</p>
        <p className="text-gray-500">{isAuto ? "Acesso completo a todos os módulos como veterinário autônomo." : "Como administrador você gerencia toda a equipe, módulos e configurações."}</p>
      </div>
    </div>
  );
}

// ─── Step 3: Equipe (clinic/hospital only) ────────────────────────────────────
export function StepEquipe({
  form,
  errors,
  setField,
}: {
  form: RegFormData;
  errors: Record<string, string>;
  setField: <K extends keyof RegFormData>(k: K, v: RegFormData[K]) => void;
}) {
  function addUser() {
    setField("additionalUsers", [
      ...form.additionalUsers,
      { id: crypto.randomUUID(), name: "", email: "", password: "", role: "vet" },
    ]);
  }

  function removeUser(id: string) {
    setField("additionalUsers", form.additionalUsers.filter((u) => u.id !== id));
  }

  function updateUser(id: string, field: keyof AdditionalUser, value: string) {
    setField("additionalUsers", form.additionalUsers.map((u) => u.id === id ? { ...u, [field]: value } : u));
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900">Sua equipe</h2>
        <p className="text-gray-500 mt-1 text-sm">Cadastre os membros agora ou depois pelo painel.</p>
      </div>
      <p className="text-sm font-medium text-gray-700">Deseja cadastrar usuários da equipe agora?</p>
      {errors.hasAdditionalUsers && <p className="text-xs text-red-500">{errors.hasAdditionalUsers}</p>}

      <div className="grid grid-cols-2 gap-3">
        {([
          { val: true, label: "Sim, vou adicionar", Icon: Users },
          { val: false, label: "Não, farei depois", Icon: User },
        ] as { val: boolean; label: string; Icon: React.ElementType }[]).map(({ val, label, Icon }) => (
          <button
            key={String(val)}
            type="button"
            onClick={() => { setField("hasAdditionalUsers", val); if (!val) setField("additionalUsers", []); }}
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-sm font-medium ${
              form.hasAdditionalUsers === val
                ? "border-[#1B2A6B] bg-[#1B2A6B]/5 text-[#1B2A6B]"
                : "border-gray-200 text-gray-600 hover:border-[#2DC6C6]"
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {form.hasAdditionalUsers && (
        <div className="space-y-4 mt-2">
          {form.additionalUsers.map((u, i) => (
            <div key={u.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1B2A6B] uppercase tracking-wider">Usuário {i + 1}</span>
                <button type="button" onClick={() => removeUser(u.id)} className="text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome completo" error={errors[`u${i}_name`]}>
                  <TextInput value={u.name} onChange={(e) => updateUser(u.id, "name", e.target.value)} placeholder="Nome" />
                </Field>
                <Field label="Função">
                  <SelectInput value={u.role} onChange={(e) => updateUser(u.id, "role", e.target.value)}>
                    {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </SelectInput>
                </Field>
              </div>
              <Field label="E-mail de acesso" error={errors[`u${i}_email`]}>
                <TextInput type="email" value={u.email} onChange={(e) => updateUser(u.id, "email", e.target.value)} placeholder="email@clinica.com" />
              </Field>
              <Field label="Senha temporária" error={errors[`u${i}_pw`]}>
                <PasswordInput value={u.password} onChange={(v) => updateUser(u.id, "password", v)} />
              </Field>
            </div>
          ))}
          <button type="button" onClick={addUser}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-[#2DC6C6] text-[#1B2A6B] text-sm font-semibold hover:bg-[#2DC6C6]/5 transition-all">
            <Plus className="w-4 h-4" /> Adicionar usuário
          </button>
          {form.additionalUsers.length === 0 && (
            <p className="text-xs text-gray-400 text-center">Clique acima para adicionar o primeiro usuário.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Last step: Confirmar ─────────────────────────────────────────────────────
export function StepConfirmar({ form }: { form: RegFormData }) {
  const isAuto = form.clinicType === "autonomous";
  const typeLabel = form.clinicType === "clinic" ? "Clínica Veterinária" : form.clinicType === "hospital" ? "Hospital Veterinário" : "Veterinário Autônomo";

  return (
    <div className="space-y-5">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900">Revise seus dados</h2>
        <p className="text-gray-500 mt-1 text-sm">Confirme antes de criar sua conta.</p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-3 text-sm">
        <SummaryRow label="Tipo de conta" value={typeLabel} />
        {!isAuto && <SummaryRow label="Nome da clínica" value={form.clinicName} />}
        <SummaryRow label="Responsável" value={form.ownerName} />
        <SummaryRow label="E-mail de acesso" value={form.ownerEmail} />
        {!isAuto && form.city && <SummaryRow label="Localização" value={`${form.city} – ${form.state}`} />}
        {!isAuto && (
          <SummaryRow
            label="Usuários da equipe"
            value={form.hasAdditionalUsers && form.additionalUsers.length > 0
              ? `${form.additionalUsers.length} cadastrado(s)`
              : "Nenhum (adicionar depois)"}
          />
        )}
      </div>

      {!isAuto && form.hasAdditionalUsers && form.additionalUsers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Equipe cadastrada</p>
          {form.additionalUsers.map((u) => (
            <div key={u.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1B2A6B] to-[#2DC6C6] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {u.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{u.name || "–"}</p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>
              <span className="text-xs bg-[#1B2A6B]/10 text-[#1B2A6B] px-2 py-0.5 rounded-full font-medium shrink-0">
                {ROLE_LABELS[u.role]}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-r from-[#1B2A6B]/5 to-[#2DC6C6]/10 rounded-xl p-4 border border-[#2DC6C6]/30">
        <p className="font-semibold text-[#1B2A6B] flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-[#2DC6C6]" />
          Plano DrVet Completo — R$ 49,90/mês
        </p>
        <p className="text-gray-500 mt-1 text-xs">14 dias grátis · Sem cartão de crédito · Cancele quando quiser.</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="font-semibold text-gray-800 text-right">{value}</span>
    </div>
  );
}
