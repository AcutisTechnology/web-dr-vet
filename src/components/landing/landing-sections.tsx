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
  XCircle,
  Receipt,
  BedDouble,
  FileText,
  Lock,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import CountUp from "@/components/ui/react-bits/count-up";
import ScrollVelocity from "@/components/ui/react-bits/scroll-velocity";
import BlurText from "@/components/ui/react-bits/blur-text";

// ─── Helpers ───────────────────────────────────────────────────────────────────

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
      { threshold }
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

// ─── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: CalendarDays,
    title: "Agenda Inteligente",
    desc: "Agendamentos recorrentes, lembretes automáticos e visão semanal/diária com drag & drop.",
    color: "from-[#1B2A6B] to-[#2440a8]",
    tag: "Novo",
  },
  {
    icon: Stethoscope,
    title: "Prontuário Digital",
    desc: "Histórico clínico completo, vacinas, exames, prescrições e anamnese por paciente.",
    color: "from-[#2DC6C6] to-[#1aacac]",
    tag: null,
  },
  {
    icon: ClipboardList,
    title: "Anamnese por Sistemas",
    desc: "Queixas clínicas rápidas por sistema: digestivo, respiratório, neuro, olhos e ouvido.",
    color: "from-emerald-500 to-emerald-600",
    tag: null,
  },
  {
    icon: ShoppingCart,
    title: "PDV & Vendas",
    desc: "Ponto de venda integrado com estoque, múltiplos meios de pagamento e recibo automático.",
    color: "from-orange-500 to-orange-600",
    tag: null,
  },
  {
    icon: Package,
    title: "Controle de Estoque",
    desc: "Alertas de vencimento, estoque mínimo, movimentações e exportação CSV.",
    color: "from-[#1B2A6B] to-[#2DC6C6]",
    tag: null,
  },
  {
    icon: Banknote,
    title: "Financeiro Completo",
    desc: "Fluxo de caixa, contas a pagar/receber, múltiplas contas e relatórios detalhados.",
    color: "from-yellow-500 to-yellow-600",
    tag: null,
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Integrado",
    desc: "Lembretes de consultas, vacinas, aniversários e campanhas para tutores.",
    color: "from-green-500 to-green-600",
    tag: null,
  },
  {
    icon: BarChart3,
    title: "Dashboard & KPIs",
    desc: "Indicadores em tempo real: consultas, receita, internações e estoque crítico.",
    color: "from-[#2DC6C6] to-[#1B2A6B]",
    tag: null,
  },
  {
    icon: Users,
    title: "Multi-usuários",
    desc: "Equipe ilimitada com controle de acesso por perfil: vet, atendente, financeiro.",
    color: "from-[#1B2A6B] to-[#2DC6C6]",
    tag: null,
  },
  {
    icon: BedDouble,
    title: "Internação",
    desc: "Boxes, prescrições, checklist de cuidados e acompanhamento em tempo real.",
    color: "from-pink-500 to-rose-500",
    tag: null,
  },
  {
    icon: Receipt,
    title: "Emissão Fiscal",
    desc: "NF-e, NFC-e e NFS-e ilimitadas incluídas no plano. Sem custo extra.",
    color: "from-violet-500 to-violet-600",
    tag: "Incluso",
  },
  {
    icon: FileText,
    title: "Receituário & Laudos",
    desc: "Templates DrVet para prescrições, laudos e autorizações prontos para imprimir.",
    color: "from-sky-500 to-sky-600",
    tag: null,
  },
];

const PLAN_FEATURES = [
  "Usuários ilimitados para toda equipe",
  "Pacientes & tutores ilimitados",
  "Agenda inteligente com recorrência e lembretes",
  "Prontuário digital completo & anamnese por sistemas",
  "PDV integrado com controle de estoque",
  "Financeiro completo — fluxo de caixa & relatórios",
  "Internação com checklist e prescrições",
  "WhatsApp integrado para tutores",
  "Dashboard & KPIs em tempo real",
  "Emissão de NF-e / NFC-e / NFS-e ilimitada",
  "Controle de acesso por perfil de usuário",
  "Suporte prioritário via chat",
];

const TESTIMONIALS = [
  {
    name: "Dra. Ana Carvalho",
    role: "Clínica VetCare – São Paulo",
    stars: 5,
    text: "O DrVet transformou nossa rotina. A anamnese digital economiza 20 min por consulta e o prontuário fica sempre organizado.",
    metric: "20min economizados por consulta",
  },
  {
    name: "Dr. Lucas Mendes",
    role: "Hospital Pet Saúde – BH",
    stars: 5,
    text: "A agenda com lembretes automáticos reduziu nossas faltas em 40%. O suporte é excelente e o sistema é muito intuitivo.",
    metric: "40% menos faltas na agenda",
  },
  {
    name: "Dra. Sofia Ramos",
    role: "PetVida Clínica – Curitiba",
    stars: 5,
    text: "Migramos de planilhas para o DrVet em uma semana. Controle de estoque e financeiro ficaram simples e confiáveis.",
    metric: "1 semana para migrar tudo",
  },
];

// ─── LandingStats ──────────────────────────────────────────────────────────────

export function LandingStats() {
  const stats = [
    { to: 3200, suffix: "+", label: "Clínicas ativas", icon: Users },
    { to: 1.4, suffix: "M", label: "Consultas / mês", icon: HeartPulse, decimals: 1 },
    { to: 98, suffix: "%", label: "Satisfação dos clientes", icon: Star },
    { to: 24, suffix: "/7", label: "Suporte disponível", icon: Clock },
  ];

  return (
    <section className="bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] py-16">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
        {stats.map((s, i) => (
          <FadeIn key={s.label} delay={i * 80} className="text-center text-white">
            <s.icon className="w-7 h-7 mx-auto mb-2 opacity-80" />
            <p className="text-3xl font-extrabold">
              <CountUp to={s.to} duration={2.5} delay={0.2} separator="." />
              {s.suffix}
            </p>
            <p className="text-sm opacity-80 mt-1">{s.label}</p>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// ─── ScrollVelocityBanner ──────────────────────────────────────────────────────

export function ScrollBanner() {
  return (
    <div className="py-6 bg-white border-y border-gray-100 overflow-hidden">
      <ScrollVelocity
        texts={[
          "Agenda • Prontuário • PDV • Estoque • Financeiro • WhatsApp • Internação • NF-e •",
          "Usuários ilimitados • Suporte 24/7 • 3 dias grátis • R$ 49,90/mês •",
        ]}
        velocity={60}
        className="text-[#1B2A6B]/40 font-bold text-lg tracking-wide uppercase"
      />
    </div>
  );
}

// ─── LandingFeatures ──────────────────────────────────────────────────────────

export function LandingFeatures() {
  return (
    <section id="funcionalidades" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <FadeIn className="text-center mb-4">
          <span className="text-xs font-semibold text-[#1B2A6B] uppercase tracking-widest">
            Funcionalidades
          </span>
        </FadeIn>
        <div className="text-center mb-16">
          <BlurText
            text="Tudo que sua clínica precisa"
            className="text-4xl font-extrabold justify-center"
            delay={50}
            direction="bottom"
          />
          <p className="text-gray-500 mt-3 max-w-xl mx-auto text-lg">
            Do agendamento ao financeiro, o DrVet centraliza toda a gestão em
            uma plataforma moderna.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 45}>
              <motion.div
                whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(45,198,198,0.15)" }}
                className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-colors duration-300 hover:border-[#2DC6C6] h-full flex flex-col relative overflow-hidden"
              >
                {f.tag && (
                  <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${f.tag === "Novo" ? "bg-[#2DC6C6]/20 text-[#1aacac]" : "bg-emerald-100 text-emerald-700"}`}>
                    {f.tag}
                  </span>
                )}
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-200`}
                >
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-[#1B2A6B] mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed flex-1">{f.desc}</p>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── LandingAnamneseHighlight ─────────────────────────────────────────────────

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
                <p className="text-white font-semibold text-sm">Anamnese – Thor</p>
                <p className="text-white/70 text-xs">🐕 Labrador · Tutor: João Silva</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Queixa Atual
              </p>
              {[
                { l: "Vômito", v: "Sim (agudo)", c: "text-red-600 bg-red-50" },
                { l: "Apetite", v: "Diminuído", c: "text-orange-600 bg-orange-50" },
                { l: "Ingestão de água", v: "Normal", c: "text-green-600 bg-green-50" },
                { l: "Tosse", v: "Ocasional", c: "text-yellow-700 bg-yellow-50" },
                { l: "Secreção ocular", v: "Seroso", c: "text-blue-600 bg-blue-50" },
                { l: "Estado mental", v: "Normal / Alerta", c: "text-green-600 bg-green-50" },
              ].map((row) => (
                <div
                  key={row.l}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <span className="text-sm text-gray-600">{row.l}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${row.c}`}>
                    {row.v}
                  </span>
                </div>
              ))}
              <div className="mt-4 bg-[#1B2A6B]/5 rounded-xl p-3 border border-[#2DC6C6]/30">
                <p className="text-xs text-gray-500 mb-1">Observações complementares</p>
                <p className="text-sm text-gray-700">Início dos sintomas há 2 dias. Piora após alimentação.</p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── LandingComparison ────────────────────────────────────────────────────────

type CompareRow = {
  feature: string;
  drvet: boolean | string;
  simplesvet: boolean | string;
  vetsmart: boolean | string;
};

const COMPARISON_ROWS: CompareRow[] = [
  { feature: "Preço mensal", drvet: "R$ 49,90", simplesvet: "R$ 359+", vetsmart: "R$ 89,90" },
  { feature: "Usuários incluídos", drvet: "Ilimitados", simplesvet: "3 a Ilimitado", vetsmart: "Ilimitados (PRO)" },
  { feature: "Agenda & agendamentos", drvet: true, simplesvet: true, vetsmart: true },
  { feature: "Prontuário digital", drvet: true, simplesvet: true, vetsmart: true },
  { feature: "Anamnese por sistemas", drvet: true, simplesvet: false, vetsmart: false },
  { feature: "PDV / Ponto de venda", drvet: true, simplesvet: true, vetsmart: false },
  { feature: "Controle de estoque", drvet: true, simplesvet: true, vetsmart: false },
  { feature: "Financeiro completo", drvet: true, simplesvet: true, vetsmart: false },
  { feature: "Internação incluída", drvet: true, simplesvet: "R$ 136/mês extra", vetsmart: false },
  { feature: "NF-e / NFC-e / NFS-e", drvet: true, simplesvet: "R$ 153/mês extra", vetsmart: false },
  { feature: "WhatsApp automático", drvet: true, simplesvet: "R$ 0,50/msg", vetsmart: false },
  { feature: "Multi-usuários sem custo extra", drvet: true, simplesvet: false, vetsmart: false },
  { feature: "Período de teste gratuito", drvet: "3 dias", simplesvet: false, vetsmart: "Plano grátis limitado" },
];

function CompCell({ value }: { value: boolean | string }) {
  if (value === true)
    return <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />;
  if (value === false)
    return <XCircle className="w-5 h-5 text-gray-300 mx-auto" />;
  return <span className="text-xs font-medium text-gray-700">{value}</span>;
}

export function LandingComparison() {
  return (
    <section id="comparativo" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center mb-16">
          <span className="text-xs font-semibold text-[#1B2A6B] uppercase tracking-widest">
            Comparativo
          </span>
          <h2 className="text-4xl font-extrabold mt-2">
            DrVet vs. concorrentes
          </h2>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto text-lg">
            Mais funcionalidades, menos custo. Veja como o DrVet se compara
            com os sistemas mais conhecidos do mercado.
          </p>
        </FadeIn>

        <FadeIn delay={80}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-500 w-1/2" />
                  {/* DrVet header */}
                  <th className="py-4 px-4 text-center min-w-[140px]">
                    <div className="bg-gradient-to-br from-[#1B2A6B] to-[#2DC6C6] rounded-2xl py-3 px-4 text-white">
                      <p className="font-extrabold text-base">DrVet</p>
                      <p className="text-xs opacity-80 mt-0.5">R$ 49,90/mês</p>
                      <div className="mt-1.5 bg-white/20 rounded-full px-2 py-0.5">
                        <span className="text-[10px] font-bold">RECOMENDADO</span>
                      </div>
                    </div>
                  </th>
                  {/* SimplesVet header */}
                  <th className="py-4 px-4 text-center min-w-[140px]">
                    <div className="bg-white rounded-2xl py-3 px-4 border border-gray-200 shadow-sm">
                      <p className="font-bold text-sm text-gray-700">S****Vet</p>
                      <p className="text-xs text-gray-400 mt-0.5">A partir de R$ 359/mês</p>
                    </div>
                  </th>
                  {/* Vetsmart header */}
                  <th className="py-4 px-4 text-center min-w-[140px]">
                    <div className="bg-white rounded-2xl py-3 px-4 border border-gray-200 shadow-sm">
                      <p className="font-bold text-sm text-gray-700">Vet***rt</p>
                      <p className="text-xs text-gray-400 mt-0.5">R$ 89,90/mês (PRO)</p>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-t border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  >
                    <td className="py-3.5 px-4 text-sm font-medium text-gray-700">
                      {row.feature}
                    </td>
                    <td className="py-3.5 px-4 text-center bg-[#1B2A6B]/3">
                      <CompCell value={row.drvet} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <CompCell value={row.simplesvet} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <CompCell value={row.vetsmart} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 mb-4">
              * Preços e funcionalidades baseados nas páginas oficiais dos concorrentes. Consulte os sites para informações atualizadas.
            </p>
            <Link
              href="/cadastro"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white font-bold px-8 py-3.5 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Quero o DrVet por R$ 49,90 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── LandingPlans ──────────────────────────────────────────────────────────────

export function LandingPlans() {
  return (
    <section id="plano" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <FadeIn className="text-center mb-12">
          <span className="text-xs font-semibold text-[#1B2A6B] uppercase tracking-widest">
            Plano único
          </span>
          <h2 className="text-4xl font-extrabold mt-2">Tudo incluso. Sem surpresas.</h2>
          <p className="text-gray-500 mt-3 text-lg">
            Um único plano com acesso completo a todos os módulos — ilimitado para toda a equipe.
          </p>
        </FadeIn>

        <FadeIn delay={80}>
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="relative bg-gradient-to-br from-[#1B2A6B] to-[#2DC6C6] rounded-3xl p-10 text-white shadow-2xl shadow-[#1B2A6B]/30"
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-5 py-2 rounded-full shadow-md whitespace-nowrap">
              ⭐ Acesso completo e ilimitado
            </div>

            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-white/70 text-sm font-semibold mb-1">DrVet Completo</p>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-6xl font-extrabold">R$ 49</span>
                  <div className="pb-2">
                    <span className="text-2xl font-bold">,90</span>
                    <span className="text-white/70 text-sm block">/mês</span>
                  </div>
                </div>
                <p className="text-white/70 text-sm mb-2">
                  Para veterinários autônomos, clínicas e hospitais veterinários de qualquer porte.
                </p>
                <div className="flex items-center gap-2 mb-6">
                  <Lock className="w-3.5 h-3.5 text-white/60" />
                  <p className="text-white/60 text-xs">
                    Pagamento seguro · Cancele quando quiser
                  </p>
                </div>
                <Link
                  href="/cadastro"
                  className="inline-flex items-center gap-2 bg-white text-[#1B2A6B] font-bold px-8 py-3.5 rounded-full hover:shadow-xl hover:scale-105 transition-all duration-200 text-base"
                >
                  Começar agora <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-white/50 text-xs mt-3">
                  3 dias grátis · Sem cartão de crédito
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

            {/* vs competitors callout */}
            <div className="mt-8 pt-8 border-t border-white/20 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-white/50 text-xs mb-1">Você paga</p>
                <p className="text-2xl font-extrabold">R$ 49,90</p>
                <p className="text-white/60 text-xs">por mês, tudo incluso</p>
              </div>
              <div>
                <p className="text-white/50 text-xs mb-1">Si****Vet cobra</p>
                <p className="text-2xl font-extrabold text-red-300">R$ 648+</p>
                <p className="text-white/60 text-xs">básico com módulos extras</p>
              </div>
              <div>
                <p className="text-white/50 text-xs mb-1">Vet***rt cobra</p>
                <p className="text-2xl font-extrabold text-red-300">R$ 89,90</p>
                <p className="text-white/60 text-xs">sem PDV, estoque ou fiscal</p>
              </div>
            </div>
          </motion.div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── LandingTestimonials ──────────────────────────────────────────────────────

export function LandingTestimonials() {
  return (
    <section id="depoimentos" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center mb-16">
          <span className="text-xs font-semibold text-[#1B2A6B] uppercase tracking-widest">
            Depoimentos
          </span>
          <h2 className="text-4xl font-extrabold mt-2">Quem usa, indica</h2>
          <p className="text-gray-500 mt-3 max-w-lg mx-auto">
            Veterinários de todo o Brasil já transformaram suas clínicas com o DrVet.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.name} delay={i * 80}>
              <motion.div
                whileHover={{ y: -6 }}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed flex-1 mb-4">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="bg-[#1B2A6B]/5 rounded-xl px-4 py-2.5 mb-5 border border-[#2DC6C6]/20">
                  <p className="text-xs font-bold text-[#1B2A6B]">📊 {t.metric}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B2A6B] to-[#2DC6C6] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {t.name.split(" ")[1]?.[0] ?? t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── LandingCTA ───────────────────────────────────────────────────────────────

export function LandingCTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-[#1B2A6B] via-[#243d8a] to-[#2DC6C6] relative overflow-hidden">
      <motion.div
        className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />

      <FadeIn className="relative text-center max-w-3xl mx-auto px-6">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
          <Zap className="w-3.5 h-3.5" />
          Sem cartão de crédito · Cancele quando quiser
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
          Comece a transformar sua clínica hoje
        </h2>
        <p className="text-white/80 mt-4 text-lg">
          3 dias grátis, acesso completo a todos os módulos, suporte incluso.
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
          <Link href="/login" className="underline hover:text-white transition-colors">
            Fazer login
          </Link>
        </p>
      </FadeIn>
    </section>
  );
}

// ─── LandingFooter ────────────────────────────────────────────────────────────

export function LandingFooter() {
  return (
    <footer className="bg-gray-950 text-gray-400 py-14">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <img src="/images/logo.jpeg" alt="DrVet Logo" className="w-8 h-8 rounded-xl object-cover" />
              <span className="text-white font-bold text-lg">DrVet</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Sistema completo de gestão para clínicas veterinárias. Moderno,
              acessível e pensado para o dia a dia do veterinário.
            </p>
          </div>

          <div>
            <p className="text-white font-semibold text-sm mb-3">Navegação</p>
            <div className="flex flex-col gap-2 text-sm">
              <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
              <a href="#comparativo" className="hover:text-white transition-colors">Comparativo</a>
              <a href="#depoimentos" className="hover:text-white transition-colors">Depoimentos</a>
              <a href="#plano" className="hover:text-white transition-colors">Plano & Preços</a>
            </div>
          </div>

          <div>
            <p className="text-white font-semibold text-sm mb-3">Conta</p>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
              <Link href="/cadastro" className="hover:text-white transition-colors">Criar conta grátis</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-center">
            © {new Date().getFullYear()} DrVet – Sistema de Gestão Veterinária. Todos os direitos reservados.
          </p>
          <p className="text-xs text-gray-600">
            Feito com ❤️ para veterinários brasileiros
          </p>
        </div>
      </div>
    </footer>
  );
}
