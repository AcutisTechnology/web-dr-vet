"use client";
import { useState, useEffect, use, useMemo } from "react";
import {
  publicBookingService,
  type BookingClinicInfo,
  type BookingLookupPet,
  type BookingSlot,
} from "@/services/public-booking.service";
import {
  format,
  parseISO,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Stethoscope,
  RefreshCw,
  Syringe,
  Scissors,
  ClipboardList,
  Heart,
  BedDouble,
  MoreHorizontal,
  MapPin,
  Phone,
  ArrowRight,
  CalendarDays,
  Clock4,
  User2,
  PawPrint,
  Sparkles,
} from "lucide-react";

// ── WhatsApp URL ──────────────────────────────────────────────────────────────
function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const fullPhone = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}

// ── Phone mask ────────────────────────────────────────────────────────────────
function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2)  return digits.length ? `(${digits}` : "";
  if (digits.length <= 6)  return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
}

// ── Service icon map ──────────────────────────────────────────────────────────
const serviceIcons: Record<string, React.ElementType> = {
  Consulta: Stethoscope,
  Retorno: RefreshCw,
  Vacinação: Syringe,
  "Banho e Tosa": Scissors,
  Exame: ClipboardList,
  Cirurgia: Heart,
  Internação: BedDouble,
  Outro: MoreHorizontal,
};

// ── Species ───────────────────────────────────────────────────────────────────
const species = [
  { value: "dog",     emoji: "🐕", label: "Cachorro" },
  { value: "cat",     emoji: "🐱", label: "Gato"     },
  { value: "bird",    emoji: "🐦", label: "Pássaro"  },
  { value: "rabbit",  emoji: "🐰", label: "Coelho"   },
  { value: "reptile", emoji: "🦎", label: "Réptil"   },
  { value: "other",   emoji: "🐾", label: "Outro"    },
];

// ── Step labels ───────────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, label: "Serviço",   icon: Stethoscope  },
  { num: 2, label: "Data",      icon: CalendarDays },
  { num: 3, label: "Horário",   icon: Clock4       },
  { num: 4, label: "Seus dados",icon: User2        },
];

// ── Mini Calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({
  value,
  onChange,
  primaryColor,
  accentColor,
}: {
  value: string;
  onChange: (d: string) => void;
  primaryColor: string;
  accentColor: string;
}) {
  const today = startOfDay(new Date());
  const [viewDate, setViewDate] = useState(today);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 });
    const end   = endOfWeek(endOfMonth(viewDate),     { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewDate]);

  const selected = value ? parseISO(value) : null;

  return (
    <div className="select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewDate((d) => subMonths(d, 1))}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#eef1fa] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" style={{ color: primaryColor }} />
        </button>
        <span className="text-sm font-semibold capitalize" style={{ color: primaryColor }}>
          {format(viewDate, "MMMM yyyy", { locale: ptBR })}
        </span>
        <button
          onClick={() => setViewDate((d) => addMonths(d, 1))}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#eef1fa] transition-colors"
        >
          <ChevronRight className="w-4 h-4" style={{ color: primaryColor }} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-[#5e6b85] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const past      = isBefore(day, today);
          const otherMonth= !isSameMonth(day, viewDate);
          const isSelected= selected ? isSameDay(day, selected) : false;
          const todayDay  = isToday(day);

          return (
            <button
              key={day.toISOString()}
              disabled={past || otherMonth}
              onClick={() => onChange(format(day, "yyyy-MM-dd"))}
              className={[
                "h-9 w-9 mx-auto rounded-full text-sm font-medium transition-all flex items-center justify-center",
                otherMonth
                  ? "opacity-0 pointer-events-none"
                  : past
                  ? "text-[#c5ccda] cursor-not-allowed"
                  : isSelected
                  ? "text-white shadow-md scale-105"
                  : todayDay
                  ? "border-2 font-bold"
                  : "text-[#172033] hover:bg-[#eef1fa]",
              ].join(" ")}
              style={
                otherMonth || past
                  ? undefined
                  : isSelected
                  ? { background: primaryColor }
                  : todayDay
                  ? { borderColor: accentColor, color: primaryColor }
                  : undefined
              }
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PublicBookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [step,       setStep]       = useState(1);
  const [clinicInfo, setClinicInfo] = useState<BookingClinicInfo | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  const [selectedService, setSelectedService] = useState("");
  const [selectedDate,    setSelectedDate]    = useState("");

  const [slots,         setSlots]        = useState<BookingSlot[]>([]);
  const [slotsLoading,  setSlotsLoading] = useState(false);
  const [selectedSlot,  setSelectedSlot] = useState<BookingSlot | null>(null);

  const [form, setForm] = useState({
    client_name:  "",
    client_phone: "",
    client_email: "",
    pet_id:       "",
    pet_name:     "",
    pet_species:  "dog",
  });

  const [knownPets, setKnownPets] = useState<BookingLookupPet[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);

  const [submitting,   setSubmitting]   = useState(false);
  const [confirmation, setConfirmation] = useState<{
    date: string; start_time: string; end_time: string;
    service_type: string; client_name: string; pet_name: string;
  } | null>(null);

  useEffect(() => {
    publicBookingService
      .getClinic(token)
      .then(setClinicInfo)
      .catch(() => setError("Este link de agendamento não está disponível."))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    const digits = form.client_phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setKnownPets([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLookupLoading(true);
      try {
        const data = await publicBookingService.lookupClient(token, {
          client_phone: form.client_phone,
          client_email: form.client_email || undefined,
        });
        setKnownPets(data.pets);
        if (data.client?.name && !form.client_name) {
          setForm((current) => ({ ...current, client_name: data.client?.name ?? current.client_name }));
        }
      } catch {
        setKnownPets([]);
      } finally {
        setLookupLoading(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [form.client_email, form.client_name, form.client_phone, token]);

  const loadSlots = async (date: string) => {
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSlot(null);
    try {
      const data = await publicBookingService.getSlots(token, date);
      setSlots(data);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (date) loadSlots(date);
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      const result = await publicBookingService.book(token, {
        ...form,
        pet_id: form.pet_id || undefined,
        service_type: selectedService,
        date: selectedDate,
        start_time: selectedSlot.start,
      });
      setConfirmation(result.appointment);
      setStep(5);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message ?? "Erro ao realizar agendamento. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1b2a6b 0%,#223783 50%,#1cafaf 100%)" }}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mx-auto">
            <PawPrint className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-white/70 text-sm font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !clinicInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7fafc]">
        <div className="text-center space-y-5 px-6 max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-[#eef1fa] flex items-center justify-center mx-auto">
            <PawPrint className="w-10 h-10 text-[#c5ccda]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#172033] mb-1">Link indisponível</h2>
            <p className="text-[#5e6b85] text-sm leading-relaxed">
              {error ?? "Este link de agendamento não existe ou foi desativado pela clínica."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const primaryColor = clinicInfo.customization?.primary_color ?? "#1b2a6b";
  const accentColor  = clinicInfo.customization?.accent_color  ?? "#2dc6c6";
  const headline     = clinicInfo.customization?.headline     ?? "Agendamento Online";
  const subtitle     = clinicInfo.customization?.subtitle     ?? null;
  const welcomeMsg   = clinicInfo.customization?.welcome_message ?? null;
  const logoUrl      = clinicInfo.customization?.logo_url     ?? null;
  const bannerUrl    = clinicInfo.customization?.banner_url   ?? null;

  const ServiceIcon = serviceIcons[selectedService] ?? Stethoscope;

  return (
    <div className="min-h-screen bg-[#f7fafc] font-[Poppins,sans-serif]">

      {/* ── Hero Header ───────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={
          bannerUrl
            ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 55%, ${accentColor} 100%)` }
        }
      >
        {/* Bottom gradient for text readability over banner */}
        {bannerUrl && (
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.45) 100%)" }} />
        )}
        {/* Decorative blobs (only without banner) */}
        {!bannerUrl && (
          <>
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10"
              style={{ background: accentColor }} />
            <div className="absolute -bottom-12 -left-10 w-48 h-48 rounded-full opacity-10"
              style={{ background: accentColor }} />
          </>
        )}

        <div className="relative max-w-lg mx-auto px-5 pt-10 pb-16">
          {/* Logo area */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shadow-lg overflow-hidden">
              {logoUrl
                ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                : <PawPrint className="w-6 h-6 text-white" />
              }
            </div>
            <div>
              <p className="text-white/60 text-[11px] font-medium uppercase tracking-widest">{headline}</p>
              <h1 className="text-white font-bold text-lg leading-tight">{clinicInfo.clinic.name}</h1>
              {subtitle && <p className="text-white/75 text-xs mt-0.5">{subtitle}</p>}
            </div>
          </div>

          {/* Clinic info */}
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full text-white/80 text-xs font-medium">
              <MapPin className="w-3 h-3" /> {clinicInfo.clinic.city}, {clinicInfo.clinic.state}
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full text-white/80 text-xs font-medium">
              <Phone className="w-3 h-3" /> {clinicInfo.clinic.phone}
            </span>
          </div>
        </div>
      </div>

      {/* ── Progress stepper ──────────────────────────────────────────────── */}
      {step < 5 && (
        <div className="max-w-lg mx-auto px-5 -mt-6 mb-2 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg border border-[#dde3ee] px-4 py-3">
            <div className="flex items-center justify-between">
              {STEPS.map((s, i) => {
                const done    = step > s.num;
                const active  = step === s.num;
                const Icon    = s.icon;
                return (
                  <div key={s.num} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1 min-w-0">
                      <div
                        className={[
                          "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                          done   ? ""
                                 : active ? "ring-4"
                                 : "bg-[#eef2f7]",
                        ].join(" ")}
                        style={
                          done
                            ? { background: accentColor }
                            : active
                            ? { background: primaryColor }
                            : undefined
                        }
                      >
                        {done
                          ? <CheckCircle2 className="w-4 h-4 text-white" />
                          : <Icon className={`w-3.5 h-3.5 ${active ? "text-white" : "text-[#c5ccda]"}`} />
                        }
                      </div>
                      <span
                        className="text-[10px] font-semibold whitespace-nowrap"
                        style={{ color: active ? primaryColor : done ? accentColor : "#c5ccda" }}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className="flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all"
                        style={{ background: done ? accentColor : "#eef2f7" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-5 pb-12 space-y-4 mt-4">

        {/* Welcome message */}
        {step === 1 && welcomeMsg && (
          <div className="bg-white rounded-2xl border border-[#dde3ee] shadow-sm px-5 py-4">
            <p className="text-sm text-[#5e6b85] leading-relaxed">{welcomeMsg}</p>
          </div>
        )}

        {/* ─── STEP 1: Serviço ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-[#dde3ee] shadow-sm overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-[#eef2f7]">
              <h2 className="text-lg font-bold text-[#172033]">Qual serviço você precisa?</h2>
              <p className="text-sm text-[#5e6b85] mt-0.5">Selecione o tipo de atendimento</p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2.5">
              {clinicInfo.services.map((service) => {
                const Icon    = serviceIcons[service] ?? MoreHorizontal;
                const active  = selectedService === service;
                return (
                  <button
                    key={service}
                    onClick={() => setSelectedService(service)}
                    className={[
                      "relative flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all",
                      active
                        ? ""
                        : "border-[#eef2f7] hover:border-[#c5ccda] hover:bg-[#f7fafc]",
                    ].join(" ")}
                    style={active ? { borderColor: primaryColor, background: primaryColor } : undefined}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${active ? "bg-white/15" : "bg-[#eef1fa]"}`}>
                      <Icon className={`w-4.5 h-4.5 ${active ? "text-white" : ""}`} style={{ width: 18, height: 18, color: active ? "white" : primaryColor }} />
                    </div>
                    <span className={`text-sm font-semibold leading-tight ${active ? "text-white" : "text-[#172033]"}`}>
                      {service}
                    </span>
                    {active && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2dc6c6]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="px-4 pb-4">
              <button
                disabled={!selectedService}
                onClick={() => setStep(2)}
                className={[
                  "w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
                  selectedService
                    ? "text-white shadow-md"
                    : "bg-[#eef2f7] text-[#c5ccda] cursor-not-allowed",
                ].join(" ")}
                style={selectedService ? { background: primaryColor } : undefined}
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Data ─────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-[#dde3ee] shadow-sm overflow-hidden">
            {/* Back + title */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[#eef2f7]">
              <button
                onClick={() => setStep(1)}
                className="w-8 h-8 rounded-full border border-[#dde3ee] flex items-center justify-center hover:bg-[#f7fafc] transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-[#5e6b85]" />
              </button>
              <div className="flex-1">
                <h2 className="text-base font-bold text-[#172033]">Escolha a data</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-5 h-5 rounded-md bg-[#eef1fa] flex items-center justify-center">
                    <ServiceIcon className="text-[#1b2a6b]" style={{ width: 11, height: 11 }} />
                  </div>
                  <span className="text-xs text-[#5e6b85] font-medium">{selectedService}</span>
                </div>
              </div>
            </div>

            <div className="p-5">
              <MiniCalendar value={selectedDate} onChange={handleDateChange} primaryColor={primaryColor} accentColor={accentColor} />
            </div>

            {selectedDate && (
              <div className="px-4 pb-4">
                <div className="bg-[#eef1fa] rounded-xl px-4 py-3 flex items-center gap-2 mb-3">
                  <CalendarDays className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
                  <span className="text-sm font-semibold capitalize" style={{ color: primaryColor }}>
                    {format(parseISO(selectedDate), "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all"
                  style={{ background: primaryColor }}
                >
                  Ver horários disponíveis <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 3: Horário ──────────────────────────────────────────── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-[#dde3ee] shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[#eef2f7]">
              <button
                onClick={() => setStep(2)}
                className="w-8 h-8 rounded-full border border-[#dde3ee] flex items-center justify-center hover:bg-[#f7fafc] transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-[#5e6b85]" />
              </button>
              <div className="flex-1">
                <h2 className="text-base font-bold text-[#172033]">Escolha o horário</h2>
                <p className="text-xs text-[#5e6b85] font-medium capitalize mt-0.5">
                  {selectedService} · {selectedDate ? format(parseISO(selectedDate), "d 'de' MMMM", { locale: ptBR }) : ""}
                </p>
              </div>
            </div>

            <div className="p-5">
              {slotsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-[#1b2a6b]" />
                  <p className="text-sm text-[#5e6b85]">Buscando horários...</p>
                </div>
              ) : slots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#eef2f7] flex items-center justify-center">
                    <Clock4 className="w-7 h-7 text-[#c5ccda]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#172033]">Sem horários disponíveis</p>
                    <p className="text-sm text-[#5e6b85] mt-1">Não há vagas nesta data. Tente outro dia.</p>
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="text-[#1b2a6b] text-sm font-semibold underline underline-offset-2"
                  >
                    Escolher outra data
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-[#5e6b85] font-medium mb-3">
                    {slots.length} {slots.length === 1 ? "horário disponível" : "horários disponíveis"}
                  </p>
                  <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                    {slots.map((slot) => {
                      const active = selectedSlot?.start === slot.start;
                      return (
                        <button
                          key={slot.start}
                          onClick={() => setSelectedSlot(slot)}
                          className={[
                            "py-3 rounded-xl border-2 text-sm font-bold transition-all",
                            active
                              ? "text-white shadow-md scale-105"
                              : "border-[#eef2f7] text-[#172033] hover:bg-[#eef1fa]",
                          ].join(" ")}
                          style={active ? { borderColor: primaryColor, background: primaryColor } : undefined}
                        >
                          {slot.start}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {selectedSlot && (
              <div className="px-4 pb-4">
                <div className="bg-[#eef1fa] rounded-xl px-4 py-3 flex items-center gap-2 mb-3">
                  <Clock4 className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
                  <span className="text-sm font-semibold" style={{ color: primaryColor }}>
                    {selectedSlot.start} – {selectedSlot.end}
                  </span>
                </div>
                <button
                  onClick={() => setStep(4)}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all"
                  style={{ background: primaryColor }}
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 4: Tutor e pet ──────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-3">
            {/* Summary pill */}
            <div className="bg-white rounded-2xl border border-[#dde3ee] shadow-sm px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => setStep(3)}
                className="w-8 h-8 rounded-full border border-[#dde3ee] flex items-center justify-center hover:bg-[#f7fafc] transition-colors shrink-0"
              >
                <ChevronLeft className="w-4 h-4 text-[#5e6b85]" />
              </button>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 bg-[#eef1fa] text-[#1b2a6b] text-xs font-semibold px-2.5 py-1 rounded-full">
                  <ServiceIcon style={{ width: 11, height: 11 }} /> {selectedService}
                </span>
                <span className="inline-flex items-center gap-1 bg-[#e8fafa] text-[#1cafaf] text-xs font-semibold px-2.5 py-1 rounded-full">
                  <CalendarDays style={{ width: 11, height: 11 }} />
                  {selectedDate ? format(parseISO(selectedDate), "d MMM", { locale: ptBR }) : ""}
                </span>
                <span className="inline-flex items-center gap-1 bg-[#eef1fa] text-[#1b2a6b] text-xs font-semibold px-2.5 py-1 rounded-full">
                  <Clock4 style={{ width: 11, height: 11 }} /> {selectedSlot?.start}
                </span>
              </div>
            </div>

            {/* Client data */}
            <div className="bg-white rounded-2xl border border-[#dde3ee] shadow-sm overflow-hidden">
              <div className="px-6 pt-6 pb-4 border-b border-[#eef2f7]">
                <h2 className="text-base font-bold text-[#172033]">Identifique o tutor</h2>
                <p className="text-xs text-[#5e6b85] mt-0.5">Use o mesmo WhatsApp cadastrado na clínica para localizar seus pets</p>
              </div>
              <div className="p-5 space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#5e6b85] uppercase tracking-wide">Nome completo *</label>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={form.client_name}
                    onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
                    className="w-full border border-[#dde3ee] rounded-xl px-4 py-3 text-sm text-[#172033] placeholder:text-[#c5ccda] focus:outline-none focus:border-[#1b2a6b] focus:ring-2 focus:ring-[#1b2a6b]/10 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#5e6b85] uppercase tracking-wide">WhatsApp / Telefone *</label>
                  <input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={form.client_phone}
                    onChange={(e) => setForm((f) => ({ ...f, client_phone: maskPhone(e.target.value), pet_id: "" }))}
                    maxLength={16}
                    className="w-full border border-[#dde3ee] rounded-xl px-4 py-3 text-sm text-[#172033] placeholder:text-[#c5ccda] focus:outline-none focus:border-[#1b2a6b] focus:ring-2 focus:ring-[#1b2a6b]/10 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#5e6b85] uppercase tracking-wide">E-mail <span className="normal-case font-normal">(opcional)</span></label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={form.client_email}
                    onChange={(e) => setForm((f) => ({ ...f, client_email: e.target.value, pet_id: "" }))}
                    className="w-full border border-[#dde3ee] rounded-xl px-4 py-3 text-sm text-[#172033] placeholder:text-[#c5ccda] focus:outline-none focus:border-[#1b2a6b] focus:ring-2 focus:ring-[#1b2a6b]/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Pet data */}
            <div className="bg-white rounded-2xl border border-[#dde3ee] shadow-sm overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-[#eef2f7] flex items-center gap-2">
                <PawPrint className="w-4 h-4 text-[#2dc6c6]" />
                <h2 className="text-base font-bold text-[#172033]">Selecione o pet</h2>
              </div>
              <div className="p-5 space-y-3.5">
                {lookupLoading && (
                  <div className="flex items-center gap-2 rounded-xl bg-[#eef1fa] px-4 py-3 text-xs font-semibold text-[#5e6b85]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando pets cadastrados...
                  </div>
                )}

                {knownPets.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#5e6b85] uppercase tracking-wide">Pets encontrados</label>
                    <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
                      {knownPets.map((pet) => {
                        const active = form.pet_id === pet.id;
                        const sp = species.find((item) => item.value === pet.species) ?? species[5];
                        return (
                          <button
                            key={pet.id}
                            type="button"
                            onClick={() => setForm((f) => ({
                              ...f,
                              pet_id: pet.id,
                              pet_name: pet.name,
                              pet_species: pet.species,
                            }))}
                            className={[
                              "min-w-36 rounded-2xl border-2 px-4 py-3 text-left transition-all",
                              active ? "shadow-md" : "border-[#eef2f7] hover:border-[#c5ccda]",
                            ].join(" ")}
                            style={active ? { borderColor: primaryColor, background: primaryColor } : undefined}
                          >
                            <span className="text-2xl leading-none">{sp.emoji}</span>
                            <span className={`mt-2 block text-sm font-bold ${active ? "text-white" : "text-[#172033]"}`}>{pet.name}</span>
                            <span className={`block text-[11px] ${active ? "text-white/75" : "text-[#5e6b85]"}`}>{pet.breed || sp.label}</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, pet_id: "", pet_name: "", pet_species: "dog" }))}
                        className="min-w-36 rounded-2xl border-2 border-dashed border-[#c5ccda] px-4 py-3 text-left text-[#5e6b85] transition-all hover:bg-[#f7fafc]"
                      >
                        <span className="text-2xl leading-none">+</span>
                        <span className="mt-2 block text-sm font-bold text-[#172033]">Outro pet</span>
                        <span className="block text-[11px]">Cadastrar agora</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#5e6b85] uppercase tracking-wide">Nome do pet *</label>
                  <input
                    type="text"
                    placeholder="Como seu pet se chama?"
                    value={form.pet_name}
                    onChange={(e) => setForm((f) => ({ ...f, pet_id: "", pet_name: e.target.value }))}
                    className="w-full border border-[#dde3ee] rounded-xl px-4 py-3 text-sm text-[#172033] placeholder:text-[#c5ccda] focus:outline-none focus:border-[#1b2a6b] focus:ring-2 focus:ring-[#1b2a6b]/10 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#5e6b85] uppercase tracking-wide">Espécie *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {species.map((sp) => {
                      const active = form.pet_species === sp.value;
                      return (
                        <button
                          key={sp.value}
                          onClick={() => setForm((f) => ({ ...f, pet_id: "", pet_species: sp.value }))}
                          className={[
                            "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all",
                            active
                              ? ""
                              : "border-[#eef2f7] hover:border-[#c5ccda]",
                          ].join(" ")}
                          style={active ? { borderColor: primaryColor, background: primaryColor } : undefined}
                        >
                          <span className="text-2xl leading-none">{sp.emoji}</span>
                          <span className={`text-[11px] font-semibold ${active ? "text-white" : "text-[#5e6b85]"}`}>
                            {sp.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              disabled={!form.client_name || form.client_phone.replace(/\D/g,"").length < 10 || !form.pet_name || submitting}
              onClick={handleBook}
              className={[
                "w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all",
                form.client_name && form.client_phone.replace(/\D/g,"").length >= 10 && form.pet_name && !submitting
                  ? "text-white shadow-lg"
                  : "bg-[#eef2f7] text-[#c5ccda] cursor-not-allowed",
              ].join(" ")}
              style={
                form.client_name && form.client_phone.replace(/\D/g,"").length >= 10 && form.pet_name && !submitting
                  ? { background: primaryColor }
                  : undefined
              }
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Confirmando agendamento...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Confirmar Agendamento</>
              )}
            </button>

            <p className="text-center text-[11px] text-[#5e6b85]">
              Ao confirmar, você concorda com os termos de atendimento da clínica.
            </p>
          </div>
        )}

        {/* ─── STEP 5: Confirmação ──────────────────────────────────────── */}
        {step === 5 && confirmation && (() => {
          const formattedDate = format(parseISO(confirmation.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
          const waMsg = [
            "Ol\u00E1! Acabei de realizar um agendamento \u2705",
            "",
            "\uD83D\uDC3E *Pet:* " + confirmation.pet_name,
            "\uD83D\uDCCB *Servi\u00E7o:* " + confirmation.service_type,
            "\uD83D\uDCC5 *Data:* " + formattedDate,
            "\u23F0 *Hor\u00E1rio:* " + confirmation.start_time + " \u2013 " + confirmation.end_time,
            "\uD83C\uDFE5 *Cl\u00EDnica:* " + clinicInfo.clinic.name,
            "",
            "Aguardo a confirma\u00E7\u00E3o! \uD83D\uDE4F",
          ].join("\n");
          const waUrl = buildWhatsAppUrl(clinicInfo.clinic.phone, waMsg);
          return (
          <div className="space-y-4">
            {/* Success hero */}
            <div
              className="relative overflow-hidden rounded-2xl px-6 py-8 text-center"
              style={{ background: "linear-gradient(135deg,#1b2a6b 0%,#223783 60%,#2dc6c6 100%)" }}
            >
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-[#2dc6c6]" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Agendamento confirmado!</h2>
                <p className="text-white/70 text-sm">
                  Até breve, <span className="text-white font-semibold">{confirmation.client_name.split(" ")[0]}</span>! 🐾
                </p>
              </div>
            </div>

            {/* Details card */}
            <div className="bg-white rounded-2xl border border-[#dde3ee] shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#eef2f7]">
                <p className="text-xs font-semibold text-[#5e6b85] uppercase tracking-wide">Detalhes do agendamento</p>
              </div>
              <div className="divide-y divide-[#f3f5f9]">
                {[
                  { label: "Serviço",  value: confirmation.service_type },
                  { label: "Data",     value: format(parseISO(confirmation.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }) },
                  { label: "Horário",  value: `${confirmation.start_time} – ${confirmation.end_time}` },
                  { label: "Pet",      value: confirmation.pet_name },
                  { label: "Clínica",  value: clinicInfo.clinic.name },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center px-5 py-3.5">
                    <span className="text-xs text-[#5e6b85] font-medium">{label}</span>
                    <span className="text-sm font-semibold text-[#172033] text-right max-w-[55%] capitalize">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all"
              style={{ background: "#25D366", color: "#fff", boxShadow: "0 8px 24px rgba(37,211,102,0.25)" }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Confirmar pelo WhatsApp
            </a>

            {/* Contact footer */}
            <div className="bg-[#eef1fa] rounded-2xl px-5 py-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1b2a6b]/10 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-[#1b2a6b]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1b2a6b]">Precisa remarcar ou cancelar?</p>
                <p className="text-xs text-[#5e6b85] mt-0.5">
                  Entre em contato: <span className="font-semibold text-[#1b2a6b]">{clinicInfo.clinic.phone}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setStep(1);
                setSelectedService("");
                setSelectedDate("");
                setSelectedSlot(null);
                setConfirmation(null);
                setForm({ client_name: "", client_phone: "", client_email: "", pet_id: "", pet_name: "", pet_species: "dog" });
                setKnownPets([]);
              }}
              className="w-full py-3.5 rounded-xl border-2 border-[#dde3ee] text-sm font-semibold text-[#5e6b85] hover:border-[#1b2a6b] hover:text-[#1b2a6b] transition-all"
            >
              Fazer novo agendamento
            </button>
          </div>
          );
        })()}
      </div>

      {/* Footer */}
      <div className="text-center pb-8 pt-4">
        <p className="text-[11px] text-[#c5ccda]">Powered by <span className="font-semibold text-[#5e6b85]">DrVet</span></p>
      </div>
    </div>
  );
}
