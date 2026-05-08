"use client";
import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, CheckCircle2, ArrowRight } from "lucide-react";
import Image from "next/image";
import { GoogleOAuthProvider as _GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
const GoogleOAuthProvider = _GoogleOAuthProvider as unknown as React.ComponentType<{
  clientId: string;
  children: React.ReactNode;
}>;
import { useLogin, useGoogleAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});
type FormData = z.infer<typeof schema>;


function LoginContent() {
  const params = useSearchParams();
  const registered = params.get("registered") === "1";
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: login, isPending, error } = useLogin();
  const { mutate: googleAuth, isPending: isGooglePending, error: googleError } = useGoogleAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const apiError =
    error?.response?.data?.errors?.email?.[0] ??
    error?.response?.data?.message ??
    (error ? "E-mail ou senha incorretos." : "");

  const googleApiError =
    googleError?.response?.data?.message ??
    (googleError ? "Não foi possível entrar com Google." : "");

  const onSubmit = (data: FormData) => login({ email: data.email, password: data.password });

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => googleAuth(tokenResponse),
    onError: () => {},
    flow: "implicit",
  });

  return (
    <div className="min-h-screen flex bg-background">

      {/* ── Painel esquerdo — foto ──────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative">
        {/* Foto de fundo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1400&q=85"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay escuro suave */}
        <div className="absolute inset-0 bg-primary/60" />

        {/* Conteúdo */}
        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <Image src="/images/logo.jpeg" alt="DrVet" width={32} height={32} className="object-cover" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">DrVet</span>
          </div>

          {/* Tagline na base */}
          <div>
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-3">
              Plataforma veterinária nº 1 do Brasil
            </p>
            <h2 className="text-white font-extrabold leading-tight tracking-tight"
              style={{ fontSize: "clamp(1.8rem, 2.6vw, 2.6rem)" }}>
              A gestão da sua clínica{" "}
              <span className="text-accent">mais inteligente</span>{" "}
              começa aqui.
            </h2>
          </div>
        </div>
      </div>

      {/* ── Painel direito (formulário) ──────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-card px-6 py-12">

        {/* Logo mobile */}
        <div className="flex lg:hidden flex-col items-center gap-3 mb-10">
          <Image
            src="/images/logo-fundo.png"
            alt="DrVet"
            width={80}
            height={80}
            className="object-contain"
          />
          <span className="font-extrabold text-xl text-primary tracking-tight">DrVet</span>
        </div>

        <div className="w-full max-w-[380px] space-y-6">

          {/* Cabeçalho */}
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              Bem-vindo de volta
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Acesse sua conta para continuar
            </p>
          </div>

          {/* Banner de cadastro realizado */}
          {registered && (
            <div className="flex items-center gap-3 bg-secondary border border-border rounded-lg px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <p className="text-sm text-foreground font-medium">
                Conta criada! Faça login para continuar.
              </p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  className="pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">Lembrar de mim</span>
              </label>
              <Link
                href="#"
                className="text-sm text-accent font-medium hover:text-accent/80 transition-colors"
              >
                Esqueci a senha
              </Link>
            </div>

            {apiError && (
              <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
                {apiError}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isPending || isGooglePending}
            >
              {isPending ? "Entrando…" : (
                <span className="flex items-center gap-2">
                  Entrar <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Google OAuth */}
          {GOOGLE_CLIENT_ID && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider">
                    ou
                  </span>
                </div>
              </div>

              {googleApiError && (
                <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
                  {googleApiError}
                </p>
              )}

              <button
                type="button"
                onClick={() => handleGoogleLogin()}
                disabled={isPending || isGooglePending}
                className="w-full h-10 flex items-center justify-center gap-2.5 rounded-md border border-border bg-card hover:bg-secondary text-foreground text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGooglePending ? (
                  <span className="text-muted-foreground text-sm">Conectando…</span>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                      <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                    Entrar com Google
                  </>
                )}
              </button>
            </>
          )}

          {/* Link cadastro */}
          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link href="/cadastro" className="text-accent font-semibold hover:text-accent/80 transition-colors">
              Cadastre-se grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const fallback = (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 rounded-lg overflow-hidden animate-pulse bg-muted" />
  </div>
);

export default function LoginPage() {
  const content = <Suspense fallback={fallback}><LoginContent /></Suspense>;
  if (!GOOGLE_CLIENT_ID) return content;
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {content}
    </GoogleOAuthProvider>
  );
}
