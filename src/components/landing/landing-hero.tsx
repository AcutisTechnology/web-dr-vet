"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
  ClipboardList,
  Syringe,
  TrendingUp,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";

const SP: Record<string, string> = { dog: "Cão", cat: "Gato" };

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 overflow-hidden flex items-center justify-center shadow-md shrink-0">
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

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          {(
            [
              ["#funcionalidades", "Funcionalidades"],
              ["#depoimentos", "Depoimentos"],
              ["#plano", "Plano"],
            ] as [string, string][]
          ).map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="hover:text-[#1B2A6B] transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-[#1B2A6B] transition-colors px-3 py-1.5"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="text-sm font-semibold bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white px-5 py-2 rounded-full hover:shadow-lg hover:shadow-cyan-200 hover:scale-105 transition-all duration-200"
          >
            Teste grátis
          </Link>
        </div>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 bg-white border-t ${
          menuOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col px-6 py-4 gap-4 text-sm font-medium">
          {(
            [
              ["#funcionalidades", "Funcionalidades"],
              ["#depoimentos", "Depoimentos"],
              ["#plano", "Plano"],
            ] as [string, string][]
          ).map(([href, label]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
          <Link
            href="/cadastro"
            className="bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white text-center py-2.5 rounded-full font-semibold"
          >
            Teste grátis
          </Link>
        </div>
      </div>
    </header>
  );
}

export function LandingHero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-[#1B2A6B]/10 opacity-60 rounded-full"
          style={{ animation: "blob 9s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-32 -right-20 w-[440px] h-[440px] bg-[#2DC6C6]/15 opacity-60 rounded-full"
          style={{ animation: "blob 9s ease-in-out infinite 4s" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-14 items-center w-full">
        {/* left */}
        <div
          className="space-y-7"
          style={{ animation: "fadeInUp .8s ease both" }}
        >
          <div className="inline-flex items-center gap-2 bg-[#1B2A6B]/5 border border-[#1B2A6B]/20 text-[#1B2A6B] text-xs font-semibold px-4 py-1.5 rounded-full">
            <Zap className="w-3.5 h-3.5" />
            Sistema completo para clínicas veterinárias
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
            Gerencie sua{" "}
            <span className="bg-gradient-to-r from-[#1B2A6B] via-[#2DC6C6] to-[#2DC6C6] bg-clip-text text-transparent">
              clínica veterinária
            </span>{" "}
            com inteligência
          </h1>

          <p className="text-xl text-gray-500 leading-relaxed max-w-lg">
            Prontuário digital, agenda integrada, PDV, estoque e muito mais em
            um único sistema pensado por veterinários, para veterinários.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/cadastro"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#1B2A6B] to-[#2DC6C6] text-white font-semibold px-7 py-3.5 rounded-full shadow-lg hover:shadow-cyan-300 hover:scale-105 transition-all duration-200 text-base"
            >
              Começar grátis <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#funcionalidades"
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 font-semibold px-7 py-3.5 rounded-full hover:border-[#2DC6C6] hover:text-[#1B2A6B] transition-all duration-200 text-base"
            >
              Ver funcionalidades
            </a>
          </div>

          <div className="flex flex-wrap gap-6 pt-1 text-sm text-gray-500">
            {[
              "Sem cartão de crédito",
              "14 dias grátis",
              "Cancele quando quiser",
            ].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* right – mock dashboard */}
        <div
          className="hidden md:block relative"
          style={{ animation: "float 4s ease-in-out infinite" }}
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 space-y-4 ml-6">
            {/* header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                  <Image
                    src="/images/logo.jpeg"
                    alt="DrVet"
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
                <span className="font-bold text-sm">DrVet</span>
              </div>
              <span className="text-xs text-gray-400">Qui, 27 fev</span>
            </div>

            {/* stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  l: "Consultas hoje",
                  v: "12",
                  c: "bg-[#1B2A6B]/8 text-[#1B2A6B]",
                },
                {
                  l: "Receita/mês",
                  v: "R$ 18k",
                  c: "bg-[#2DC6C6]/15 text-[#1B2A6B]",
                },
                {
                  l: "Pacientes",
                  v: "347",
                  c: "bg-emerald-50 text-emerald-700",
                },
              ].map((s) => (
                <div key={s.l} className={`rounded-xl p-3 ${s.c}`}>
                  <p className="text-xs opacity-70">{s.l}</p>
                  <p className="text-lg font-bold">{s.v}</p>
                </div>
              ))}
            </div>

            {/* appointments */}
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                Próximas consultas
              </p>
              <div className="space-y-2">
                {[
                  {
                    pet: "Thor",
                    sp: "🐕",
                    tu: "João S.",
                    h: "09:00",
                    sc: "bg-green-100 text-green-700",
                    lb: "Confirmado",
                  },
                  {
                    pet: "Mia",
                    sp: "🐱",
                    tu: "Ana P.",
                    h: "10:30",
                    sc: "bg-blue-100 text-blue-700",
                    lb: "Em atendimento",
                  },
                  {
                    pet: "Bob",
                    sp: "🐕",
                    tu: "Carlos M.",
                    h: "11:15",
                    sc: "bg-gray-100 text-gray-600",
                    lb: "Aguardando",
                  },
                ].map((a) => (
                  <div
                    key={a.pet}
                    className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{a.sp}</span>
                      <div>
                        <p className="text-xs font-semibold">{a.pet}</p>
                        <p className="text-xs text-gray-400">{a.tu}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold">{a.h}</p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${a.sc}`}
                      >
                        {a.lb}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* anamnese preview */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-[#1B2A6B]/5 to-[#2DC6C6]/10 rounded-xl p-3 border border-[#2DC6C6]/30">
              <div className="w-8 h-8 rounded-lg bg-[#1B2A6B]/10 flex items-center justify-center shrink-0">
                <Stethoscope className="w-4 h-4 text-[#1B2A6B]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">Anamnese – Thor</p>
                <p className="text-xs text-gray-500 truncate">
                  Vômito: Sim (agudo) · Apetite: Diminuído
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </div>
          </div>

          {/* floating badges */}
          <div
            className="absolute top-4 -right-6 bg-white shadow-xl rounded-2xl px-4 py-2.5 flex items-center gap-2 border border-gray-100"
            style={{ animation: "float 3s ease-in-out infinite" }}
          >
            <Syringe className="w-4 h-4 text-green-500" />
            <span className="text-xs font-semibold text-gray-700">
              +3 vacinas hoje
            </span>
          </div>
          <div
            className="absolute bottom-4 -left-6 bg-white shadow-xl rounded-2xl px-4 py-2.5 flex items-center gap-2 border border-gray-100"
            style={{ animation: "float 3.8s ease-in-out infinite .6s" }}
          >
            <TrendingUp className="w-4 h-4 text-[#1B2A6B]" />
            <span className="text-xs font-semibold text-gray-700">
              ↑ 18% este mês
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
