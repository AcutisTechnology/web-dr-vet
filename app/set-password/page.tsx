"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useSessionStore } from "@/stores/session";
import { adaptApiUserToUser } from "@/adapters/auth.adapter";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

function SetPasswordForm() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { login }    = useSessionStore();

  const token      = searchParams.get("token") ?? "";
  const emailParam = searchParams.get("email") ?? "";

  // Token validation
  const [validating, setValidating]   = useState(true);
  const [tokenValid, setTokenValid]   = useState(false);
  const [tokenError, setTokenError]   = useState("");
  const [clinicName, setClinicName]   = useState("");
  const [inviteeName, setInviteeName] = useState("");
  const [email, setEmail]             = useState(emailParam);

  // Form
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [showCf, setShowCf]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    if (!token) {
      setTokenError("Link de convite inválido. Solicite um novo convite ao administrador.");
      setValidating(false);
      return;
    }

    async function validate() {
      try {
        const res  = await fetch(`${API_URL}/invites/validate?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (res.ok && data.valid) {
          setTokenValid(true);
          setClinicName(data.clinicName ?? "");
          setInviteeName(data.name ?? "");
          setEmail(data.email ?? emailParam);
        } else {
          setTokenError(data.error ?? "Link inválido ou expirado.");
        }
      } catch {
        setTokenError("Erro de conexão. Tente novamente.");
      } finally {
        setValidating(false);
      }
    }

    validate();
  }, [token, emailParam]);

  const pwMatch = password === confirm;
  const pwValid = password.length >= 6;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!pwValid) { setError("A senha deve ter ao menos 6 caracteres."); return; }
    if (!pwMatch) { setError("As senhas não coincidem."); return; }

    setSubmitting(true);
    try {
      const res  = await fetch(`${API_URL}/invites/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: confirm,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? data.message ?? "Erro ao definir senha. Tente novamente.");
        return;
      }

      // Log the user in immediately using the returned Sanctum token
      if (data.data?.token && data.data?.user) {
        const appUser = adaptApiUserToUser(data.data.user);
        login(appUser, data.data.token);
        router.push("/dashboard");
        return;
      }

      // Fallback: API succeeded but didn't return token
      setSuccess(true);
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B2A6B]/5 via-white to-[#2DC6C6]/10 p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B2A6B] to-[#2DC6C6] overflow-hidden flex items-center justify-center shadow-lg">
            <Image src="/images/logo.jpeg" alt="DrVet" width={48} height={48} className="object-cover" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] bg-clip-text text-transparent">
            DrVet
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">

          {/* Validando */}
          {validating && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-10 h-10 text-[#2DC6C6] animate-spin" />
              <p className="text-gray-500 text-sm">Validando link de convite...</p>
            </div>
          )}

          {/* Token inválido */}
          {!validating && !tokenValid && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Link inválido</h2>
                <p className="text-center text-gray-500 text-sm">{tokenError}</p>
              </div>
              <div className="text-center">
                <Link href="/login" className="text-sm text-[#1B2A6B] font-medium hover:underline">
                  Ir para o login
                </Link>
              </div>
            </div>
          )}

          {/* Sucesso (fallback) */}
          {!validating && tokenValid && success && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Senha criada!</h2>
                <p className="text-center text-gray-500 text-sm">
                  Sua senha foi definida com sucesso. Agora você pode acessar o sistema.
                </p>
              </div>
              <button
                onClick={() => router.push("/login")}
                className="w-full bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white font-semibold py-3 rounded-2xl hover:shadow-lg transition-all"
              >
                Ir para o login
              </button>
            </div>
          )}

          {/* Formulário */}
          {!validating && tokenValid && !success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Crie sua senha</h2>
                <p className="text-gray-500 mt-1 text-sm">
                  {clinicName
                    ? `${inviteeName ? `Olá, ${inviteeName}! ` : ""}Você foi convidado(a) para a equipe de ${clinicName}.`
                    : "Configure sua senha de acesso ao DrVet."}
                </p>
              </div>

              {/* E-mail */}
              <div className="bg-[#1B2A6B]/5 rounded-xl px-4 py-3 border border-[#2DC6C6]/20">
                <p className="text-xs text-gray-500 font-medium">Conta</p>
                <p className="text-sm font-semibold text-gray-900">{email}</p>
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Nova senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/30 focus:border-[#1B2A6B] transition-all"
                    required
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Confirmar senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showCf ? "text" : "password"}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/30 focus:border-[#1B2A6B] transition-all"
                    required
                  />
                  <button type="button" onClick={() => setShowCf(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirm && password && (
                  <p className={`text-xs flex items-center gap-1 mt-1 ${pwMatch ? "text-emerald-600" : "text-red-500"}`}>
                    <CheckCircle2 className="w-3 h-3" />
                    {pwMatch ? "Senhas coincidem" : "Senhas não coincidem"}
                  </p>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !pwValid || !pwMatch}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white font-semibold py-3 rounded-2xl hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
                  : <><Lock className="w-4 h-4" />Definir senha e entrar</>}
              </button>

              <p className="text-center text-xs text-gray-400">
                Já tem uma conta?{" "}
                <Link href="/login" className="text-[#1B2A6B] hover:underline">Fazer login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#2DC6C6] animate-spin" />
      </div>
    }>
      <SetPasswordForm />
    </Suspense>
  );
}
