"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  Plus,
  Printer,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Link2,
  Copy,
  Check,
  Settings,
  BarChart3,
  Calendar,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock3,
  Globe,
  RotateCcw,
  X,
  Pencil,
  User,
  Palette,
  ImageIcon,
  FileText,
  Upload,
  Trash2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  parseISO,
  getMonth,
  getYear,
  addMonths,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  useAppointmentsByWeek,
  useAppointmentsByDate,
  useCreateAppointment,
  useUpdateAppointment,
  useAppointmentStats,
} from "@/hooks/use-appointments";
import { useClients, usePetsByClient } from "@/hooks/use-clients-pets";
import { useSessionStore } from "@/stores/session";
import { apiClient } from "@/lib/api-client";
import { supabase, LOGO_BUCKET } from "@/lib/supabase";
import type { Appointment } from "@/types";
import type { ApiAppointment } from "@/types/api";
import { formatDate } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ── Google Calendar types ───────────────────────────────────────────────────
interface GoogleCalEvent {
  id: string;
  summary?: string;
  start: { dateTime?: string; date?: string };
  end:   { dateTime?: string; date?: string };
  htmlLink?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              expires_in?: number;
              error?: string;
            }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

// ── Constants ──────────────────────────────────────────────────────────────────
const HOURS_START = 7;
const HOURS_END = 20;
const ROW_HEIGHT = 64; // px per hour

const statusColors: Record<
  string,
  "info" | "success" | "warning" | "secondary" | "destructive" | "default"
> = {
  scheduled: "info",
  confirmed: "success",
  in_progress: "warning",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "destructive",
};

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  in_progress: "Em atend.",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const statusBgColors: Record<string, string> = {
  scheduled: "bg-blue-100 border-blue-300 text-blue-800",
  confirmed: "bg-green-100 border-green-300 text-green-800",
  in_progress: "bg-yellow-100 border-yellow-300 text-yellow-800",
  completed: "bg-slate-100 border-slate-300 text-slate-700",
  cancelled: "bg-red-100 border-red-300 text-red-600",
  no_show: "bg-red-100 border-red-300 text-red-600",
};

const serviceTypes = [
  "Consulta",
  "Retorno",
  "Vacinação",
  "Banho e Tosa",
  "Exame",
  "Cirurgia",
  "Internação",
  "Outro",
];

const PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function AgendaPage() {
  const { toast } = useToast();
  const { user } = useSessionStore();

  const [mainTab, setMainTab] = useState<"calendario" | "estatisticas" | "personalizar">("calendario");
  const [view, setView] = useState<"day" | "week">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Floating popover
  const [popoverAppt, setPopoverAppt] = useState<Appointment | null>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);

  // Stats month
  const [statsDate, setStatsDate] = useState(new Date());

  // Booking config dialog
  const [bookingConfigOpen, setBookingConfigOpen] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [slotDuration, setSlotDuration] = useState(30);
  const [bookingServices, setBookingServices] = useState<string[]>([
    "Consulta", "Retorno", "Vacinação", "Banho e Tosa", "Exame",
  ]);
  const [workingHours, setWorkingHours] = useState<Record<string, { enabled: boolean; start: string; end: string }>>({
    mon: { enabled: true,  start: "08:00", end: "18:00" },
    tue: { enabled: true,  start: "08:00", end: "18:00" },
    wed: { enabled: true,  start: "08:00", end: "18:00" },
    thu: { enabled: true,  start: "08:00", end: "18:00" },
    fri: { enabled: true,  start: "08:00", end: "18:00" },
    sat: { enabled: false, start: "08:00", end: "12:00" },
    sun: { enabled: false, start: "08:00", end: "12:00" },
  });
  const [isSavingBooking, setIsSavingBooking] = useState(false);
  const [isRegeneratingToken, setIsRegeneratingToken] = useState(false);

  // Page customization
  const [pageClinicName, setPageClinicName] = useState("");
  const [pageHeadline, setPageHeadline] = useState("Agendamento Online");
  const [pageSubtitle, setPageSubtitle] = useState("");
  const [pagePrimaryColor, setPagePrimaryColor] = useState("#1b2a6b");
  const [pageAccentColor, setPageAccentColor] = useState("#2dc6c6");
  const [pageBannerUrl, setPageBannerUrl] = useState("");
  const [pageLogoUrl, setPageLogoUrl] = useState("");
  const [pageWelcomeMessage, setPageWelcomeMessage] = useState("");
  const [isSavingPage, setIsSavingPage] = useState(false);

  // Google Calendar integration
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID ?? "";
  const [googleCalendarId, setGoogleCalendarId] = useState("primary");
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalEvent[]>([]);
  const [googleEventsLoading, setGoogleEventsLoading] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [isSavingGoogle, setIsSavingGoogle] = useState(false);

  // Supabase upload
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [form, setForm] = useState({
    clientId: "",
    petId: "",
    vetId: "",
    serviceType: "Consulta",
    status: "scheduled" as string,
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    duration: "30",
    notes: "",
    recurring: false,
    recurringInterval: "weekly" as "weekly" | "biweekly" | "monthly",
    observations: "",
  });

  // ── Data fetching ──────────────────────────────────────────────────────────
  const weekQuery = useAppointmentsByWeek(currentDate);
  const dayQuery = useAppointmentsByDate(currentDate);
  const { data: clients = [] } = useClients();
  const { data: clientPets = [] } = usePetsByClient(form.clientId);
  const statsQuery = useAppointmentStats(getYear(statsDate), getMonth(statsDate) + 1);

  const createAppt = useCreateAppointment();
  const updateAppt = useUpdateAppointment();

  // Load booking config once on mount
  useEffect(() => {
    apiClient.get("/clinics/booking-config").then((res) => {
      const c = res.data;
      setClinicId(c.id);
      setPublicToken(c.public_token ?? null);
      setBookingEnabled(c.booking_enabled ?? false);
      setSlotDuration(c.booking_slot_duration ?? 30);
      if (c.booking_services?.length) setBookingServices(c.booking_services);
      if (c.booking_working_hours) setWorkingHours(c.booking_working_hours);
      if (c.name) setPageClinicName(c.name);
      if (c.booking_headline) setPageHeadline(c.booking_headline);
      if (c.booking_subtitle) setPageSubtitle(c.booking_subtitle);
      if (c.booking_primary_color) setPagePrimaryColor(c.booking_primary_color);
      if (c.booking_accent_color) setPageAccentColor(c.booking_accent_color);
      if (c.booking_logo_url) setPageLogoUrl(c.booking_logo_url);
      if (c.booking_banner_url) setPageBannerUrl(c.booking_banner_url);
      if (c.booking_welcome_message) setPageWelcomeMessage(c.booking_welcome_message);
      if (c.google_calendar_id) setGoogleCalendarId(c.google_calendar_id);
    }).catch(() => {/* silently ignore */});
  }, []);

  // Load Google Identity Services script
  useEffect(() => {
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      setGisLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGisLoaded(true);
    document.head.appendChild(script);

    // Restore saved token
    const token  = localStorage.getItem("drvet-goog-token");
    const expiry = localStorage.getItem("drvet-goog-expiry");
    if (token && expiry && Date.now() < parseInt(expiry)) {
      setGoogleAccessToken(token);
      setGoogleConnected(true);
    }
  }, []);

  // Fetch Google Calendar events whenever week or token changes
  useEffect(() => {
    if (!googleAccessToken || !googleConnected) return;
    const calId = googleCalendarId || "primary";
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const timeMin = weekStart.toISOString();
    const timeMax = addDays(weekStart, 7).toISOString();

    setGoogleEventsLoading(true);
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`
    );
    url.searchParams.set("timeMin", timeMin);
    url.searchParams.set("timeMax", timeMax);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");

    fetch(url.toString(), {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    })
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem("drvet-goog-token");
          localStorage.removeItem("drvet-goog-expiry");
          setGoogleAccessToken(null);
          setGoogleConnected(false);
          setGoogleEvents([]);
          toast({ title: "Sessão Google expirada. Reconecte.", variant: "destructive" });
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          const msg = data?.error?.message ?? `Erro ${res.status}`;
          toast({ title: `Google Calendar: ${msg}`, variant: "destructive" });
          console.error("Google Calendar API error:", data);
          return;
        }
        if (data?.items) setGoogleEvents(data.items as GoogleCalEvent[]);
      })
      .catch((err) => {
        console.error("Google Calendar fetch error:", err);
        toast({ title: "Falha ao buscar eventos do Google Calendar.", variant: "destructive" });
        setGoogleEvents([]);
      })
      .finally(() => setGoogleEventsLoading(false));
  }, [googleAccessToken, googleConnected, currentDate, googleCalendarId]);

  const isLoading = view === "week" ? weekQuery.isLoading : dayQuery.isLoading;

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i),
  );

  const dayAppointments = (day: Date) =>
    (weekQuery.data ?? [])
      .filter((a) => isSameDay(parseISO(a.date), day))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const currentDayAppointments = useMemo(
    () =>
      (dayQuery.data ?? []).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [dayQuery.data],
  );

  const refetch = () => {
    weekQuery.refetch();
    dayQuery.refetch();
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const calcEndTime = (start: string, dur: number) => {
    const [h, m] = start.split(":").map(Number);
    const total = h * 60 + m + dur;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  };

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const getApptStyle = (appt: Appointment) => {
    const startMins = timeToMinutes(appt.startTime) - HOURS_START * 60;
    const endMins = timeToMinutes(appt.endTime) - HOURS_START * 60;
    const top = (startMins / 60) * ROW_HEIGHT;
    const height = Math.max(((endMins - startMins) / 60) * ROW_HEIGHT, 20);
    return { top: `${top}px`, height: `${height}px` };
  };

  const getGoogleEventStyle = (event: GoogleCalEvent) => {
    if (!event.start.dateTime || !event.end.dateTime) return null;
    const startMins = timeToMinutes(format(parseISO(event.start.dateTime), "HH:mm")) - HOURS_START * 60;
    const endMins   = timeToMinutes(format(parseISO(event.end.dateTime),   "HH:mm")) - HOURS_START * 60;
    if (endMins <= 0 || startMins >= (HOURS_END - HOURS_START) * 60) return null;
    const top    = (Math.max(startMins, 0) / 60) * ROW_HEIGHT;
    const height = Math.max(((endMins - startMins) / 60) * ROW_HEIGHT, 20);
    return { top: `${top}px`, height: `${height}px` };
  };

  // ── Dialog helpers ─────────────────────────────────────────────────────────
  const openNew = () => {
    setEditingAppt(null);
    setForm({
      clientId: "",
      petId: "",
      vetId: user?.id ?? "",
      serviceType: "Consulta",
      status: "scheduled",
      date: format(currentDate, "yyyy-MM-dd"),
      startTime: "09:00",
      duration: "30",
      notes: "",
      recurring: false,
      recurringInterval: "weekly",
      observations: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (appt: Appointment) => {
    setEditingAppt(appt);
    setForm({
      clientId: appt.clientId,
      petId: appt.petId,
      vetId: appt.vetId ?? "",
      serviceType: appt.serviceType,
      status: appt.status,
      date: appt.date.split("T")[0],
      startTime: appt.startTime,
      duration: String(appt.duration),
      notes: appt.notes ?? "",
      recurring: appt.recurring,
      recurringInterval: appt.recurringInterval ?? "weekly",
      observations: appt.observations ?? "",
    });
    setDialogOpen(true);
  };

  const openPopover = (appt: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const popoverW = 288;
    const popoverH = 240;
    const left =
      rect.right + 8 + popoverW < window.innerWidth
        ? rect.right + 8
        : rect.left - popoverW - 8;
    const top = Math.min(rect.top, window.innerHeight - popoverH - 16);
    setPopoverAppt(appt);
    setPopoverPos({ top, left });
  };

  // Close popover on outside click or Escape
  useEffect(() => {
    if (!popoverAppt) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverAppt(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopoverAppt(null);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [popoverAppt]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.clientId || !form.petId) {
      toast({ title: "Preencha cliente e pet", variant: "destructive" });
      return;
    }
    const dur = parseInt(form.duration);
    const payload = {
      client_id: form.clientId,
      pet_id: form.petId,
      vet_id: form.vetId || undefined,
      service_type: form.serviceType,
      status: editingAppt ? form.status : "scheduled",
      date: form.date,
      start_time: form.startTime,
      end_time: calcEndTime(form.startTime, dur),
      duration: dur,
      notes: form.notes || undefined,
      recurring: form.recurring,
      recurring_interval: form.recurring ? form.recurringInterval : undefined,
      observations: form.observations || undefined,
    };

    if (editingAppt) {
      updateAppt.mutate(
        { id: editingAppt.id, payload },
        {
          onSuccess: () => {
            toast({ title: "Agendamento atualizado" });
            setDialogOpen(false);
          },
          onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
        },
      );
    } else {
      createAppt.mutate(payload, {
        onSuccess: () => {
          toast({ title: "Agendamento criado" });
          setDialogOpen(false);
        },
        onError: () =>
          toast({ title: "Erro ao criar agendamento", variant: "destructive" }),
      });
    }
  };

  const handleCancelAppointment = () => {
    if (!editingAppt) return;
    updateAppt.mutate(
      { id: editingAppt.id, payload: { status: "cancelled" } },
      {
        onSuccess: () => {
          toast({ title: "Agendamento cancelado" });
          setCancelConfirmOpen(false);
          setDialogOpen(false);
        },
        onError: () =>
          toast({ title: "Erro ao cancelar agendamento", variant: "destructive" }),
      },
    );
  };

  const handlePrint = async (appt: Appointment) => {
    const resp = await apiClient.get<{ data: ApiAppointment }>(`/appointments/${appt.id}`);
    const apiAppt = resp.data.data;
    const clientName =
      apiAppt.client?.name ?? clients.find((c) => c.id === appt.clientId)?.name ?? "-";
    const petName = apiAppt.pet?.name ?? "-";
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(
      `<html><head><title>Agendamento</title><style>body{font-family:Poppins,Arial,sans-serif;padding:20px}h2{color:#1b2a6b}table{width:100%;border-collapse:collapse}td{padding:8px;border-bottom:1px solid #dde3ee}</style></head><body><h2>VetDom – Comprovante de Agendamento</h2><table><tr><td><b>Cliente:</b></td><td>${clientName}</td></tr><tr><td><b>Pet:</b></td><td>${petName}</td></tr><tr><td><b>Serviço:</b></td><td>${appt.serviceType}</td></tr><tr><td><b>Data:</b></td><td>${formatDate(appt.date)}</td></tr><tr><td><b>Horário:</b></td><td>${appt.startTime} – ${appt.endTime}</td></tr>${appt.notes ? `<tr><td><b>Observações:</b></td><td>${appt.notes}</td></tr>` : ""}</table><p style="margin-top:30px;font-size:12px;color:#5e6b85">Impresso em ${new Date().toLocaleString("pt-BR")}</p></body></html>`,
    );
    win.print();
  };

  const copyLink = () => {
    const link = `${window.location.origin}/agendar/${publicToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveBookingConfig = async () => {
    if (!clinicId) return;
    setIsSavingBooking(true);
    try {
      const res = await apiClient.put(`/clinics/${clinicId}`, {
        booking_enabled: bookingEnabled,
        booking_services: bookingServices,
        booking_working_hours: workingHours,
        booking_slot_duration: slotDuration,
      });
      setPublicToken(res.data.public_token ?? publicToken);
      toast({ title: "Configurações salvas com sucesso" });
      setBookingConfigOpen(false);
    } catch {
      toast({ title: "Erro ao salvar configurações", variant: "destructive" });
    } finally {
      setIsSavingBooking(false);
    }
  };

  const handleRegenerateToken = async () => {
    if (!clinicId) return;
    setIsRegeneratingToken(true);
    try {
      const res = await apiClient.post(`/clinics/${clinicId}/regenerate-token`);
      setPublicToken(res.data.public_token);
      toast({ title: "Link regenerado com sucesso" });
    } catch {
      toast({ title: "Erro ao regenerar link", variant: "destructive" });
    } finally {
      setIsRegeneratingToken(false);
    }
  };

  const handleSavePageCustomization = async () => {
    if (!clinicId) return;
    setIsSavingPage(true);
    try {
      await apiClient.put(`/clinics/${clinicId}`, {
        name:                    pageClinicName || undefined,
        booking_headline:        pageHeadline || null,
        booking_subtitle:        pageSubtitle || null,
        booking_welcome_message: pageWelcomeMessage || null,
        booking_primary_color:   pagePrimaryColor,
        booking_accent_color:    pageAccentColor,
        booking_logo_url:        pageLogoUrl || null,
        booking_banner_url:      pageBannerUrl || null,
      });
      toast({ title: "Página atualizada com sucesso" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setIsSavingPage(false);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Selecione uma imagem válida.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Imagem deve ter no máximo 2MB.", variant: "destructive" });
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Selecione uma imagem válida.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Banner deve ter no máximo 5MB.", variant: "destructive" });
      return;
    }
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleUploadLogo = async () => {
    if (!logoFile || !clinicId) return;
    setUploadingLogo(true);
    try {
      const ext = logoFile.name.split(".").pop()?.toLowerCase() ?? "png";
      const filePath = `${clinicId}/booking-logo.${ext}`;
      const { error } = await supabase.storage
        .from(LOGO_BUCKET)
        .upload(filePath, logoFile, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(filePath);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setPageLogoUrl(url);
      setLogoFile(null);
      setLogoPreview(null);
      if (logoFileInputRef.current) logoFileInputRef.current.value = "";
      toast({ title: "Logo enviada com sucesso!" });
    } catch {
      toast({ title: "Erro ao enviar logo.", variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUploadBanner = async () => {
    if (!bannerFile || !clinicId) return;
    setUploadingBanner(true);
    try {
      const ext = bannerFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const filePath = `${clinicId}/booking-banner.${ext}`;
      const { error } = await supabase.storage
        .from(LOGO_BUCKET)
        .upload(filePath, bannerFile, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(filePath);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setPageBannerUrl(url);
      setBannerFile(null);
      setBannerPreview(null);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = "";
      toast({ title: "Banner enviado com sucesso!" });
    } catch {
      toast({ title: "Erro ao enviar banner.", variant: "destructive" });
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!clinicId) return;
    setUploadingLogo(true);
    try {
      await supabase.storage.from(LOGO_BUCKET).remove([
        `${clinicId}/booking-logo.png`,
        `${clinicId}/booking-logo.jpg`,
        `${clinicId}/booking-logo.jpeg`,
        `${clinicId}/booking-logo.webp`,
      ]);
    } catch { /* ignore – file may not exist */ }
    setPageLogoUrl("");
    setLogoFile(null);
    setLogoPreview(null);
    toast({ title: "Logo removida." });
    setUploadingLogo(false);
  };

  const handleRemoveBanner = async () => {
    if (!clinicId) return;
    setUploadingBanner(true);
    try {
      await supabase.storage.from(LOGO_BUCKET).remove([
        `${clinicId}/booking-banner.png`,
        `${clinicId}/booking-banner.jpg`,
        `${clinicId}/booking-banner.jpeg`,
        `${clinicId}/booking-banner.webp`,
      ]);
    } catch { /* ignore */ }
    setPageBannerUrl("");
    setBannerFile(null);
    setBannerPreview(null);
    toast({ title: "Banner removido." });
    setUploadingBanner(false);
  };

  const handleGoogleConnect = () => {
    if (!gisLoaded || !window.google) {
      toast({ title: "Aguarde o carregamento do Google.", variant: "destructive" });
      return;
    }
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      callback: (response) => {
        if (response.error || !response.access_token) {
          toast({ title: "Erro ao conectar com Google.", variant: "destructive" });
          return;
        }
        const expiry = Date.now() + (response.expires_in ?? 3600) * 1000;
        localStorage.setItem("drvet-goog-token", response.access_token);
        localStorage.setItem("drvet-goog-expiry", String(expiry));
        setGoogleAccessToken(response.access_token);
        setGoogleConnected(true);
        toast({ title: "Google Calendar conectado com sucesso!" });
      },
    });
    tokenClient.requestAccessToken();
  };

  const handleGoogleDisconnect = () => {
    localStorage.removeItem("drvet-goog-token");
    localStorage.removeItem("drvet-goog-expiry");
    setGoogleAccessToken(null);
    setGoogleConnected(false);
    setGoogleEvents([]);
    toast({ title: "Google Calendar desconectado." });
  };

  const handleSaveGoogleConfig = async () => {
    if (!clinicId) return;
    setIsSavingGoogle(true);
    try {
      await apiClient.put(`/clinics/${clinicId}`, {
        google_calendar_id: googleCalendarId || null,
      });
      toast({ title: "Configuração do Google Calendar salva!" });
    } catch {
      toast({ title: "Erro ao salvar configuração.", variant: "destructive" });
    } finally {
      setIsSavingGoogle(false);
    }
  };

  const toggleService = (service: string) => {
    setBookingServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service],
    );
  };

  const updateWorkingHour = (
    day: string,
    field: "enabled" | "start" | "end",
    value: string | boolean,
  ) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const isSaving = createAppt.isPending || updateAppt.isPending;

  // ── Stats data ────────────────────────────────────────────────────────────
  const stats = statsQuery.data;
  const byWeekData = stats
    ? Object.entries(stats.by_week).map(([week, count]) => ({ name: `Sem. ${week}`, total: count }))
    : [];
  const byServiceData = stats
    ? Object.entries(stats.by_service).map(([name, value]) => ({ name, value }))
    : [];
  const byStatusData = stats
    ? Object.entries(stats.by_status).map(([key, value]) => ({
        name: statusLabels[key] ?? key,
        value,
      }))
    : [];

  // ── Time grid hours ───────────────────────────────────────────────────────
  const hours = Array.from({ length: HOURS_END - HOURS_START }, (_, i) => HOURS_START + i);

  return (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary [font-family:var(--font-heading)]">
            Agenda
          </h1>
          <p className="text-muted-foreground text-sm">Gerenciamento de agendamentos</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Novo Agendamento
        </Button>
      </div>

      {/* Main tabs */}
      <Tabs
        value={mainTab}
        onValueChange={(v) => setMainTab(v as "calendario" | "estatisticas" | "personalizar")}
      >
        <TabsList className="mb-2">
          <TabsTrigger value="calendario" className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" /> Calendário
          </TabsTrigger>
          <TabsTrigger value="estatisticas" className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" /> Estatísticas
          </TabsTrigger>
          <TabsTrigger value="personalizar" className="flex items-center gap-1.5">
            <Palette className="w-4 h-4" /> Personalizar
          </TabsTrigger>
        </TabsList>

        {/* ── CALENDÁRIO TAB ─────────────────────────────────────────────── */}
        <TabsContent value="calendario" className="space-y-4">
          {/* Online booking banner */}
          <Card className="border-dashed">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Link2 className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Agendamento Online</p>
                  <p className="text-xs text-muted-foreground">
                    {bookingEnabled && publicToken
                      ? `Link ativo: ${typeof window !== "undefined" ? window.location.origin : ""}/agendar/${publicToken}`
                      : "Ative para gerar um link público para seus clientes agendarem online"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {bookingEnabled && publicToken && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyLink}
                      className="gap-1"
                    >
                      {copied ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      {copied ? "Copiado!" : "Copiar link"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBookingConfigOpen(true)}
                    className="gap-1"
                  >
                    <Settings className="w-3 h-3" /> Configurar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* View controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <Tabs value={view} onValueChange={(v) => setView(v as "day" | "week")}>
              <TabsList>
                <TabsTrigger value="day">Dia</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentDate((d) => addDays(d, view === "day" ? -1 : -7))
                }
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentDate((d) => addDays(d, view === "day" ? 1 : 7))
                }
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <span className="text-sm font-medium capitalize">
              {view === "day"
                ? format(currentDate, "EEEE, d 'de' MMMM yyyy", { locale: ptBR })
                : `${format(weekDays[0], "d MMM", { locale: ptBR })} – ${format(weekDays[6], "d MMM yyyy", { locale: ptBR })}`}
            </span>
            <Button variant="ghost" size="icon" onClick={refetch}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : view === "week" ? (
            /* ── WEEK TIME GRID (Google Calendar style) ── */
            <div className="border rounded-xl overflow-hidden bg-white">
              {/* Day headers */}
              <div
                className="grid border-b"
                style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}
              >
                <div className="border-r" />
                {weekDays.map((day) => {
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={day.toISOString()}
                      className={`text-center py-2 border-r last:border-r-0 ${isToday ? "bg-primary/5" : ""}`}
                    >
                      <p className="text-xs text-muted-foreground capitalize">
                        {format(day, "EEE", { locale: ptBR })}
                      </p>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mt-0.5 text-sm font-bold ${isToday ? "bg-primary text-primary-foreground" : "text-foreground"}`}
                      >
                        {format(day, "d")}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Time grid */}
              <div
                className="grid overflow-y-auto"
                style={{
                  gridTemplateColumns: "52px repeat(7, 1fr)",
                  maxHeight: "600px",
                }}
              >
                {/* Time labels column */}
                <div className="border-r">
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="border-b text-right pr-2 text-xs text-muted-foreground"
                      style={{ height: `${ROW_HEIGHT}px`, paddingTop: "2px" }}
                    >
                      {String(h).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>
                {/* Day columns */}
                {weekDays.map((day) => {
                  const isToday = isSameDay(day, new Date());
                  const appts = dayAppointments(day);
                  const totalHeight = (HOURS_END - HOURS_START) * ROW_HEIGHT;
                  return (
                    <div
                      key={day.toISOString()}
                      className={`relative border-r last:border-r-0 ${isToday ? "bg-primary/[0.03]" : ""}`}
                      style={{ height: `${totalHeight}px` }}
                    >
                      {/* Hour lines */}
                      {hours.map((h) => (
                        <div
                          key={h}
                          className="absolute left-0 right-0 border-b border-slate-100"
                          style={{ top: `${(h - HOURS_START) * ROW_HEIGHT}px` }}
                        />
                      ))}
                      {/* Appointments */}
                      {appts.map((appt) => {
                        const style = getApptStyle(appt);
                        const client = clients.find((c) => c.id === appt.clientId);
                        return (
                          <button
                            key={appt.id}
                            onClick={(e) => openPopover(appt, e)}
                            className={`absolute left-0.5 right-0.5 rounded border text-left px-1.5 overflow-hidden hover:opacity-90 transition-opacity text-xs ${statusBgColors[appt.status] ?? "bg-slate-100 border-slate-300 text-slate-700"}`}
                            style={{ top: style.top, height: style.height }}
                          >
                            <p className="font-semibold truncate leading-tight">
                              {appt.startTime} {appt.serviceType}
                            </p>
                            {client && (
                              <p className="truncate opacity-70 leading-tight">{client.name}</p>
                            )}
                          </button>
                        );
                      })}
                      {/* Google Calendar events */}
                      {googleConnected && googleEvents
                        .filter((e) => e.start.dateTime && isSameDay(parseISO(e.start.dateTime), day))
                        .map((event) => {
                          const gStyle = getGoogleEventStyle(event);
                          if (!gStyle) return null;
                          return (
                            <a
                              key={event.id}
                              href={event.htmlLink ?? "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={event.summary}
                              className="absolute left-0.5 right-0.5 rounded border text-left px-1.5 overflow-hidden hover:opacity-80 transition-opacity text-xs bg-white text-slate-600"
                              style={{ top: gStyle.top, height: gStyle.height, borderLeft: "3px solid #4285F4" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p className="font-semibold truncate leading-tight">
                                {event.start.dateTime
                                  ? format(parseISO(event.start.dateTime), "HH:mm") + " "
                                  : ""}
                                {event.summary ?? "(sem título)"}
                              </p>
                            </a>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── DAY VIEW ── */
            <Card>
              <CardHeader>
                <CardTitle className="text-base capitalize">
                  {format(currentDate, "EEEE, d 'de' MMMM yyyy", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentDayAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum agendamento neste dia
                  </p>
                ) : (
                  <div className="space-y-3">
                    {currentDayAppointments.map((appt) => {
                      const client = clients.find((c) => c.id === appt.clientId);
                      return (
                        <div
                          key={appt.id}
                          className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={(e) => openPopover(appt, e)}
                        >
                          <div className="text-center min-w-[60px]">
                            <p className="text-sm font-bold">{appt.startTime}</p>
                            <p className="text-xs text-muted-foreground">{appt.endTime}</p>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{appt.serviceType}</p>
                              <Badge variant={statusColors[appt.status]}>
                                {statusLabels[appt.status]}
                              </Badge>
                              {appt.recurring && (
                                <Badge variant="outline">Recorrente</Badge>
                              )}
                            </div>
                            {client && (
                              <p className="text-sm text-muted-foreground">{client.name}</p>
                            )}
                            {appt.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{appt.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePrint(appt)}
                              title="Imprimir"
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(appt)}>
                              Editar
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── ESTATÍSTICAS TAB ─────────────────────────────────────────────── */}
        <TabsContent value="estatisticas" className="space-y-5">
          {/* Month selector */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setStatsDate((d) => subMonths(d, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium capitalize min-w-[140px] text-center">
              {format(statsDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setStatsDate((d) => addMonths(d, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {statsQuery.isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : stats ? (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total do mês</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-50">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Taxa de conclusão</p>
                        <p className="text-2xl font-bold">{stats.completed_rate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-50">
                        <Clock3 className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Agendados/Confirmados</p>
                        <p className="text-2xl font-bold">
                          {(stats.by_status["scheduled"] ?? 0) +
                            (stats.by_status["confirmed"] ?? 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-50">
                        <XCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Taxa de cancelamento</p>
                        <p className="text-2xl font-bold">{stats.cancelled_rate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* By week */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" /> Agendamentos por semana
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={byWeekData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="total"
                          name="Agendamentos"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* By service */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" /> Por tipo de serviço
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={byServiceData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ name, percent }) =>
                            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {byServiceData.map((_, index) => (
                            <Cell
                              key={index}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* By status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> Distribuição por status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={byStatusData} layout="vertical">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                        horizontal={false}
                      />
                      <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        width={110}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="value"
                        name="Total"
                        fill="#6366f1"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Nenhum dado disponível para este período
            </div>
          )}
        </TabsContent>

        {/* ── PERSONALIZAR TAB ─────────────────────────────────────────────── */}
        <TabsContent value="personalizar" className="space-y-5">
          {/* Live preview card */}
          <Card className="overflow-hidden">
            <div
              className="relative h-36 flex items-end"
              style={
                pageBannerUrl
                  ? { backgroundImage: `url(${pageBannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : { background: `linear-gradient(135deg, ${pagePrimaryColor} 0%, ${pagePrimaryColor}cc 55%, ${pageAccentColor} 100%)` }
              }
            >
              {pageBannerUrl && (
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.45) 100%)" }} />
              )}
              <div className="relative px-5 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden shadow">
                  {pageLogoUrl
                    ? <img src={pageLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                    : <span className="text-white text-lg">🐾</span>
                  }
                </div>
                <div>
                  <p className="text-white/60 text-[10px] font-medium uppercase tracking-widest">
                    {pageHeadline || "Agendamento Online"}
                  </p>
                  <p className="text-white font-bold text-sm">{pageClinicName || "Nome da Clínica"}</p>
                  {pageSubtitle && <p className="text-white/75 text-[11px]">{pageSubtitle}</p>}
                </div>
              </div>
              <div className="absolute top-3 right-3">
                <span className="text-white/50 text-[10px] bg-white/10 px-2 py-0.5 rounded-full">Pré-visualização</span>
              </div>
            </div>
            {pageWelcomeMessage && (
              <div className="px-5 py-3 bg-muted/30 border-t">
                <p className="text-xs text-muted-foreground italic">&ldquo;{pageWelcomeMessage}&rdquo;</p>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left column — Identidade + Cores */}
            <div className="space-y-4">
              {/* Identidade visual */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" /> Identidade Visual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">

                  {/* ── Logo ── */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Logo</Label>
                    <div className="flex items-center gap-4">
                      {/* Preview */}
                      <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                        {(logoPreview || pageLogoUrl) ? (
                          <img
                            src={logoPreview ?? pageLogoUrl}
                            alt="Logo"
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <ImageIcon className="w-7 h-7 text-muted-foreground/40" />
                        )}
                      </div>
                      {/* Actions */}
                      <div className="flex-1 space-y-2 min-w-0">
                        <input
                          ref={logoFileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          className="hidden"
                          onChange={handleLogoFileChange}
                        />
                        {logoFile ? (
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" onClick={handleUploadLogo} disabled={uploadingLogo} className="gap-1.5">
                              {uploadingLogo
                                ? <><Loader2 className="w-3 h-3 animate-spin" /> Enviando...</>
                                : "Salvar logo"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setLogoFile(null); setLogoPreview(null); if (logoFileInputRef.current) logoFileInputRef.current.value = ""; }}>
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" variant="outline" onClick={() => logoFileInputRef.current?.click()} disabled={uploadingLogo} className="gap-1.5">
                              <Upload className="w-3.5 h-3.5" /> {pageLogoUrl ? "Trocar logo" : "Fazer upload"}
                            </Button>
                            {pageLogoUrl && (
                              <Button size="sm" variant="ghost" onClick={handleRemoveLogo} disabled={uploadingLogo} className="text-destructive hover:text-destructive gap-1.5">
                                <Trash2 className="w-3.5 h-3.5" /> Remover
                              </Button>
                            )}
                          </div>
                        )}
                        <p className="text-[11px] text-muted-foreground">PNG, JPG ou WebP · Máx. 2MB</p>
                      </div>
                    </div>
                  </div>

                  {/* ── Banner ── */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Banner do cabeçalho</Label>
                    {(bannerPreview || pageBannerUrl) && (
                      <div className="relative overflow-hidden rounded-xl h-28 bg-muted border">
                        <img
                          src={bannerPreview ?? pageBannerUrl}
                          alt="Banner"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    )}
                    <input
                      ref={bannerFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handleBannerFileChange}
                    />
                    {bannerFile ? (
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" onClick={handleUploadBanner} disabled={uploadingBanner} className="gap-1.5">
                          {uploadingBanner
                            ? <><Loader2 className="w-3 h-3 animate-spin" /> Enviando...</>
                            : "Salvar banner"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setBannerFile(null); setBannerPreview(null); if (bannerFileInputRef.current) bannerFileInputRef.current.value = ""; }}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => bannerFileInputRef.current?.click()} disabled={uploadingBanner} className="gap-1.5">
                          <Upload className="w-3.5 h-3.5" /> {pageBannerUrl ? "Trocar banner" : "Fazer upload"}
                        </Button>
                        {pageBannerUrl && (
                          <Button size="sm" variant="ghost" onClick={handleRemoveBanner} disabled={uploadingBanner} className="text-destructive hover:text-destructive gap-1.5">
                            <Trash2 className="w-3.5 h-3.5" /> Remover
                          </Button>
                        )}
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground">Recomendado: 1200×400px · Máx. 5MB</p>
                  </div>

                </CardContent>
              </Card>

              {/* Cores */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" /> Cores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Cor Primária</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={pagePrimaryColor}
                        onChange={(e) => setPagePrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-transparent"
                      />
                      <Input
                        value={pagePrimaryColor}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setPagePrimaryColor(v);
                        }}
                        className="font-mono text-sm w-28"
                        maxLength={7}
                      />
                      <div className="flex-1 h-10 rounded-lg border" style={{ background: pagePrimaryColor }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">Botões, cabeçalho e elementos principais</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Cor de Destaque</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={pageAccentColor}
                        onChange={(e) => setPageAccentColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-transparent"
                      />
                      <Input
                        value={pageAccentColor}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setPageAccentColor(v);
                        }}
                        className="font-mono text-sm w-28"
                        maxLength={7}
                      />
                      <div className="flex-1 h-10 rounded-lg border" style={{ background: pageAccentColor }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">Destaques, ícones e elementos secundários</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: "Padrão", p: "#1b2a6b", a: "#2dc6c6" },
                      { label: "Esmeralda", p: "#065f46", a: "#34d399" },
                      { label: "Roxo", p: "#4c1d95", a: "#a78bfa" },
                      { label: "Rosa", p: "#9d174d", a: "#f472b6" },
                      { label: "Laranja", p: "#92400e", a: "#fb923c" },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => { setPagePrimaryColor(preset.p); setPageAccentColor(preset.a); }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium hover:border-primary/50 transition-colors"
                      >
                        <span className="flex gap-0.5">
                          <span className="w-3 h-3 rounded-full" style={{ background: preset.p }} />
                          <span className="w-3 h-3 rounded-full" style={{ background: preset.a }} />
                        </span>
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column — Textos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Textos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Nome da Clínica</Label>
                  <Input
                    placeholder="Ex: Clínica VetDom"
                    value={pageClinicName}
                    onChange={(e) => setPageClinicName(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">Nome exibido no cabeçalho e no comprovante de agendamento</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Título Principal</Label>
                  <Input
                    placeholder="Agendamento Online"
                    value={pageHeadline}
                    onChange={(e) => setPageHeadline(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">Texto acima do nome da clínica no cabeçalho</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Subtítulo</Label>
                  <Input
                    placeholder="Agende sua consulta com facilidade"
                    value={pageSubtitle}
                    onChange={(e) => setPageSubtitle(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">Linha extra abaixo do nome da clínica</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Mensagem de Boas-vindas</Label>
                  <Textarea
                    placeholder="Seja bem-vindo(a)! Aqui você pode agendar seu atendimento de forma rápida e fácil. Escolha o serviço, a data e o horário que preferir."
                    value={pageWelcomeMessage}
                    onChange={(e) => setPageWelcomeMessage(e.target.value)}
                    rows={5}
                  />
                  <p className="text-[11px] text-muted-foreground">Aparece na tela inicial de seleção de serviço</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Google Calendar integration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                {/* Google "G" icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Visualize seus compromissos do Google Calendar diretamente na agenda. Os eventos aparecem como blocos de leitura na grade semanal.
              </p>

              {/* Connection status */}
              {googleConnected ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-green-50 rounded-xl border border-green-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-green-800">Conectado</p>
                    <p className="text-xs text-green-600 truncate">{googleCalendarId || "primary"}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleGoogleDisconnect} className="shrink-0">
                    Desconectar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 rounded-xl border border-dashed">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground flex-1">Não conectado</p>
                </div>
              )}

              {/* Config fields */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">ID do Calendário</Label>
                  <Input
                    placeholder="primary"
                    value={googleCalendarId}
                    onChange={(e) => setGoogleCalendarId(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Use <code className="bg-muted px-1 rounded text-[10px]">primary</code> para o calendário principal, ou o e-mail de outro calendário
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={handleGoogleConnect}
                  disabled={!gisLoaded}
                  className="gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {googleConnected ? "Reconectar" : "Conectar com Google"}
                </Button>
                <Button onClick={handleSaveGoogleConfig} disabled={isSavingGoogle} variant="outline">
                  {isSavingGoogle ? "Salvando..." : "Salvar configuração"}
                </Button>
              </div>

              {/* Legend */}
              {googleConnected && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-4 h-3 rounded border bg-white" style={{ borderLeft: "3px solid #4285F4" }} />
                  Eventos do Google Calendar aparecem na grade semanal
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer actions */}
          <div className="flex items-center gap-3 justify-end">
            {publicToken && (
              <Button
                variant="outline"
                onClick={() => window.open(`${window.location.origin}/agendar/${publicToken}`, "_blank")}
                className="gap-1.5"
              >
                <Globe className="w-4 h-4" /> Visualizar Página
              </Button>
            )}
            <Button onClick={handleSavePageCustomization} disabled={isSavingPage}>
              {isSavingPage ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Booking config dialog */}
      <Dialog open={bookingConfigOpen} onOpenChange={setBookingConfigOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" /> Agendamento Online
            </DialogTitle>
            <DialogDescription>
              Configure o link público para que clientes agendem serviços diretamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-1">
            {/* Toggle + link */}
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div>
                <p className="text-sm font-medium">Ativar agendamento online</p>
                <p className="text-xs text-muted-foreground">
                  Gera um link público para seus clientes agendarem
                </p>
              </div>
              <Switch checked={bookingEnabled} onCheckedChange={setBookingEnabled} />
            </div>

            {publicToken && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Link público
                </Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/agendar/${publicToken}`}
                    className="text-xs font-mono bg-muted"
                  />
                  <Button size="icon" variant="outline" onClick={copyLink} title="Copiar link">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleRegenerateToken}
                    disabled={isRegeneratingToken}
                    title="Gerar novo link (invalida o anterior)"
                  >
                    <RotateCcw className={`w-4 h-4 ${isRegeneratingToken ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Regenerar o link invalida o anterior permanentemente.
                </p>
              </div>
            )}

            {/* Slot duration */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Duração de cada slot
              </Label>
              <div className="flex gap-2 flex-wrap">
                {[15, 20, 30, 45, 60].map((min) => (
                  <button
                    key={min}
                    onClick={() => setSlotDuration(min)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      slotDuration === min
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {min} min
                  </button>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Serviços disponíveis para agendamento online
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {serviceTypes.map((service) => {
                  const active = bookingServices.includes(service);
                  return (
                    <button
                      key={service}
                      onClick={() => toggleService(service)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                        active
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 ${active ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                        {active && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      {service}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Working hours */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Horários de atendimento
              </Label>
              <div className="border rounded-lg divide-y">
                {(
                  [
                    { key: "mon", label: "Segunda" },
                    { key: "tue", label: "Terça" },
                    { key: "wed", label: "Quarta" },
                    { key: "thu", label: "Quinta" },
                    { key: "fri", label: "Sexta" },
                    { key: "sat", label: "Sábado" },
                    { key: "sun", label: "Domingo" },
                  ] as const
                ).map(({ key, label }) => {
                  const day = workingHours[key];
                  return (
                    <div key={key} className="flex items-center gap-3 px-3 py-2">
                      <Switch
                        checked={day.enabled}
                        onCheckedChange={(v) => updateWorkingHour(key, "enabled", v)}
                        id={`wh-${key}`}
                      />
                      <Label htmlFor={`wh-${key}`} className={`w-16 text-sm ${day.enabled ? "text-foreground" : "text-muted-foreground"}`}>
                        {label}
                      </Label>
                      <div className={`flex items-center gap-2 flex-1 ${!day.enabled ? "opacity-40 pointer-events-none" : ""}`}>
                        <Input
                          type="time"
                          value={day.start}
                          onChange={(e) => updateWorkingHour(key, "start", e.target.value)}
                          className="h-7 text-xs w-24"
                        />
                        <span className="text-xs text-muted-foreground">até</span>
                        <Input
                          type="time"
                          value={day.end}
                          onChange={(e) => updateWorkingHour(key, "end", e.target.value)}
                          className="h-7 text-xs w-24"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBookingConfigOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveBookingConfig} disabled={isSavingBooking}>
              {isSavingBooking ? "Salvando..." : "Salvar configurações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAppt ? "Editar Agendamento" : "Novo Agendamento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cliente</Label>
                <Select
                  value={form.clientId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, clientId: v, petId: "" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients
                      .filter((c) => c.active)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Pet</Label>
                <Select
                  value={form.petId}
                  onValueChange={(v) => setForm((f) => ({ ...f, petId: v }))}
                  disabled={!form.clientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientPets.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Serviço</Label>
                <Select
                  value={form.serviceType}
                  onValueChange={(v) => setForm((f) => ({ ...f, serviceType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Início</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Duração (min)</Label>
                <Input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                  min="15"
                  step="15"
                />
              </div>
            </div>
            {editingAppt && (
              <div className="space-y-1.5">
                <Label>Status do agendamento</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Agendado</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="in_progress">Em atendimento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="no_show">Não compareceu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.recurring}
                onCheckedChange={(v) => setForm((f) => ({ ...f, recurring: v }))}
                id="recurring"
              />
              <Label htmlFor="recurring">Serviço recorrente</Label>
              {form.recurring && (
                <Select
                  value={form.recurringInterval}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      recurringInterval: v as "weekly" | "biweekly" | "monthly",
                    }))
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quinzenal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            {editingAppt && editingAppt.status !== "cancelled" && (
              <Button
                variant="destructive"
                size="sm"
                className="sm:mr-auto"
                onClick={() => setCancelConfirmOpen(true)}
                disabled={isSaving}
              >
                Cancelar Agendamento
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Floating appointment popover (Teams-style) ── */}
      {popoverAppt && (
        <div
          ref={popoverRef}
          className="fixed z-50 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          style={{ top: popoverPos.top, left: popoverPos.left }}
        >
          {/* Header strip with status color */}
          <div className={`px-4 py-3 border-b ${statusBgColors[popoverAppt.status] ?? "bg-slate-100 border-slate-300 text-slate-700"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{popoverAppt.serviceType}</p>
                <p className="text-xs opacity-75 mt-0.5 font-medium">
                  {popoverAppt.startTime} – {popoverAppt.endTime}
                </p>
              </div>
              <button
                onClick={() => setPopoverAppt(null)}
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors shrink-0 mt-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 py-3 space-y-2.5">
            <Badge variant={statusColors[popoverAppt.status]} className="text-xs">
              {statusLabels[popoverAppt.status]}
            </Badge>
            {(() => {
              const client = clients.find((c) => c.id === popoverAppt.clientId);
              return client ? (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium">{client.name}</span>
                </div>
              ) : null;
            })()}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="capitalize">
                {format(parseISO(popoverAppt.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
            {popoverAppt.notes && (
              <p className="text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2 leading-relaxed">
                {popoverAppt.notes}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="border-t px-3 py-2.5 flex gap-2">
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => {
                setPopoverAppt(null);
                openEdit(popoverAppt);
              }}
            >
              <Pencil className="w-3 h-3 mr-1.5" /> Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5"
              title="Imprimir"
              onClick={() => {
                setPopoverAppt(null);
                handlePrint(popoverAppt);
              }}
            >
              <Printer className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Cancel confirmation */}
      <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancelar agendamento?</DialogTitle>
            <DialogDescription>
              Esta ação marcará o agendamento como cancelado. O registro será mantido no
              histórico.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelConfirmOpen(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelAppointment}
              disabled={updateAppt.isPending}
            >
              {updateAppt.isPending ? "Cancelando..." : "Confirmar cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
