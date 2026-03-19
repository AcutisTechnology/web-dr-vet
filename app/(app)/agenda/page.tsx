"use client";
import { useState, useMemo } from "react";
import {
  Plus,
  Printer,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
} from "@/hooks/use-appointments";
import { useClients, usePetsByClient } from "@/hooks/use-clients-pets";
import { useSessionStore } from "@/stores/session";
import { apiClient } from "@/lib/api-client";
import type { Appointment } from "@/types";
import type { ApiAppointment } from "@/types/api";
import { formatDate } from "@/lib/utils";

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

export default function AgendaPage() {
  const { toast } = useToast();
  const { user } = useSessionStore();

  const [view, setView] = useState<"day" | "week">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [form, setForm] = useState({
    clientId: "",
    petId: "",
    vetId: "",
    serviceType: "Consulta",
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

  const createAppt = useCreateAppointment();
  const updateAppt = useUpdateAppointment();

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
      (dayQuery.data ?? []).sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      ),
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

  // ── Dialog open helpers ───────────────────────────────────────────────────
  const openNew = () => {
    setEditingAppt(null);
    setForm({
      clientId: "",
      petId: "",
      vetId: user?.id ?? "",
      serviceType: "Consulta",
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
      status: "scheduled" as const,
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
          onError: () =>
            toast({ title: "Erro ao atualizar", variant: "destructive" }),
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

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = async (appt: Appointment) => {
    const resp = await apiClient.get<{ data: ApiAppointment }>(
      `/appointments/${appt.id}`,
    );
    const apiAppt = resp.data.data;
    const clientName =
      apiAppt.client?.name ??
      clients.find((c) => c.id === appt.clientId)?.name ??
      "-";
    const petName = apiAppt.pet?.name ?? "-";
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Agendamento</title>
      <style>body{font-family:Poppins,Arial,sans-serif;padding:20px}h2{color:#1b2a6b}table{width:100%;border-collapse:collapse}td{padding:8px;border-bottom:1px solid #dde3ee}</style>
      </head><body>
      <h2>VetDom – Comprovante de Agendamento</h2>
      <table>
        <tr><td><b>Cliente:</b></td><td>${clientName}</td></tr>
        <tr><td><b>Pet:</b></td><td>${petName}</td></tr>
        <tr><td><b>Serviço:</b></td><td>${appt.serviceType}</td></tr>
        <tr><td><b>Data:</b></td><td>${formatDate(appt.date)}</td></tr>
        <tr><td><b>Horário:</b></td><td>${appt.startTime} – ${appt.endTime}</td></tr>
        ${appt.notes ? `<tr><td><b>Observações:</b></td><td>${appt.notes}</td></tr>` : ""}
      </table>
      <p style="margin-top:30px;font-size:12px;color:#5e6b85">Impresso em ${new Date().toLocaleString("pt-BR")}</p>
      </body></html>
    `);
    win.print();
  };

  const isSaving = createAppt.isPending || updateAppt.isPending;

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary [font-family:var(--font-heading)]">Agenda</h1>
          <p className="text-muted-foreground text-sm">
            Gerenciamento de agendamentos
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Novo Agendamento
        </Button>
      </div>

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
        /* Week view */
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            const dayAppts = dayAppointments(day);
            return (
              <div key={day.toISOString()} className="min-h-[200px]">
                <div
                  className={`text-center py-2 rounded-t-lg text-sm font-medium mb-1 ${isToday ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  <div className="capitalize">
                    {format(day, "EEE", { locale: ptBR })}
                  </div>
                  <div
                    className={`text-lg font-bold ${isToday ? "" : "text-foreground"}`}
                  >
                    {format(day, "d")}
                  </div>
                </div>
                <div className="space-y-1">
                  {dayAppts.map((appt) => (
                    <button
                      key={appt.id}
                      onClick={() => openEdit(appt)}
                      className="w-full text-left p-1.5 rounded bg-info/8 border border-info/25 hover:bg-info/14 transition-colors"
                    >
                      <p className="text-xs font-medium text-primary truncate">
                        {appt.startTime} {appt.serviceType}
                      </p>
                      <Badge
                        variant={statusColors[appt.status]}
                        className="text-[10px] px-1 py-0 mt-0.5"
                      >
                        {statusLabels[appt.status]}
                      </Badge>
                    </button>
                  ))}
                  {dayAppts.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      –
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Day view */
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
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="text-center min-w-[60px]">
                        <p className="text-sm font-bold">{appt.startTime}</p>
                        <p className="text-xs text-muted-foreground">
                          {appt.endTime}
                        </p>
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
                          <p className="text-sm text-muted-foreground">
                            {client.name}
                          </p>
                        )}
                        {appt.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {appt.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrint(appt)}
                          title="Imprimir"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(appt)}
                        >
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

      {/* Dialog */}
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
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, serviceType: v }))
                  }
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Início</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startTime: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Duração (min)</Label>
                <Input
                  type="number"
                  value={form.duration}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, duration: e.target.value }))
                  }
                  min="15"
                  step="15"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.recurring}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, recurring: v }))
                }
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
