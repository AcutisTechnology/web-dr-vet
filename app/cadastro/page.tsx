"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, CheckCircle2, Mail, RefreshCw } from "lucide-react";
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
import { useRegister } from "@/hooks/use-auth";
import type { RegisterPayload } from "@/types/api";

const STEPS_CLINIC = [
  "Tipo de uso",
  "Dados da clínica",
  "Sua conta",
  "Equipe",
  "Verificar e-mail",
  "Confirmar",
];
const STEPS_AUTO = ["Tipo de uso", "Seus dados", "Sua conta", "Verificar e-mail", "Confirmar"];

// Step component for email verification
function StepVerificarEmail({
  email,
  onVerified,
}: {
  email: string;
  onVerified: () => void;
}) {
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  async function sendCode() {
    setSending(true);
    setError("");
    setDevCode(null);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao enviar código.");
      } else {
        setSent(true);
        // Em desenvolvimento, a API retorna o código diretamente quando o Resend falha
        if (data.devCode) setDevCode(data.devCode);
        // cooldown 60s
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((v) => {
            if (v <= 1) {
              clearInterval(interval);
              return 0;
            }
            return v - 1;
          });
        }, 1000);
      }
    } catch {
      setError("Erro de conexão. Verifique sua internet.");
    } finally {
      setSending(false);
    }
  }

  async function verifyCode() {
    if (!code.trim()) {
      setError("Digite o código recebido.");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", email, code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Código inválido.");
      } else {
        onVerified();
      }
    } catch {
      setError("Erro de conexão. Verifique sua internet.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900">
          Verifique seu e-mail
        </h2>
        <p className="text-gray-500 mt-1 text-sm">
          Confirme o acesso ao e-mail informado para prosseguir.
        </p>
      </div>

      {/* Email display */}
      <div className="flex items-center gap-3 bg-[#1B2A6B]/5 rounded-2xl p-4 border border-[#2DC6C6]/30">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1B2A6B] to-[#2DC6C6] flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">E-mail a verificar</p>
          <p className="font-semibold text-gray-900 text-sm">{email}</p>
        </div>
      </div>

      {!sent ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Clique abaixo para enviar um código de 6 dígitos para o seu e-mail. 
            O código expira em 10 minutos.
          </p>
          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="button"
            onClick={sendCode}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white font-semibold py-3 rounded-2xl hover:shadow-lg transition-all duration-200 disabled:opacity-60"
          >
            {sending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Enviando...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" /> Enviar código de verificação
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {devCode ? (
            // Banner de desenvolvimento — só aparece quando o Resend não consegue enviar
            // (ex: conta free tentando enviar para e-mail de terceiro)
            <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-800">
              <p className="font-bold flex items-center gap-1.5">⚙️ Modo desenvolvimento</p>
              <p className="text-xs mt-1">O Resend não enviou o e-mail (conta free). Use o código abaixo:</p>
              <p className="text-2xl font-extrabold tracking-[0.4em] text-amber-900 mt-2 text-center">{devCode}</p>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
              <p className="font-semibold">Código enviado!</p>
              <p className="text-xs mt-0.5">Verifique sua caixa de entrada (e a pasta de spam).</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Código de verificação (6 dígitos)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              placeholder="000000"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/30 focus:border-[#1B2A6B] transition-all"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="button"
            onClick={verifyCode}
            disabled={verifying || code.length !== 6}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white font-semibold py-3 rounded-2xl hover:shadow-lg transition-all duration-200 disabled:opacity-60"
          >
            {verifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Verificando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Verificar código
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={sendCode}
              disabled={sending || resendCooldown > 0}
              className="text-sm text-[#1B2A6B] hover:underline disabled:text-gray-400 disabled:no-underline transition-colors"
            >
              {resendCooldown > 0
                ? `Reenviar em ${resendCooldown}s`
                : sending
                ? "Reenviando..."
                : "Reenviar código"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CadastroPage() {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<RegFormData>(INITIAL_FORM);
  const [emailVerified, setEmailVerified] = useState(false);

  const {
    mutate: registerUser,
    isPending: submitting,
    error: registerError,
  } = useRegister();
  const isAuto = form.clinicType === "autonomous";
  const steps = isAuto ? STEPS_AUTO : STEPS_CLINIC;
  const totalSteps = steps.length;
  const isLastStep = step === totalSteps - 1;

  // Determine which step index is the email verification step
  const verifyEmailStepIndex = isAuto ? 3 : 4;
  const isVerifyEmailStep = step === verifyEmailStepIndex;

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
    // Can't advance from verify-email step via the button (handled by StepVerificarEmail)
    if (isVerifyEmailStep) return;
    if (validate()) setStep((s) => s + 1);
  }

  function back() {
    setErrors({});
    setStep((s) => s - 1);
  }

  function handleSubmit() {
    if (!form.clinicType) return;

    const payload: RegisterPayload = {
      name: form.ownerName,
      email: form.ownerEmail,
      password: form.ownerPassword,
      password_confirmation: form.ownerConfirmPassword,
      phone: form.phone,
      clinic_type: form.clinicType as RegisterPayload["clinic_type"],
      clinic_name:
        form.clinicType !== "autonomous" ? form.clinicName : undefined,
      address:
        form.clinicType !== "autonomous"
          ? { city: form.city, state: form.state }
          : undefined,
    };

    registerUser(payload);
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
        <StepVerificarEmail
          key="verificar"
          email={form.ownerEmail}
          onVerified={() => {
            setEmailVerified(true);
            setStep((s) => s + 1);
          }}
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
      <StepVerificarEmail
        key="verificar"
        email={form.ownerEmail}
        onVerified={() => {
          setEmailVerified(true);
          setStep((s) => s + 1);
        }}
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
              "3 dias grátis, sem cartão de crédito",
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

            {registerError && isLastStep && (
              <div className="mt-4 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {registerError.response?.data?.errors
                  ? Object.values(registerError.response.data.errors)
                      .flat()
                      .join(" ")
                  : (registerError.response?.data?.message ??
                    "Erro ao criar conta. Tente novamente.")}
              </div>
            )}

            {/* ── Navigation buttons ── */}
            {/* Hide nav buttons on verify-email step (it has its own actions) */}
            {!isVerifyEmailStep && (
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
                    disabled={submitting || !emailVerified}
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
            )}

            {/* Back button only for verify step */}
            {isVerifyEmailStep && (
              <div className="flex items-center mt-8 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={back}
                  className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#1B2A6B] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
              </div>
            )}
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
