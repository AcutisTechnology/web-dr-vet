"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/+$/, "");

export default function ForgotPasswordPage() {
  const [email, setEmail]           = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent]             = useState(false);
  const [error, setError]           = useState("");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!emailValid) {
      setError("Informe um e-mail válido.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429) {
          setError("Muitas tentativas. Aguarde um instante e tente novamente.");
        } else {
          setError(data.error ?? data.message ?? "Não foi possível enviar o link. Tente novamente.");
        }
        return;
      }

      // Resposta genérica — exibe sucesso independentemente de o e-mail existir.
      setSent(true);
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
          {sent ? (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Verifique seu e-mail</h2>
                <p className="text-center text-gray-500 text-sm">
                  Se <strong>{email}</strong> estiver cadastrado, enviamos um link para redefinir sua senha.
                  O link expira em 1 hora.
                </p>
              </div>
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white font-semibold py-3 rounded-2xl hover:shadow-lg transition-all"
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Esqueceu a senha?</h2>
                <p className="text-gray-500 mt-1 text-sm">
                  Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/30 focus:border-[#1B2A6B] transition-all"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !emailValid}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white font-semibold py-3 rounded-2xl hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</>
                  : <><Mail className="w-4 h-4" />Enviar link de redefinição</>}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-center text-sm text-[#1B2A6B] hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
