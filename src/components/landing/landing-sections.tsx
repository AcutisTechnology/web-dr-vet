"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  ShoppingCart,
  BarChart3,
  MessageSquare,
  Stethoscope,
  Package,
  Banknote,
  CheckCircle2,
  Star,
  ArrowRight,
  HeartPulse,
  Users,
  Clock,
} from "lucide-react";

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, vis };
}

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, vis } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(28px)",
        transition: `opacity .65s ease ${delay}ms, transform .65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const FEATURES = [
  {
    icon: CalendarDays,
    title: "Agenda Inteligente",
    desc: "Agendamentos online, lembretes automáticos e visão semanal/mensal.",
    color: "from-[#1B2A6B] to-[#2440a8]",
  },
  {
    icon: Stethoscope,
    title: "Prontuário Digital",
    desc: "Histórico clínico, vacinas, exames, prescrições e anamnese por paciente.",
    color: "from-[#2DC6C6] to-[#1aacac]",
  },
  {
    icon: ClipboardList,
    title: "Anamnese por Sistemas",
    desc: "Queixas clínicas rápidas: digestivo, respiratório, neuro, olhos e ouvido.",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    icon: ShoppingCart,
    title: "PDV & Vendas",
    desc: "Ponto de venda integrado com controle de estoque, produtos e serviços.",
    color: "from-orange-500 to-orange-600",
  },
  {
    icon: Package,
    title: "Controle de Estoque",
    desc: "Medicamentos com alertas de vencimento, estoque mínimo e movimentações.",
    color: "from-[#1B2A6B] to-[#2DC6C6]",
  },
  {
    icon: Banknote,
    title: "Financeiro Completo",
    desc: "Fluxo de caixa, contas a pagar/receber e relatórios detalhados.",
    color: "from-yellow-500 to-yellow-600",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Integrado",
    desc: "Lembretes, retornos e campanhas diretamente para o tutor.",
    color: "from-green-500 to-green-600",
  },
  {
    icon: BarChart3,
    title: "Relatórios & Dashboard",
    desc: "KPIs, indicadores de performance e exportação em CSV.",
    color: "from-[#2DC6C6] to-[#1B2A6B]",
  },
  {
    icon: Users,
    title: "Multi-usuários",
    desc: "Cadastre toda a equipe com níveis de acesso por função: veterinário, atendente, financeiro.",
    color: "from-[#1B2A6B] to-[#2DC6C6]",
  },
  {
    icon: HeartPulse,
    title: "Internação",
    desc: "Acompanhe pacientes internados, prescrições e checklist de cuidados em tempo real.",
    color: "from-pink-500 to-rose-500",
  },
];

const PLAN_FEATURES = [
  "Usuários ilimitados para toda equipe",
  "Pacientes & tutores ilimitados",
  "Agenda inteligente com lembretes automáticos",
  "Prontuário digital completo & anamnese por sistemas",
  "PDV integrado com controle de estoque",
  "Financeiro completo — fluxo de caixa & relatórios",
  "Internação com checklist e prescrições",
  "WhatsApp integrado para tutores",
  "Dashboard & KPIs em tempo real",
  "Emissão de NF-e / NFC-e",
  "Multi-usuários com controle de acesso por perfil",
  "Suporte prioritário via chat",
];

const TESTIMONIALS = [
  {
    name: "Dra. Ana Carvalho",
    role: "Clínica VetCare – São Paulo",
    stars: 5,
    text: "O DrVet transformou nossa rotina. A anamnese digital economiza 20 min por consulta e o prontuário fica sempre organizado.",
  },
  {
    name: "Dr. Lucas Mendes",
    role: "Hospital Pet Saúde – BH",
    stars: 5,
    text: "A agenda com lembretes automáticos reduziu nossas faltas em 40%. O suporte é excelente e o sistema é muito intuitivo.",
  },
  {
    name: "Dra. Sofia Ramos",
    role: "PetVida Clínica – Curitiba",
    stars: 5,
    text: "Migramos de planilhas para o DrVet em uma semana. Controle de estoque e financeiro ficaram simples e confiáveis.",
  },
];

const STATS = [
  { value: "3.200+", label: "Clínicas ativas", icon: Users },
  { value: "1,4 M", label: "Consultas / mês", icon: HeartPulse },
  { value: "98%", label: "Satisfação dos clientes", icon: Star },
  { value: "24/7", label: "Suporte disponível", icon: Clock },
];

export function LandingStats() {
  return (
    <section className="bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] py-14">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
        {STATS.map((s, i) => (
          <FadeIn
            key={s.label}
            delay={i * 80}
            className="text-center text-white"
          >
            <s.icon className="w-7 h-7 mx-auto mb-2 opacity-80" />
            <p className="text-3xl font-extrabold">{s.value}</p>
            <p className="text-sm opacity-80 mt-1">{s.label}</p>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

export function LandingFeatures() {
  return (
    <section id="funcionalidades" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <FadeIn className="text-center mb-16">
          <span className="text-xs font-semibold text-[#1B2A6B] uppercase tracking-widest">
            Funcionalidades
          </span>
          <h2 className="text-4xl font-extrabold mt-2">
            Tudo que sua clínica precisa
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto text-lg">
            Do agendamento ao financeiro, o DrVet centraliza toda a gestão em
            uma plataforma moderna.
          </p>
        </FadeIn>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 55}>
              <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl border border-gray-100 hover:border-[#2DC6C6] transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-200`}
                >
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-[#1B2A6B] mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed flex-1">
                  {f.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingAnamneseHighlight() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <FadeIn className="space-y-5">
          <span className="text-xs font-semibold text-[#1B2A6B] uppercase tracking-widest">
            Prontuário & Anamnese
          </span>
          <h2 className="text-4xl font-extrabold leading-tight">
            Anamnese clínica completa,{" "}
            <span className="bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] bg-clip-text text-transparent">
              em segundos
            </span>
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            Com seleção rápida por sistema, o veterinário registra todos os
            sinais clínicos de forma padronizada, sem precisar digitar nada.
          </p>
          <ul className="space-y-3">
            {[
              "Digestivo, respiratório, neurológico, olhos e ouvido",
              "Apetite, ingestão de água, vômito e diarreia com um clique",
              "Preventivos, vacinas e vermifugação integrados",
              "Histórico médico e medicações em uso contínuo",
              "Receituário com template DrVet — pronto para imprimir",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-[#2DC6C6] shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white font-semibold px-7 py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 mt-2"
          >
            Experimentar agora <ArrowRight className="w-4 h-4" />
          </Link>
        </FadeIn>

        <FadeIn delay={150}>
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  Anamnese – Thor
                </p>
                <p className="text-white/70 text-xs">
                  🐕 Labrador · Tutor: João Silva
                </p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Queixa Atual
              </p>
              {[
                { l: "Vômito", v: "Sim (agudo)", c: "text-red-600 bg-red-50" },
                {
                  l: "Apetite",
                  v: "Diminuído",
                  c: "text-orange-600 bg-orange-50",
                },
                {
                  l: "Ingestão de água",
                  v: "Normal",
                  c: "text-green-600 bg-green-50",
                },
                {
                  l: "Tosse",
                  v: "Ocasional",
                  c: "text-yellow-700 bg-yellow-50",
                },
                {
                  l: "Secreção ocular",
                  v: "Seroso",
                  c: "text-blue-600 bg-blue-50",
                },
                {
                  l: "Estado mental",
                  v: "Normal / Alerta",
                  c: "text-green-600 bg-green-50",
                },
              ].map((row) => (
                <div
                  key={row.l}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <span className="text-sm text-gray-600">{row.l}</span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${row.c}`}
                  >
                    {row.v}
                  </span>
                </div>
              ))}
              <div className="mt-4 bg-[#1B2A6B]/5 rounded-xl p-3 border border-[#2DC6C6]/30">
                <p className="text-xs text-gray-500 mb-1">
                  Observações complementares
                </p>
                <p className="text-sm text-gray-700">
                  Início dos sintomas há 2 dias. Piora após alimentação.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

export function LandingPlans() {
  return (
    <section id="plano" className="py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6">
        <FadeIn className="text-center mb-12">
          <span className="text-xs font-semibold text-[#1B2A6B] uppercase tracking-widest">
            Plano único
          </span>
          <h2 className="text-4xl font-extrabold mt-2">
            Tudo incluso. Sem surpresas.
          </h2>
          <p className="text-gray-500 mt-3 text-lg">
            Um único plano com acesso completo a todos os módulos — ilimitado
            para toda a equipe.
          </p>
        </FadeIn>

        <FadeIn delay={80}>
          <div className="relative bg-gradient-to-br from-[#1B2A6B] to-[#2DC6C6] rounded-3xl p-10 text-white shadow-2xl shadow-[#1B2A6B]/30">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-5 py-2 rounded-full shadow-md whitespace-nowrap">
              ⭐ Acesso completo e ilimitado
            </div>

            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-white/70 text-sm font-semibold mb-1">
                  DrVet Completo
                </p>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-6xl font-extrabold">R$ 49</span>
                  <div className="pb-2">
                    <span className="text-2xl font-bold">,90</span>
                    <span className="text-white/70 text-sm block">/mês</span>
                  </div>
                </div>
                <p className="text-white/70 text-sm mb-6">
                  Para veterinários autônomos, clínicas e hospitais veterinários
                  de qualquer porte.
                </p>
                <Link
                  href="/cadastro"
                  className="inline-flex items-center gap-2 bg-white text-[#1B2A6B] font-bold px-8 py-3.5 rounded-full hover:shadow-xl hover:scale-105 transition-all duration-200 text-base"
                >
                  Começar agora <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-white/50 text-xs mt-3">
                  14 dias grátis · Sem cartão de crédito
                </p>
              </div>

              <ul className="grid grid-cols-1 gap-2.5">
                {PLAN_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-white/80" />
                    <span className="text-white/90">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

export function LandingTestimonials() {
  return (
    <section id="depoimentos" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center mb-16">
          <span className="text-xs font-semibold text-[#1B2A6B] uppercase tracking-widest">
            Depoimentos
          </span>
          <h2 className="text-4xl font-extrabold mt-2">Quem usa, indica</h2>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.name} delay={i * 80}>
              <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star
                      key={s}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed flex-1 mb-6">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B2A6B] to-[#2DC6C6] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {t.name.split(" ")[1]?.[0] ?? t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingCTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-[#1B2A6B] via-[#243d8a] to-[#2DC6C6] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full"
          style={{ animation: "blob 10s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full"
          style={{ animation: "blob 10s ease-in-out infinite 5s" }}
        />
      </div>
      <FadeIn className="relative text-center max-w-2xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
          Comece a transformar sua clínica hoje
        </h2>
        <p className="text-white/80 mt-4 text-lg">
          14 dias grátis, sem cartão de crédito, sem compromisso.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 bg-white text-[#1B2A6B] font-bold px-8 py-4 rounded-full text-base hover:shadow-2xl hover:scale-105 transition-all duration-200"
          >
            Criar conta gratuita <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        <p className="text-white/60 text-sm mt-4">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="underline hover:text-white transition-colors"
          >
            Fazer login
          </Link>
        </p>
      </FadeIn>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="bg-gray-950 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1B2A6B] to-[#2DC6C6] flex items-center justify-center">
            <span className="text-white text-xs font-bold">Dv</span>
          </div>
          <span className="text-white font-bold text-lg">DrVet</span>
        </div>
        <p className="text-sm text-center">
          © {new Date().getFullYear()} DrVet – Sistema de Gestão Veterinária.
          Todos os direitos reservados.
        </p>
        <div className="flex gap-6 text-sm">
          <Link href="/login" className="hover:text-white transition-colors">
            Entrar
          </Link>
          <a
            href="#funcionalidades"
            className="hover:text-white transition-colors"
          >
            Funcionalidades
          </a>
        </div>
      </div>
    </footer>
  );
}
