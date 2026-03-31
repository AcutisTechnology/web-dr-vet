"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Rocket,
  UserPlus,
  PawPrint,
  ClipboardList,
  CalendarCheck,
  BedDouble,
  Receipt,
  ShoppingCart,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
} from "lucide-react";
import Image from "next/image";
import { useSessionStore } from "@/stores/session";

// Brand tokens (design-system.md)
const BRAND = "#1B2A6B";
const ACCENT = "#2DC6C6";
const BRAND_50 = "#EEF1FA";
const ACCENT_50 = "#E8FAFA";

const STORAGE_KEY = "drvet_onboarding_seen_v3";

const steps = [
  {
    icon: Rocket,
    title: "Bem-vindo ao DrVet!",
    subtitle: "Sua clínica veterinária, completa e digital",
    description:
      "O DrVet reúne em uma única plataforma tudo o que você precisa para gerir sua clínica: agenda de consultas, prontuários digitais, controle de internações, ponto de venda, gestão de estoque e financeiro integrado.",
    highlights: [
      "Agenda com visualização diária e semanal",
      "Prontuários e anamneses por pet",
      "PDV integrado ao estoque e ao financeiro",
      "Indicadores e relatórios em tempo real",
    ],
    tip: "Este tutorial aparece apenas uma vez. Você pode revisitá-lo a qualquer momento pelas configurações do seu perfil.",
  },
  {
    icon: UserPlus,
    title: "Cadastre seus Clientes",
    subtitle: "Comece pelo tutor antes de registrar os pets",
    description:
      "No módulo Clientes, registre os dados dos tutores: nome, telefone, CPF, e-mail e endereço completo. O perfil do cliente centraliza todos os seus pets, o histórico de atendimentos e as movimentações financeiras por animal.",
    highlights: [
      "Busca por nome, CPF ou telefone",
      "Histórico de visitas e pets vinculados",
      "Status ativo/inativo para controle da base",
      "Campo de observações para anotações internas",
    ],
    tip: "Mantenha o CPF do tutor atualizado — ele é essencial para emissão de notas e relatórios financeiros.",
  },
  {
    icon: PawPrint,
    title: "Cadastre os Pets",
    subtitle: "Cada paciente tem seu próprio prontuário digital",
    description:
      "Com o tutor cadastrado, adicione os pets vinculados a ele. Registre espécie, raça, data de nascimento, peso e informações clínicas. O perfil do pet centraliza toda a jornada do animal: consultas, internações, prescrições, vacinas e cobranças.",
    highlights: [
      "Ficha com espécie, raça, peso e idade",
      "Histórico clínico cronológico",
      "Vinculação direta ao tutor responsável",
      "Controle de vacinas e datas de retorno",
    ],
    tip: "Adicione uma foto ao perfil do pet — facilita a identificação rápida na agenda e na internação.",
  },
  {
    icon: ClipboardList,
    title: "Preencha a Anamnese",
    subtitle: "A base de todo bom diagnóstico",
    description:
      "Antes de cada atendimento, registre os sintomas relatados pelo tutor, histórico de doenças, medicações em uso, vacinas aplicadas e o motivo da consulta. Esses dados ficam no prontuário do pet e podem ser consultados em qualquer retorno futuro.",
    highlights: [
      "Sintomas e queixas em formulário guiado",
      "Medicações em uso com dose e frequência",
      "Histórico de doenças e cirurgias anteriores",
      "Registro de alergias e restrições clínicas",
    ],
    tip: "Uma anamnese completa reduz o tempo de consulta e aumenta a segurança do diagnóstico — especialmente em retornos.",
  },
  {
    icon: CalendarCheck,
    title: "Agende Consultas",
    subtitle: "Organize sua rotina sem conflitos de horário",
    description:
      "A Agenda oferece visualização por dia ou semana, com todos os atendimentos organizados por horário. Programe consultas, retornos, vacinas, cirurgias, banho & tosa e exames — com duração personalizada, veterinário responsável e recorrência.",
    highlights: [
      "Visualização diária e semanal por horário",
      "8 tipos de atendimento com status em tempo real",
      "Recorrência semanal, quinzenal ou mensal",
      "Comprovante de agendamento para o tutor",
    ],
    tip: "Use os agendamentos recorrentes para vacinas e retornos periódicos — o sistema detecta conflitos automaticamente.",
  },
  {
    icon: BedDouble,
    title: "Realize Internações",
    subtitle: "Controle total dos pacientes hospitalizados",
    description:
      "No módulo de Internação, admita animais, atribua um leito ou box, registre o motivo e o veterinário responsável. Cada internação tem ficha com evolução clínica diária, prescrições e um checklist de administrações por horário.",
    highlights: [
      "Controle de boxes com status de ocupação",
      "Prescrições com dose, via e frequência (SID/BID/TID/QID)",
      "Checklist de administrações com registro de horário",
      "Alta médica com histórico completo vinculado ao pet",
    ],
    tip: "A internação gera prontuário automático vinculado ao pet — tudo fica salvo no histórico clínico do animal.",
  },
  {
    icon: Receipt,
    title: "Financeiro do Pet",
    subtitle: "Extrato detalhado na página de cada paciente",
    description:
      "Dentro do perfil de cada pet há um histórico financeiro completo: todos os atendimentos realizados, procedimentos cobrados e o status de pagamento de cada lançamento. Ideal para apresentar ao tutor ou verificar pendências de um paciente.",
    highlights: [
      "Cobranças organizadas por animal",
      "Vínculo direto entre atendimento e lançamento",
      "Status de pagamento por procedimento",
      "Extrato por período para apresentar ao tutor",
    ],
    tip: "Vendas finalizadas no PDV e vinculadas a um pet aparecem automaticamente no histórico financeiro do animal.",
  },
  {
    icon: ShoppingCart,
    title: "PDV — Produtos e Serviços",
    subtitle: "Venda com agilidade no balcão ou na consulta",
    description:
      "No módulo de PDV, monte o carrinho com produtos do estoque (ração, medicamentos, acessórios) e serviços da clínica (consulta, banho, vacina). Selecione a forma de pagamento, finalize a venda e o sistema desconta o estoque e lança a receita no financeiro.",
    highlights: [
      "Catálogo de produtos e serviços com preço e estoque",
      "Pagamento por dinheiro, cartão, PIX ou boleto",
      "Baixa automática no estoque a cada venda",
      "Lançamento automático no módulo financeiro",
    ],
    tip: "Configure estoque mínimo nos produtos — o sistema alerta quando estiver acabando, evitando ruptura de itens essenciais.",
  },
  {
    icon: TrendingUp,
    title: "Módulo Financeiro",
    subtitle: "Visão completa da saúde financeira da clínica",
    description:
      "No módulo Financeiro, registre receitas e despesas, gerencie contas bancárias, categorize lançamentos e monitore o que está pago, pendente ou vencido. Os KPIs no topo mostram em tempo real o que você recebeu, gastou e ainda tem a receber no mês.",
    highlights: [
      "KPIs de receitas, despesas, a receber e a pagar",
      "Múltiplas contas: corrente, poupança, caixa, cartão",
      "Categorias personalizadas de receita e despesa",
      "Exportação de relatórios em CSV por período",
    ],
    tip: "O Dashboard exibe os principais indicadores financeiros do dia ao abrir a plataforma — consulte-o diariamente.",
  },
];

export function OnboardingModal() {
  const { user } = useSessionStore();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (!user?.id) return;
    if (!localStorage.getItem(`${STORAGE_KEY}_${user.id}`)) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [user?.id]);

  function dismiss() {
    if (!user?.id) return;
    localStorage.setItem(`${STORAGE_KEY}_${user.id}`, "1");
    setOpen(false);
  }

  function goNext() {
    if (step === steps.length - 1) { dismiss(); return; }
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goPrev() {
    if (step === 0) return;
    setDirection(-1);
    setStep((s) => s - 1);
  }

  function goTo(i: number) {
    setDirection(i > step ? 1 : -1);
    setStep(i);
  }

  if (!open) return null;

  const current = steps[step];
  const Icon = current.icon;
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.45, bounce: 0.1 }}
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex"
        style={{ minHeight: 540 }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
        <div
          className="relative hidden sm:flex flex-col w-[268px] shrink-0 p-7 overflow-hidden"
          style={{ background: BRAND }}
        >
          {/* Subtle radial glow on top-right using accent */}
          <div
            className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20"
            style={{ background: `radial-gradient(circle, ${ACCENT}, transparent 70%)` }}
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-16 w-52 h-52 rounded-full opacity-10"
            style={{ background: `radial-gradient(circle, ${ACCENT}, transparent 70%)` }}
          />

          {/* Logo */}
          <div className="relative z-10 flex flex-col items-center mb-7">
            <div className="w-20 h-20 rounded-2xl overflow-hidden mb-3 shadow-lg"
              style={{ boxShadow: `0 8px 24px rgba(0,0,0,0.3)` }}>
              <Image
                src="/images/logo-fundo.png"
                alt="DrVet"
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            </div>
            <span
              className="text-base font-bold tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              DrVet
            </span>
            <span
              className="text-[11px] mt-0.5 tracking-wide"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Clínica Veterinária Digital
            </span>
          </div>

          {/* Divider */}
          <div className="relative z-10 mb-4 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />

          {/* Step list */}
          <div className="relative z-10 flex-1 space-y-0.5 overflow-y-auto">
            {steps.map((s, i) => {
              const StepIcon = s.icon;
              const isDone = i < step;
              const isCurrent = i === step;
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-200"
                  style={{
                    background: isCurrent ? "rgba(45,198,198,0.18)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent)
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent)
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {/* Bullet */}
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all"
                    style={{
                      background: isCurrent
                        ? ACCENT
                        : isDone
                        ? "rgba(45,198,198,0.35)"
                        : "rgba(255,255,255,0.12)",
                    }}
                  >
                    {isDone ? (
                      <Check className="w-2.5 h-2.5 text-white" />
                    ) : (
                      <span
                        className="text-[9px] font-bold"
                        style={{ color: isCurrent ? BRAND : "rgba(255,255,255,0.6)" }}
                      >
                        {i + 1}
                      </span>
                    )}
                  </div>

                  <span
                    className="text-[12px] font-medium leading-tight truncate transition-colors"
                    style={{
                      color: isCurrent
                        ? "rgba(255,255,255,0.95)"
                        : isDone
                        ? "rgba(255,255,255,0.55)"
                        : "rgba(255,255,255,0.38)",
                    }}
                  >
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="relative z-10 mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex justify-between mb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                Progresso
              </span>
              <span className="text-[10px] font-semibold" style={{ color: ACCENT }}>
                {step + 1}/{steps.length}
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: ACCENT }}
                animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* Mobile-only progress bar */}
          <div className="sm:hidden h-1" style={{ background: "#f1f5f9" }}>
            <motion.div
              className="h-full"
              style={{ background: `linear-gradient(90deg, ${BRAND}, ${ACCENT})` }}
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Close */}
          <div className="flex justify-end px-6 pt-5">
            <button
              onClick={dismiss}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              aria-label="Fechar tutorial"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>

          {/* Content area */}
          <div className="flex-1 px-8 pb-2 overflow-y-auto">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                initial={{ opacity: 0, x: direction * 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -28 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* Icon + heading */}
                <div className="flex items-center gap-4 mb-5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{ background: BRAND_50 }}
                  >
                    <Icon className="w-6 h-6" style={{ color: BRAND }} />
                  </div>
                  <div>
                    <h2 className="text-[19px] font-bold leading-tight" style={{ color: BRAND }}>
                      {current.title}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">{current.subtitle}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[14px] leading-relaxed mb-5" style={{ color: "#374151" }}>
                  {current.description}
                </p>

                {/* Highlights */}
                <div className="space-y-2.5 mb-5">
                  {current.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: ACCENT_50 }}
                      >
                        <Check className="w-2.5 h-2.5" style={{ color: ACCENT }} />
                      </div>
                      <span className="text-[13px] text-gray-700 leading-snug">{h}</span>
                    </div>
                  ))}
                </div>

                {/* Tip */}
                <div
                  className="flex items-start gap-3 px-4 py-3 rounded-xl"
                  style={{
                    background: ACCENT_50,
                    borderLeft: `3px solid ${ACCENT}`,
                  }}
                >
                  <span className="shrink-0 text-base leading-tight">💡</span>
                  <p className="text-[13px] font-medium leading-relaxed" style={{ color: "#0e7b7b" }}>
                    {current.tip}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer nav */}
          <div className="px-8 py-5 flex items-center justify-between gap-3" style={{ borderTop: "1px solid #f1f5f9" }}>
            <button
              onClick={goPrev}
              disabled={isFirst}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 disabled:opacity-0 disabled:pointer-events-none transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </button>

            {/* Mobile dots */}
            <div className="flex sm:hidden items-center gap-1">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? 16 : 5,
                    height: 5,
                    background:
                      i === step ? BRAND : i < step ? `${ACCENT}66` : "#e5e7eb",
                  }}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              {!isLast && (
                <button
                  onClick={dismiss}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Pular
                </button>
              )}
              <button
                onClick={goNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
                style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #2F4FA8 50%, ${ACCENT} 100%)` }}
              >
                {isLast ? "Começar agora" : "Próximo"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
