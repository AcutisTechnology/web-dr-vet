"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { StepBar } from "@/components/cadastro/cadastro-ui";
import {
  StepTipo,
  StepDados,
  StepConta,
  StepEquipe,
  StepConfirmar,
} from "@/components/cadastro/cadastro-steps";
import { INITIAL_FORM } from "@/components/cadastro/cadastro-types";
import type { RegFormData } from "@/components/cadastro/cadastro-types";
import { useUserRegistry } from "@/stores/user-registry";
import type { User } from "@/types";

const STEPS_CLINIC = [
  "Tipo de uso",
  "Dados da clínica",
  "Sua conta",
  "Equipe",
  "Confirmar",
];
const STEPS_AUTO = ["Tipo de uso", "Seus dados", "Sua conta", "Confirmar"];

export default function CadastroPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<RegFormData>(INITIAL_FORM);

  const { addUser } = useUserRegistry();
  const isAuto = form.clinicType === "autonomous";
  const steps = isAuto ? STEPS_AUTO : STEPS_CLINIC;
  const totalSteps = steps.length;
  const isLastStep = step === totalSteps - 1;

  function setField<K extends keyof RegFormData>(
    key: K,
    value: RegFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const n = { ...prev };
      delete n[key as string];
      return n;
    });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (step === 0 && !form.clinicType) {
      errs.clinicType = "Selecione uma opção.";
    }

    if (step === 1) {
      if (!isAuto && !form.clinicName.trim())
        errs.clinicName = "Nome da clínica é obrigatório.";
      if (!form.ownerName.trim()) errs.ownerName = "Nome é obrigatório.";
      if (!form.phone.trim()) errs.phone = "Telefone é obrigatório.";
      if (!isAuto && !form.city.trim()) errs.city = "Cidade é obrigatória.";
      if (!isAuto && !form.state) errs.state = "Estado é obrigatório.";
    }

    if (step === 2) {
      if (!form.ownerEmail.trim() || !/\S+@\S+\.\S+/.test(form.ownerEmail))
        errs.ownerEmail = "E-mail inválido.";
      if (form.ownerPassword.length < 6)
        errs.ownerPassword = "Mínimo 6 caracteres.";
      if (form.ownerPassword !== form.ownerConfirmPassword)
        errs.ownerConfirmPassword = "Senhas não coincidem.";
    }

    if (!isAuto && step === 3) {
      if (form.hasAdditionalUsers === null)
        errs.hasAdditionalUsers = "Selecione uma opção.";
      if (form.hasAdditionalUsers) {
        form.additionalUsers.forEach((u, i) => {
          if (!u.name.trim()) errs[`u${i}_name`] = "Nome obrigatório.";
          if (!u.email.trim() || !/\S+@\S+\.\S+/.test(u.email))
            errs[`u${i}_email`] = "E-mail inválido.";
          if (u.password.length < 6) errs[`u${i}_pw`] = "Mínimo 6 caracteres.";
        });
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (validate()) setStep((s) => s + 1);
  }

  function back() {
    setErrors({});
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));

    const clinicId = crypto.randomUUID();
    const now = new Date().toISOString();
    const isClinic = form.clinicType !== "autonomous";
    const clinicName = isClinic ? form.clinicName : undefined;

    // Owner / autonomous user
    const ownerUser: User = {
      id: crypto.randomUUID(),
      name: form.ownerName,
      email: form.ownerEmail,
      role: "admin",
      accountType: isClinic ? "clinic_owner" : "autonomous",
      clinicId: isClinic ? clinicId : undefined,
      clinicName,
      active: true,
      createdAt: now,
    };
    addUser({ ...ownerUser, passwordHash: form.ownerPassword });

    // Additional team users (clinic/hospital only)
    if (isClinic && form.hasAdditionalUsers) {
      form.additionalUsers.forEach((u) => {
        const teamUser: User = {
          id: crypto.randomUUID(),
          name: u.name,
          email: u.email,
          role: u.role,
          accountType: "clinic_user",
          clinicId,
          clinicName,
          active: true,
          createdAt: now,
        };
        addUser({ ...teamUser, passwordHash: u.password });
      });
    }

    router.replace("/login?registered=1");
  }

  // Map step index → component (autonomous path skips StepEquipe)
  function renderStep() {
    if (isAuto) {
      const map = [
        <StepTipo key="tipo" form={form} errors={errors} setField={setField} />,
        <StepDados
          key="dados"
          form={form}
          errors={errors}
          setField={setField}
        />,
        <StepConta
          key="conta"
          form={form}
          errors={errors}
          setField={setField}
        />,
        <StepConfirmar key="confirm" form={form} />,
      ];
      return map[step] ?? null;
    }
    const map = [
      <StepTipo key="tipo" form={form} errors={errors} setField={setField} />,
      <StepDados key="dados" form={form} errors={errors} setField={setField} />,
      <StepConta key="conta" form={form} errors={errors} setField={setField} />,
      <StepEquipe
        key="equipe"
        form={form}
        errors={errors}
        setField={setField}
      />,
      <StepConfirmar key="confirm" form={form} />,
    ];
    return map[step] ?? null;
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#1B2A6B]/5 via-white to-[#2DC6C6]/10">
      {/* ── Left decorative panel ────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[400px] shrink-0 bg-gradient-to-br from-[#1B2A6B] to-[#2DC6C6] text-white p-10">
        <div>
          <Link href="/" className="flex items-center gap-2.5 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white overflow-hidden flex items-center justify-center shrink-0">
              <Image
                src="/images/logo.jpeg"
                alt="DrVet"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            <span className="text-xl font-bold">DrVet</span>
          </Link>
          <h1 className="text-3xl font-extrabold leading-tight mb-4">
            Comece a transformar sua clínica hoje
          </h1>
          <p className="text-white/70 text-sm leading-relaxed">
            Um cadastro rápido e você já tem acesso a todos os módulos: agenda,
            prontuário, financeiro, PDV, estoque e muito mais.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "14 dias grátis, sem cartão de crédito",
              "Usuários ilimitados inclusos",
              "Todos os módulos desde o primeiro dia",
              "Suporte prioritário via chat",
              "Cancele quando quiser",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2.5 text-sm text-white/90"
              >
                <CheckCircle2 className="w-4 h-4 text-white/70 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white/10 rounded-2xl p-5 border border-white/20">
          <p className="text-2xl font-extrabold">
            R$ 49,90
            <span className="text-base font-normal text-white/70">/mês</span>
          </p>
          <p className="text-white/70 text-sm mt-1">
            Plano único · Tudo incluso · Ilimitado
          </p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
              <Image
                src="/images/logo.jpeg"
                alt="DrVet"
                width={36}
                height={36}
                className="object-cover"
              />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] bg-clip-text text-transparent">
              DrVet
            </span>
          </div>

          <StepBar steps={steps} current={step} />

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            {renderStep()}

            {/* ── Navigation buttons ── */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={back}
                  className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#1B2A6B] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-sm text-gray-400 hover:text-[#1B2A6B] transition-colors"
                >
                  Já tenho conta
                </Link>
              )}

              {isLastStep ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white font-semibold px-7 py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {submitting ? "Criando conta..." : "Criar conta"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={next}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white font-semibold px-7 py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Ao criar sua conta você concorda com nossos{" "}
            <span className="text-[#1B2A6B] cursor-pointer hover:underline">
              Termos de Uso
            </span>{" "}
            e{" "}
            <span className="text-[#1B2A6B] cursor-pointer hover:underline">
              Política de Privacidade
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
