"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  BedDouble,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Syringe,
  User2,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  hospitalizationsDb,
  boxesDb,
  petsDb,
  clientsDb,
  usersDb,
} from "@/mocks/db";
import type {
  Hospitalization,
  Box,
  Pet,
  Client,
  User,
  HospPrescription,
  MedAdministration,
} from "@/types";
import { formatDate, formatDateTime, generateId } from "@/lib/utils";
import { useSessionStore } from "@/stores/session";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<
  string,
  "info" | "success" | "warning" | "destructive" | "secondary"
> = {
  active: "info",
  discharged: "success",
  cancelled: "secondary",
  deceased: "destructive",
};
const statusLabels: Record<string, string> = {
  active: "Internado",
  discharged: "Alta",
  cancelled: "Cancelado",
  deceased: "Óbito",
};

// Parse frequency string like "8/8h", "6/6h", "12/12h", "24/24h", "SID", "BID", "TID", "QID"
function parseFrequencyHours(freq: string): number {
  const lower = freq.toLowerCase().trim();
  if (lower === "sid" || lower === "1x/dia" || lower === "24/24h") return 24;
  if (lower === "bid" || lower === "2x/dia" || lower === "12/12h") return 12;
  if (lower === "tid" || lower === "3x/dia" || lower === "8/8h") return 8;
  if (lower === "qid" || lower === "4x/dia" || lower === "6/6h") return 6;
  const match = lower.match(/(\d+)\/(\d+)h/);
  if (match) return parseInt(match[2]);
  const hMatch = lower.match(/(\d+)h/);
  if (hMatch) return parseInt(hMatch[1]);
  return 8; // default
}

function buildAdministrations(
  startDate: string,
  frequencyHours: number,
  daysAhead = 3,
): MedAdministration[] {
  const admins: MedAdministration[] = [];
  const start = new Date(startDate);
  const end = new Date(start.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  let current = new Date(start);
  while (current <= end) {
    const scheduledTime = current.toISOString();
    const now = new Date();
    admins.push({
      id: generateId(),
      scheduledTime,
      status: current < now ? "late" : "pending",
    });
    current = new Date(current.getTime() + frequencyHours * 60 * 60 * 1000);
  }
  return admins;
}

export default function InternacaoPage() {
  const { toast } = useToast();
  const { user: currentUser } = useSessionStore();
  const [hospitalizations, setHospitalizations] = useState<Hospitalization[]>(
    [],
  );
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vets, setVets] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Hospitalization | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    petId: "",
    clientId: "",
    vetId: "",
    boxId: "",
    reason: "",
    notes: "",
  });
  const [prescForm, setPrescForm] = useState({
    medication: "",
    dosage: "",
    route: "",
    frequency: "",
    notes: "",
    daysAhead: "3",
  });
  const [prescDialogOpen, setPrescDialogOpen] = useState(false);
  const [expandedPresc, setExpandedPresc] = useState<string | null>(null);
  const [adminDialog, setAdminDialog] = useState<{
    presc: HospPrescription;
    admin: MedAdministration;
  } | null>(null);
  const [adminForm, setAdminForm] = useState({
    administeredBy: "",
    administeredAt: "",
    notes: "",
    skipped: false,
  });
  // inline edit of a scheduled time before it is administered
  const [editingDose, setEditingDose] = useState<{
    prescId: string;
    adminId: string;
    value: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [hosps, bxs, pts, cls, usrs] = await Promise.all([
      hospitalizationsDb.findAll(),
      boxesDb.findAll(),
      petsDb.findAll(),
      clientsDb.findAll(),
      usersDb.findWhere((u) => u.role === "vet"),
    ]);
    setHospitalizations(
      hosps.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
    setBoxes(bxs);
    setPets(pts);
    setClients(cls);
    setVets(usrs);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshSelected = useCallback(async (id: string) => {
    const h = await hospitalizationsDb.findById(id);
    if (h) setSelected(h);
  }, []);

  const openNew = () => {
    setForm({
      petId: "",
      clientId: "",
      vetId: "",
      boxId: "",
      reason: "",
      notes: "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.petId || !form.reason) {
      toast({ title: "Pet e motivo são obrigatórios", variant: "destructive" });
      return;
    }
    await hospitalizationsDb.create({
      petId: form.petId,
      clientId: form.clientId,
      vetId: form.vetId || undefined,
      status: "active",
      admissionDate: new Date().toISOString(),
      boxId: form.boxId || undefined,
      reason: form.reason,
      notes: form.notes || undefined,
      prescriptions: [],
      checklistItems: [],
    });
    toast({ title: "Internação registrada" });
    setDialogOpen(false);
    load();
  };

  const handleDischarge = async (h: Hospitalization) => {
    if (!confirm("Dar alta a este animal?")) return;
    await hospitalizationsDb.update(h.id, {
      status: "discharged",
      dischargeDate: new Date().toISOString(),
    });
    toast({ title: "Alta registrada" });
    load();
    if (selected?.id === h.id) setSelected(null);
  };

  const handleCancel = async (h: Hospitalization) => {
    if (!confirm("Cancelar esta internação?")) return;
    await hospitalizationsDb.update(h.id, { status: "cancelled" });
    toast({ title: "Internação cancelada" });
    load();
    if (selected?.id === h.id) setSelected(null);
  };

  const handleReopen = async (h: Hospitalization) => {
    await hospitalizationsDb.update(h.id, {
      status: "active",
      dischargeDate: undefined,
    });
    toast({ title: "Internação reaberta" });
    load();
  };

  const handleMoveBox = async (h: Hospitalization, boxId: string) => {
    await hospitalizationsDb.update(h.id, { boxId });
    toast({ title: "Box atualizado" });
    load();
    refreshSelected(h.id);
  };

  const handleAddPrescription = async () => {
    if (!selected || !prescForm.medication) return;
    const startDate = new Date().toISOString();
    const freqHours = parseFrequencyHours(prescForm.frequency || "8/8h");
    const days = parseInt(prescForm.daysAhead) || 3;
    const administrations = buildAdministrations(startDate, freqHours, days);
    const newPresc: HospPrescription = {
      id: generateId(),
      medication: prescForm.medication,
      dosage: prescForm.dosage,
      route: prescForm.route || undefined,
      frequency: prescForm.frequency,
      startDate,
      active: true,
      notes: prescForm.notes || undefined,
      administrations,
    };
    const updatedPrescriptions = [...selected.prescriptions, newPresc];
    await hospitalizationsDb.update(selected.id, {
      prescriptions: updatedPrescriptions,
    });
    toast({
      title: "Prescrição adicionada",
      description: `${administrations.length} doses agendadas`,
    });
    setPrescDialogOpen(false);
    setPrescForm({
      medication: "",
      dosage: "",
      route: "",
      frequency: "",
      notes: "",
      daysAhead: "3",
    });
    refreshSelected(selected.id);
    load();
  };

  const handleDeletePrescription = async (prescId: string) => {
    if (!selected) return;
    if (!confirm("Excluir esta prescrição e todas as doses agendadas?")) return;
    const updatedPrescriptions = selected.prescriptions.filter(
      (p) => p.id !== prescId,
    );
    await hospitalizationsDb.update(selected.id, {
      prescriptions: updatedPrescriptions,
    });
    toast({ title: "Prescrição excluída" });
    setExpandedPresc(null);
    refreshSelected(selected.id);
    load();
  };

  const handleRegisterAdmin = async () => {
    if (!selected || !adminDialog) return;
    if (!adminForm.skipped && !adminForm.administeredBy) {
      toast({ title: "Informe quem administrou", variant: "destructive" });
      return;
    }
    if (!adminForm.skipped && !adminForm.administeredAt) {
      toast({
        title: "Informe a hora da administração",
        variant: "destructive",
      });
      return;
    }
    const { presc, admin } = adminDialog;
    const administeredAt = adminForm.administeredAt
      ? new Date(adminForm.administeredAt).toISOString()
      : new Date().toISOString();
    const updatedAdmin: MedAdministration = {
      ...admin,
      administeredAt,
      administeredBy:
        adminForm.administeredBy || currentUser?.name || "Desconhecido",
      notes: adminForm.notes || undefined,
      status: adminForm.skipped ? "skipped" : "done",
    };
    const updatedPrescriptions = selected.prescriptions.map((p) =>
      p.id === presc.id
        ? {
            ...p,
            administrations: p.administrations.map((a) =>
              a.id === admin.id ? updatedAdmin : a,
            ),
          }
        : p,
    );
    // Also refresh late status on remaining pending
    const nowMs = Date.now();
    const refreshed = updatedPrescriptions.map((p) => ({
      ...p,
      administrations: p.administrations.map((a) =>
        a.status === "pending" && new Date(a.scheduledTime).getTime() < nowMs
          ? { ...a, status: "late" as const }
          : a,
      ),
    }));
    await hospitalizationsDb.update(selected.id, { prescriptions: refreshed });
    toast({
      title: adminForm.skipped ? "Dose pulada" : "Administração registrada",
    });
    setAdminDialog(null);
    setAdminForm({
      administeredBy: "",
      administeredAt: "",
      notes: "",
      skipped: false,
    });
    refreshSelected(selected.id);
    load();
  };

  const handleEditScheduledTime = async (
    prescId: string,
    adminId: string,
    newTime: string,
  ) => {
    if (!selected || !newTime) return;
    const updated = selected.prescriptions.map((p) =>
      p.id === prescId
        ? {
            ...p,
            administrations: p.administrations.map((a) =>
              a.id === adminId
                ? {
                    ...a,
                    scheduledTime: new Date(newTime).toISOString(),
                    status:
                      new Date(newTime) < new Date()
                        ? ("late" as const)
                        : ("pending" as const),
                  }
                : a,
            ),
          }
        : p,
    );
    await hospitalizationsDb.update(selected.id, { prescriptions: updated });
    setEditingDose(null);
    refreshSelected(selected.id);
  };

  const handleDeleteDose = async (prescId: string, adminId: string) => {
    if (!selected) return;
    const updated = selected.prescriptions.map((p) =>
      p.id === prescId
        ? {
            ...p,
            administrations: p.administrations.filter((a) => a.id !== adminId),
          }
        : p,
    );
    await hospitalizationsDb.update(selected.id, { prescriptions: updated });
    refreshSelected(selected.id);
    load();
  };

  const getPet = (id: string) => pets.find((p) => p.id === id);
  const getClient = (id: string) => clients.find((c) => c.id === id);
  const getBox = (id?: string) => boxes.find((b) => b.id === id);

  const active = hospitalizations.filter((h) => h.status === "active");
  const others = hospitalizations.filter((h) => h.status !== "active");

  if (loading)
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Internação</h1>
          <p className="text-muted-foreground text-sm">
            {active.length} animais internados
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4" /> Nova Internação
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Internados", value: active.length, color: "text-blue-600" },
          {
            label: "Alta hoje",
            value: others.filter((h) =>
              h.dischargeDate?.startsWith(
                new Date().toISOString().split("T")[0],
              ),
            ).length,
            color: "text-green-600",
          },
          {
            label: "Boxes livres",
            value: boxes.filter(
              (b) => b.active && !active.find((h) => h.boxId === b.id),
            ).length,
            color: "text-purple-600",
          },
          {
            label: "Total histórico",
            value: hospitalizations.length,
            color: "text-gray-600",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* List */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Internações Ativas
          </p>
          {active.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma internação ativa
              </CardContent>
            </Card>
          )}
          {active.map((h) => {
            const pet = getPet(h.petId);
            const client = getClient(h.clientId);
            const box = getBox(h.boxId);
            return (
              <Card
                key={h.id}
                className={`cursor-pointer transition-colors ${selected?.id === h.id ? "border-primary" : ""}`}
                onClick={() => setSelected(h)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{pet?.name ?? "–"}</p>
                      <p className="text-xs text-muted-foreground">
                        {client?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {box?.name ?? "Sem box"} • {formatDate(h.admissionDate)}
                      </p>
                    </div>
                    <Badge variant="info">Internado</Badge>
                  </div>
                  <p className="text-xs mt-1 truncate text-muted-foreground">
                    {h.reason}
                  </p>
                </CardContent>
              </Card>
            );
          })}
          <p className="text-sm font-medium text-muted-foreground mt-4">
            Histórico
          </p>
          {others.slice(0, 5).map((h) => {
            const pet = getPet(h.petId);
            return (
              <Card
                key={h.id}
                className={`cursor-pointer opacity-70 transition-colors ${selected?.id === h.id ? "border-primary opacity-100" : ""}`}
                onClick={() => setSelected(h)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{pet?.name ?? "–"}</p>
                    <Badge variant={statusColors[h.status]}>
                      {statusLabels[h.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(h.admissionDate)}{" "}
                    {h.dischargeDate && `→ ${formatDate(h.dischargeDate)}`}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {!selected ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center text-muted-foreground py-16">
                <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Selecione uma internação para ver detalhes</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle>{getPet(selected.petId)?.name ?? "–"}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {getClient(selected.clientId)?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={statusColors[selected.status]}>
                      {statusLabels[selected.status]}
                    </Badge>
                    {selected.status === "active" && (
                      <>
                        <Select
                          value={selected.boxId ?? ""}
                          onValueChange={(v) => handleMoveBox(selected, v)}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue placeholder="Mover box" />
                          </SelectTrigger>
                          <SelectContent>
                            {boxes
                              .filter((b) => b.active)
                              .map((b) => (
                                <SelectItem key={b.id} value={b.id}>
                                  {b.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDischarge(selected)}
                        >
                          Alta
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancel(selected)}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                    {selected.status !== "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReopen(selected)}
                      >
                        Reabrir
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="info">
                  <TabsList className="mb-4">
                    <TabsTrigger value="info">Informações</TabsTrigger>
                    <TabsTrigger value="prescricoes">
                      Prescrições ({selected.prescriptions.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Admissão</p>
                        <p className="font-medium">
                          {formatDateTime(selected.admissionDate)}
                        </p>
                      </div>
                      {selected.dischargeDate && (
                        <div>
                          <p className="text-muted-foreground">Alta</p>
                          <p className="font-medium">
                            {formatDateTime(selected.dischargeDate)}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Box</p>
                        <p className="font-medium">
                          {getBox(selected.boxId)?.name ?? "–"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Veterinário</p>
                        <p className="font-medium">
                          {vets.find((v) => v.id === selected.vetId)?.name ??
                            "–"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Motivo</p>
                        <p className="font-medium">{selected.reason}</p>
                      </div>
                      {selected.notes && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Observações</p>
                          <p className="font-medium">{selected.notes}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="prescricoes" className="space-y-3">
                    {selected.status === "active" && (
                      <Button
                        size="sm"
                        onClick={() => setPrescDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4" /> Adicionar Prescrição
                      </Button>
                    )}
                    {selected.prescriptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        Nenhuma prescrição
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {selected.prescriptions.map((p) => {
                          const admins = p.administrations ?? [];
                          const pending = admins.filter(
                            (a) => a.status === "pending",
                          ).length;
                          const late = admins.filter(
                            (a) => a.status === "late",
                          ).length;
                          const done = admins.filter(
                            (a) => a.status === "done",
                          ).length;
                          const isExpanded = expandedPresc === p.id;
                          return (
                            <div
                              key={p.id}
                              className={`rounded-lg border ${p.active ? "border-blue-200" : "border-muted opacity-60"}`}
                            >
                              {/* Header */}
                              <div
                                className={`flex items-start justify-between p-3 cursor-pointer ${p.active ? "bg-blue-50" : "bg-muted"} rounded-t-lg`}
                                onClick={() =>
                                  setExpandedPresc(isExpanded ? null : p.id)
                                }
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Syringe className="w-4 h-4 text-blue-600 shrink-0" />
                                    <p className="font-semibold text-sm">
                                      {p.medication}
                                    </p>
                                    {!p.active && (
                                      <Badge variant="secondary">Inativo</Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {p.dosage}
                                    {p.route ? ` • ${p.route}` : ""} •{" "}
                                    {p.frequency}
                                  </p>
                                  {p.notes && (
                                    <p className="text-xs text-muted-foreground">
                                      {p.notes}
                                    </p>
                                  )}
                                  {/* Mini counters */}
                                  <div className="flex items-center gap-3 mt-1.5">
                                    {late > 0 && (
                                      <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                                        <AlertCircle className="w-3 h-3" />{" "}
                                        {late} atrasada{late > 1 ? "s" : ""}
                                      </span>
                                    )}
                                    {pending > 0 && (
                                      <span className="flex items-center gap-1 text-xs text-amber-600">
                                        <Clock className="w-3 h-3" /> {pending}{" "}
                                        pendente{pending > 1 ? "s" : ""}
                                      </span>
                                    )}
                                    {done > 0 && (
                                      <span className="flex items-center gap-1 text-xs text-green-600">
                                        <CheckCircle2 className="w-3 h-3" />{" "}
                                        {done} administrada{done > 1 ? "s" : ""}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="ml-2 shrink-0 flex items-center gap-1">
                                  {selected.status === "active" && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeletePrescription(p.id);
                                      }}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                              </div>

                              {/* Dose checklist */}
                              {isExpanded && (
                                <div className="divide-y border-t">
                                  {admins.length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center py-4">
                                      Nenhuma dose agendada
                                    </p>
                                  )}
                                  {admins.map((a) => {
                                    const isPending = a.status === "pending";
                                    const isLate = a.status === "late";
                                    const isDone = a.status === "done";
                                    const isSkipped = a.status === "skipped";
                                    const isEditingThis =
                                      editingDose?.prescId === p.id &&
                                      editingDose?.adminId === a.id;
                                    const canAct =
                                      (isPending || isLate) &&
                                      selected.status === "active";
                                    return (
                                      <div
                                        key={a.id}
                                        className={`flex items-start gap-2 px-3 py-2.5 ${
                                          isDone
                                            ? "bg-green-50"
                                            : isLate
                                              ? "bg-red-50"
                                              : isSkipped
                                                ? "bg-gray-50"
                                                : "bg-white"
                                        }`}
                                      >
                                        {/* Status icon */}
                                        <div className="mt-0.5 shrink-0">
                                          {isDone && (
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                          )}
                                          {isLate && (
                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                          )}
                                          {isPending && (
                                            <Clock className="w-4 h-4 text-amber-500" />
                                          )}
                                          {isSkipped && (
                                            <XCircle className="w-4 h-4 text-gray-400" />
                                          )}
                                        </div>

                                        {/* Time + info */}
                                        <div className="flex-1 min-w-0 space-y-0.5">
                                          {/* Scheduled time — editable if pending/late */}
                                          {isEditingThis ? (
                                            <div className="flex items-center gap-1">
                                              <Input
                                                type="datetime-local"
                                                className="h-7 text-xs w-44"
                                                value={editingDose.value}
                                                onChange={(e) =>
                                                  setEditingDose((d) =>
                                                    d
                                                      ? {
                                                          ...d,
                                                          value: e.target.value,
                                                        }
                                                      : d,
                                                  )
                                                }
                                              />
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 w-7 p-0 text-green-600"
                                                onClick={() =>
                                                  handleEditScheduledTime(
                                                    p.id,
                                                    a.id,
                                                    editingDose.value,
                                                  )
                                                }
                                              >
                                                <Check className="w-3.5 h-3.5" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 w-7 p-0 text-muted-foreground"
                                                onClick={() =>
                                                  setEditingDose(null)
                                                }
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1">
                                              <span
                                                className={`text-xs font-medium ${
                                                  isLate
                                                    ? "text-red-600"
                                                    : isDone
                                                      ? "text-green-700"
                                                      : ""
                                                }`}
                                              >
                                                Agendado:{" "}
                                                {formatDateTime(
                                                  a.scheduledTime,
                                                )}
                                              </span>
                                              {canAct && (
                                                <button
                                                  className="text-muted-foreground hover:text-foreground"
                                                  onClick={() =>
                                                    setEditingDose({
                                                      prescId: p.id,
                                                      adminId: a.id,
                                                      value: new Date(
                                                        a.scheduledTime,
                                                      )
                                                        .toLocaleString("sv")
                                                        .slice(0, 16),
                                                    })
                                                  }
                                                >
                                                  <Pencil className="w-3 h-3" />
                                                </button>
                                              )}
                                            </div>
                                          )}

                                          {/* Administration result */}
                                          {isDone && (
                                            <p className="text-xs text-green-700 flex items-center gap-1">
                                              <User2 className="w-3 h-3" />
                                              {a.administeredBy} •{" "}
                                              {formatDateTime(
                                                a.administeredAt!,
                                              )}
                                              {a.notes && ` • ${a.notes}`}
                                            </p>
                                          )}
                                          {isSkipped && (
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                              <User2 className="w-3 h-3" />
                                              Pulada por {a.administeredBy}
                                              {a.notes && ` • ${a.notes}`}
                                            </p>
                                          )}
                                          {isLate && (
                                            <p className="text-xs text-red-600 font-semibold">
                                              Atrasada — não registrada
                                            </p>
                                          )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 shrink-0">
                                          {isDone && (
                                            <Badge className="text-xs bg-green-100 text-green-800 border-transparent">
                                              OK
                                            </Badge>
                                          )}
                                          {isLate && (
                                            <Badge
                                              variant="destructive"
                                              className="text-xs"
                                            >
                                              Atrasada
                                            </Badge>
                                          )}
                                          {isPending && (
                                            <Badge className="text-xs bg-amber-100 text-amber-800 border-transparent">
                                              Pendente
                                            </Badge>
                                          )}
                                          {isSkipped && (
                                            <Badge
                                              variant="secondary"
                                              className="text-xs"
                                            >
                                              Pulada
                                            </Badge>
                                          )}
                                          {canAct && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-7 text-xs px-2"
                                              onClick={() => {
                                                setAdminForm({
                                                  administeredBy:
                                                    currentUser?.name ?? "",
                                                  administeredAt: new Date()
                                                    .toLocaleString("sv")
                                                    .slice(0, 16),
                                                  notes: "",
                                                  skipped: false,
                                                });
                                                setAdminDialog({
                                                  presc: p,
                                                  admin: a,
                                                });
                                              }}
                                            >
                                              Registrar
                                            </Button>
                                          )}
                                          {canAct && (
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                              onClick={() =>
                                                handleDeleteDose(p.id, a.id)
                                              }
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* New Hospitalization Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Internação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Pet *</Label>
              <Select
                value={form.petId}
                onValueChange={(v) => {
                  const pet = pets.find((p) => p.id === v);
                  setForm((f) => ({
                    ...f,
                    petId: v,
                    clientId: pet?.clientId ?? "",
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar pet..." />
                </SelectTrigger>
                <SelectContent>
                  {pets
                    .filter((p) => p.status === "active")
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} (
                        {clients.find((c) => c.id === p.clientId)?.name})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Veterinário</Label>
                <Select
                  value={form.vetId}
                  onValueChange={(v) => setForm((f) => ({ ...f, vetId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vets.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Box</Label>
                <Select
                  value={form.boxId}
                  onValueChange={(v) => setForm((f) => ({ ...f, boxId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {boxes
                      .filter((b) => b.active)
                      .map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Motivo *</Label>
              <Input
                value={form.reason}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reason: e.target.value }))
                }
              />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prescription Dialog */}
      <Dialog open={prescDialogOpen} onOpenChange={setPrescDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Prescrição</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Medicamento *</Label>
              <Input
                value={prescForm.medication}
                onChange={(e) =>
                  setPrescForm((f) => ({ ...f, medication: e.target.value }))
                }
                placeholder="Ex: Amoxicilina"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Dose</Label>
                <Input
                  value={prescForm.dosage}
                  onChange={(e) =>
                    setPrescForm((f) => ({ ...f, dosage: e.target.value }))
                  }
                  placeholder="Ex: 250mg"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Via</Label>
                <Select
                  value={prescForm.route}
                  onValueChange={(v) =>
                    setPrescForm((f) => ({ ...f, route: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VO">VO (oral)</SelectItem>
                    <SelectItem value="SC">SC (subcutâneo)</SelectItem>
                    <SelectItem value="IM">IM (intramuscular)</SelectItem>
                    <SelectItem value="IV">IV (intravenoso)</SelectItem>
                    <SelectItem value="Tópico">Tópico</SelectItem>
                    <SelectItem value="Ocular">Ocular</SelectItem>
                    <SelectItem value="Auricular">Auricular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Frequência</Label>
                <Select
                  value={prescForm.frequency}
                  onValueChange={(v) =>
                    setPrescForm((f) => ({ ...f, frequency: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6/6h">6/6h (4x ao dia)</SelectItem>
                    <SelectItem value="8/8h">8/8h (3x ao dia)</SelectItem>
                    <SelectItem value="12/12h">12/12h (2x ao dia)</SelectItem>
                    <SelectItem value="24/24h">24/24h (1x ao dia)</SelectItem>
                    <SelectItem value="48/48h">
                      48/48h (a cada 2 dias)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Dias de cobertura</Label>
                <Input
                  type="number"
                  min="1"
                  max="14"
                  value={prescForm.daysAhead}
                  onChange={(e) =>
                    setPrescForm((f) => ({ ...f, daysAhead: e.target.value }))
                  }
                  placeholder="3"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                value={prescForm.notes}
                onChange={(e) =>
                  setPrescForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
              />
            </div>
            {prescForm.frequency && prescForm.daysAhead && (
              <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded px-3 py-2">
                Serão agendadas{" "}
                <strong>
                  {Math.ceil(
                    (parseInt(prescForm.daysAhead) * 24) /
                      parseFrequencyHours(prescForm.frequency) +
                      1,
                  )}{" "}
                  doses
                </strong>{" "}
                para os próximos <strong>{prescForm.daysAhead} dias</strong>.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrescDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddPrescription}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Administration Registration Dialog */}
      <Dialog
        open={!!adminDialog}
        onOpenChange={(open) => {
          if (!open) {
            setAdminDialog(null);
            setAdminForm({
              administeredBy: "",
              administeredAt: "",
              notes: "",
              skipped: false,
            });
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Administração</DialogTitle>
          </DialogHeader>
          {adminDialog && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 space-y-0.5">
                <p className="text-sm font-semibold">
                  {adminDialog.presc.medication}
                </p>
                <p className="text-xs text-muted-foreground">
                  {adminDialog.presc.dosage}
                  {adminDialog.presc.route
                    ? ` • ${adminDialog.presc.route}`
                    : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Agendada para:{" "}
                  <span
                    className={
                      adminDialog.admin.status === "late"
                        ? "text-red-600 font-medium"
                        : ""
                    }
                  >
                    {formatDateTime(adminDialog.admin.scheduledTime)}
                  </span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Administrado por *</Label>
                  <Input
                    value={adminForm.administeredBy}
                    onChange={(e) =>
                      setAdminForm((f) => ({
                        ...f,
                        administeredBy: e.target.value,
                      }))
                    }
                    placeholder="Nome"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Hora da administração *</Label>
                  <Input
                    type="datetime-local"
                    value={adminForm.administeredAt}
                    onChange={(e) =>
                      setAdminForm((f) => ({
                        ...f,
                        administeredAt: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Textarea
                  value={adminForm.notes}
                  onChange={(e) =>
                    setAdminForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Reação, intercorrência, etc."
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <Checkbox
                  id="skip-dose"
                  checked={adminForm.skipped}
                  onCheckedChange={(v) =>
                    setAdminForm((f) => ({ ...f, skipped: !!v }))
                  }
                />
                <label htmlFor="skip-dose" className="text-sm cursor-pointer">
                  Pulou esta dose (não administrada)
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAdminDialog(null);
                setAdminForm({
                  administeredBy: "",
                  administeredAt: "",
                  notes: "",
                  skipped: false,
                });
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRegisterAdmin}
              variant={adminForm.skipped ? "secondary" : "default"}
            >
              {adminForm.skipped ? "Confirmar Pulo" : "Confirmar Administração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
