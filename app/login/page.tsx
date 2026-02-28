"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  Building2,
  Stethoscope,
  User,
} from "lucide-react";
import Image from "next/image";
import { useSessionStore } from "@/stores/session";
import { seedUsers } from "@/mocks/seed-users";
import { useUserRegistry } from "@/stores/user-registry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AccountType } from "@/types";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});
type FormData = z.infer<typeof schema>;

const ACCOUNT_TYPE_LABELS: Record<
  AccountType,
  { label: string; icon: React.ElementType; color: string }
> = {
  clinic_owner: {
    label: "Administrador da Clínica",
    icon: Building2,
    color: "text-[#1B2A6B] bg-[#1B2A6B]/10",
  },
  clinic_user: {
    label: "Usuário da Clínica",
    icon: User,
    color: "text-[#2DC6C6] bg-[#2DC6C6]/10",
  },
  autonomous: {
    label: "Veterinário Autônomo",
    icon: Stethoscope,
    color: "text-emerald-700 bg-emerald-50",
  },
};

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const registered = params.get("registered") === "1";
  const { login } = useSessionStore();
  const { findByEmail } = useUserRegistry();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    await new Promise((r) => setTimeout(r, 500));

    // Check registry (real registered users) first
    const registryUser = findByEmail(data.email);
    if (registryUser) {
      if (registryUser.passwordHash !== data.password) {
        setError("E-mail ou senha incorretos.");
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _, ...userWithoutHash } = registryUser;
      login(userWithoutHash);
      router.replace("/dashboard");
      return;
    }

    // Fall back to seed/demo users (any password accepted)
    const seedUser = seedUsers.find((u) => u.email === data.email);
    if (!seedUser) {
      setError("E-mail ou senha incorretos.");
      return;
    }
    login(seedUser);
    router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B2A6B]/5 via-white to-[#2DC6C6]/10 p-4">
      <div className="w-full max-w-md space-y-5">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-lg border border-gray-100 flex items-center justify-center overflow-hidden">
            <Image
              src="/images/logo.jpeg"
              alt="DrVet"
              width={80}
              height={80}
              className="object-cover"
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] bg-clip-text text-transparent">
              DrVet
            </h1>
            <p className="text-muted-foreground text-sm">
              SaaS &amp; Community for Vets
            </p>
          </div>
        </div>

        {/* Registered success banner */}
        {registered && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">
              Conta criada com sucesso! Faça login para continuar.
            </p>
          </div>
        )}

        <Card className="border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#1B2A6B]">Entrar</CardTitle>
            <CardDescription>
              Use qualquer e-mail do sistema para acessar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Qualquer senha"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] hover:opacity-90 transition-opacity"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Não tem conta?{" "}
              <Link
                href="/cadastro"
                className="text-[#1B2A6B] font-medium hover:underline"
              >
                Cadastre-se grátis
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Credenciais de demo */}
        <Card className="bg-muted/40 border-dashed">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Contas demo (qualquer senha):
            </p>
            <div className="space-y-2">
              {seedUsers.map((u) => {
                const meta = ACCOUNT_TYPE_LABELS[u.accountType];
                const Icon = meta.icon;
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between text-xs gap-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${meta.color}`}
                      >
                        <Icon className="w-3 h-3" />
                        {u.accountType === "clinic_owner"
                          ? "Admin"
                          : u.accountType === "clinic_user"
                            ? "Usuário"
                            : "Autônomo"}
                      </span>
                      <span className="text-foreground font-medium truncate">
                        {u.name}
                      </span>
                    </div>
                    <span className="text-muted-foreground shrink-0">
                      {u.email}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 rounded-xl overflow-hidden animate-pulse">
            <Image
              src="/images/logo.jpeg"
              alt="DrVet"
              width={48}
              height={48}
              className="object-cover"
            />
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
