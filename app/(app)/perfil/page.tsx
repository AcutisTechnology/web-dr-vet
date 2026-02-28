"use client";
import { useState } from "react";
import { useSessionStore } from "@/stores/session";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  Lock,
  Building2,
  Stethoscope,
  CheckCircle2,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";

const ACCOUNT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  clinic_owner: {
    label: "Administrador da Clínica",
    color: "bg-[#1B2A6B]/10 text-[#1B2A6B]",
  },
  clinic_user: {
    label: "Usuário da Clínica",
    color: "bg-[#2DC6C6]/10 text-[#2DC6C6]",
  },
  autonomous: {
    label: "Veterinário Autônomo",
    color: "bg-emerald-50 text-emerald-700",
  },
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  vet: "Veterinário",
  attendant: "Atendente",
  financial: "Financeiro",
};

export default function PerfilPage() {
  const { user, login } = useSessionStore();
  const { toast } = useToast();

  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const accountMeta = ACCOUNT_TYPE_LABELS[user.accountType] ?? {
    label: user.accountType,
    color: "bg-gray-100 text-gray-600",
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      toast({
        title: "Nome e e-mail são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    setSavingProfile(true);
    await new Promise((r) => setTimeout(r, 400));
    login({
      ...user,
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
    });
    toast({ title: "Perfil atualizado com sucesso!" });
    setSavingProfile(false);
  };

  const handleSavePassword = async () => {
    if (!passwordForm.current) {
      toast({ title: "Informe sua senha atual", variant: "destructive" });
      return;
    }
    if (passwordForm.next.length < 6) {
      toast({
        title: "Nova senha deve ter ao menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    await new Promise((r) => setTimeout(r, 400));
    toast({ title: "Senha alterada com sucesso!" });
    setPasswordForm({ current: "", next: "", confirm: "" });
    setSavingPassword(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B2A6B]">Meu Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie suas informações pessoais e de acesso
        </p>
      </div>

      {/* Avatar + info card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-5">
            <Avatar className="w-20 h-20 shrink-0">
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-[#1B2A6B] to-[#2DC6C6] text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1.5 min-w-0">
              <h2 className="text-xl font-semibold truncate">{user.name}</h2>
              <p className="text-sm text-muted-foreground truncate">
                {user.email}
              </p>
              <div className="flex flex-wrap gap-2 pt-0.5">
                <Badge
                  className={`text-xs font-medium border-0 ${accountMeta.color}`}
                >
                  {user.accountType === "autonomous" ? (
                    <Stethoscope className="w-3 h-3 mr-1" />
                  ) : (
                    <Building2 className="w-3 h-3 mr-1" />
                  )}
                  {accountMeta.label}
                </Badge>
                {user.role && (
                  <Badge variant="outline" className="text-xs">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </Badge>
                )}
                {user.clinicName && (
                  <Badge
                    variant="outline"
                    className="text-xs text-muted-foreground"
                  >
                    {user.clinicName}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile data form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-[#1B2A6B]" />
            Dados Pessoais
          </CardTitle>
          <CardDescription>
            Atualize suas informações de exibição
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Nome completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="profile-name"
                className="pl-9"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Seu nome"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="profile-email"
                type="email"
                className="pl-9"
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="seu@email.com"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-phone">
              Telefone{" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="profile-phone"
                type="tel"
                className="pl-9"
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          <div className="pt-1">
            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="bg-[#1B2A6B] hover:bg-[#1B2A6B]/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {savingProfile ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Password change form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#1B2A6B]" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Mantenha sua conta segura com uma senha forte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pw-current">Senha atual</Label>
            <div className="relative">
              <Input
                id="pw-current"
                type={showCurrent ? "text" : "password"}
                value={passwordForm.current}
                onChange={(e) =>
                  setPasswordForm((f) => ({ ...f, current: e.target.value }))
                }
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw-next">Nova senha</Label>
            <div className="relative">
              <Input
                id="pw-next"
                type={showNext ? "text" : "password"}
                value={passwordForm.next}
                onChange={(e) =>
                  setPasswordForm((f) => ({ ...f, next: e.target.value }))
                }
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowNext((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNext ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw-confirm">Confirmar nova senha</Label>
            <div className="relative">
              <Input
                id="pw-confirm"
                type={showConfirm ? "text" : "password"}
                value={passwordForm.confirm}
                onChange={(e) =>
                  setPasswordForm((f) => ({ ...f, confirm: e.target.value }))
                }
                placeholder="Repita a nova senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {passwordForm.confirm && passwordForm.next && (
              <p
                className={`text-xs flex items-center gap-1 mt-1 ${
                  passwordForm.next === passwordForm.confirm
                    ? "text-emerald-600"
                    : "text-destructive"
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                {passwordForm.next === passwordForm.confirm
                  ? "Senhas coincidem"
                  : "Senhas não coincidem"}
              </p>
            )}
          </div>
          <div className="pt-1">
            <Button
              onClick={handleSavePassword}
              disabled={savingPassword}
              variant="outline"
              className="border-[#1B2A6B] text-[#1B2A6B] hover:bg-[#1B2A6B]/5"
            >
              <Lock className="w-4 h-4 mr-2" />
              {savingPassword ? "Alterando..." : "Alterar senha"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
