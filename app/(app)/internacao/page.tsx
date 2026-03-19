"use client";
import { useState } from "react";
import {
  Plus,
  BedDouble,
  Syringe,
  Trash2,
  CheckSquare,
  Square,
  Clock,
  CheckCheck,
  History,
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hospitalizationService } from "@/services/hospitalization.service";
import { boxService, type StoreBoxPayload } from "@/services/box.service";
import { petService } from "@/services/pet.service";
import { userService } from "@/services/user.service";
import type {
  ApiHospitalization,
  ApiHospPrescription,
  ApiBox,
  ApiPet,
  ApiUser,
} from "@/types/api";
import { formatDate, formatDateTime } from "@/lib/utils";
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
  return 8;
}

export default function InternacaoPage() {
  const { toast } = useToast();
  const { user: currentUser } = useSessionStore();
  const qc = useQueryClient();

  const [selected, setSelected] = useState<ApiHospitalization | null>(null);
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
  const [confirmingDose, setConfirmingDose] = useState<{
    presc: ApiHospPrescription;
    slotTime: Date;
  } | null>(null);
  const [doseNotes, setDoseNotes] = useState("");
  const [administeredTime, setAdministeredTime] = useState("");
  const [boxDialogOpen, setBoxDialogOpen] = useState(false);
  const [editingBox, setEditingBox] = useState<ApiBox | null>(null);
  const [boxForm, setBoxForm] = useState<StoreBoxPayload & { active: boolean }>(
    { name: "", size: "P", location: "", notes: "", active: true },
  );
  const isAutonomous = currentUser?.accountType === "autonomous";

  const { data: hospitalizations = [], isLoading: loadingHosps } = useQuery({
    queryKey: ["hospitalizations"],
    queryFn: () => hospitalizationService.list(),
    select: (data: ApiHospitalization[]) =>
      [...data].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
  });

  const { data: boxes = [] } = useQuery({
    queryKey: ["boxes"],
    queryFn: () => boxService.list(),
    select: (data: ApiBox[]) => data.filter((b) => b.active),
  });

  const { data: pets = [] } = useQuery({
    queryKey: ["pets"],
    queryFn: () => petService.list(),
    select: (data: ApiPet[]) => data,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => userService.list(),
    enabled: !isAutonomous,
  });

  const vets = isAutonomous
    ? currentUser
      ? [
          {
            id: currentUser.id,
            name: currentUser.name,
            email: "",
            role: "vet",
            account_type: "autonomous",
            clinic_id: null,
            phone: null,
            avatar: null,
            active: true,
            clinic: null,
            created_at: "",
            updated_at: "",
          } as ApiUser,
        ]
      : []
    : allUsers;

  const loading = loadingHosps;

  const invalidateHosps = () =>
    qc.invalidateQueries({ queryKey: ["hospitalizations"] });
  const invalidateBoxes = () => qc.invalidateQueries({ queryKey: ["boxes"] });
  const invalidate = invalidateHosps;

  const createBoxMutation = useMutation({
    mutationFn: boxService.create,
    onSuccess: () => {
      toast({ title: editingBox ? "Box atualizado" : "Box criado" });
      setBoxDialogOpen(false);
      invalidateBoxes();
    },
    onError: () =>
      toast({ title: "Erro ao salvar box", variant: "destructive" }),
  });

  const updateBoxMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<StoreBoxPayload & { active: boolean }>;
    }) => boxService.update(id, payload),
    onSuccess: () => {
      toast({ title: "Box atualizado" });
      setBoxDialogOpen(false);
      invalidateBoxes();
    },
    onError: () =>
      toast({ title: "Erro ao atualizar box", variant: "destructive" }),
  });

  const deleteBoxMutation = useMutation({
    mutationFn: boxService.delete,
    onSuccess: () => {
      toast({ title: "Box excluído" });
      invalidateBoxes();
    },
    onError: () =>
      toast({ title: "Erro ao excluir box", variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: hospitalizationService.create,
    onSuccess: () => {
      toast({ title: "Internação registrada" });
      setDialogOpen(false);
      invalidate();
    },
    onError: () =>
      toast({ title: "Erro ao registrar internação", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof hospitalizationService.update>[1];
    }) => hospitalizationService.update(id, payload),
    onSuccess: (updated) => {
      invalidate();
      if (selected?.id === updated.id) setSelected(updated);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      hospitalizationService.updateStatus(id, status),
    onSuccess: (updated) => {
      invalidate();
      if (selected?.id === updated.id) setSelected(updated);
    },
  });

  const addPrescMutation = useMutation({
    mutationFn: ({
      hospId,
      payload,
    }: {
      hospId: string;
      payload: Parameters<typeof hospitalizationService.addPrescription>[1];
    }) => hospitalizationService.addPrescription(hospId, payload),
    onSuccess: async () => {
      toast({ title: "Prescrição adicionada" });
      setPrescDialogOpen(false);
      setPrescForm({
        medication: "",
        dosage: "",
        route: "",
        frequency: "",
        notes: "",
        daysAhead: "3",
      });
      await invalidate();
      if (selected) {
        const updated = await hospitalizationService.get(selected.id);
        setSelected(updated);
      }
    },
    onError: () =>
      toast({ title: "Erro ao adicionar prescrição", variant: "destructive" }),
  });

  const confirmDoseMutation = useMutation({
    mutationFn: ({
      hospId,
      prescId,
      scheduledTime,
      administeredAt,
      notes,
    }: {
      hospId: string;
      prescId: string;
      scheduledTime: string;
      administeredAt: string;
      notes?: string;
    }) =>
      hospitalizationService.addAdministration(hospId, prescId, {
        scheduled_time: scheduledTime,
        administered_at: administeredAt,
        administered_by: currentUser?.name ?? currentUser?.id ?? "Equipe",
        notes,
      }),
    onSuccess: async () => {
      toast({
        title: "Dose confirmada!",
        description: "Administração registrada com sucesso",
      });
      setConfirmingDose(null);
      setDoseNotes("");
      setAdministeredTime("");
      await invalidate();
      if (selected) {
        const updated = await hospitalizationService.get(selected.id);
        setSelected(updated);
      }
    },
    onError: () =>
      toast({ title: "Erro ao confirmar dose", variant: "destructive" }),
  });

  const deletePrescMutation = useMutation({
    mutationFn: ({ hospId, prescId }: { hospId: string; prescId: string }) =>
      hospitalizationService.deletePrescription(hospId, prescId),
    onSuccess: async () => {
      toast({ title: "Prescrição excluída" });
      setExpandedPresc(null);
      await invalidate();
      if (selected) {
        const updated = await hospitalizationService.get(selected.id);
        setSelected(updated);
      }
    },
  });

  const openNewBox = () => {
    setEditingBox(null);
    setBoxForm({ name: "", size: "P", location: "", notes: "", active: true });
    setBoxDialogOpen(true);
  };

  const openEditBox = (b: ApiBox) => {
    setEditingBox(b);
    setBoxForm({
      name: b.name,
      size: b.size ?? "P",
      location: b.location ?? "",
      notes: b.notes ?? "",
      active: b.active,
    });
    setBoxDialogOpen(true);
  };

  const handleSaveBox = () => {
    if (!boxForm.name.trim()) {
      toast({ title: "Nome do box é obrigatório", variant: "destructive" });
      return;
    }
    if (editingBox) {
      updateBoxMutation.mutate({ id: editingBox.id, payload: boxForm });
    } else {
      createBoxMutation.mutate({
        name: boxForm.name,
        size: boxForm.size,
        location: boxForm.location || undefined,
        notes: boxForm.notes || undefined,
      });
    }
  };

  const openNew = () => {
    setForm({
      petId: "",
      clientId: "",
      vetId: isAutonomous && currentUser ? currentUser.id : "",
      boxId: "",
      reason: "",
      notes: "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.petId || !form.reason) {
      toast({ title: "Pet e motivo são obrigatórios", variant: "destructive" });
      return;
    }
    const pet = pets.find((p) => p.id === form.petId);
    createMutation.mutate({
      pet_id: form.petId,
      client_id: form.clientId || pet?.client?.id || undefined,
      vet_id: form.vetId || undefined,
      box_id: form.boxId || undefined,
      status: "active",
      admission_date: new Date().toISOString().split("T")[0],
      reason: form.reason,
      notes: form.notes || undefined,
    });
  };

  const handleDischarge = (h: ApiHospitalization) => {
    if (!confirm("Dar alta a este animal?")) return;
    statusMutation.mutate({ id: h.id, status: "discharged" });
    toast({ title: "Alta registrada" });
    if (selected?.id === h.id) setSelected(null);
  };

  const handleCancel = (h: ApiHospitalization) => {
    if (!confirm("Cancelar esta internação?")) return;
    statusMutation.mutate({ id: h.id, status: "cancelled" });
    toast({ title: "Internação cancelada" });
    if (selected?.id === h.id) setSelected(null);
  };

  const handleReopen = (h: ApiHospitalization) => {
    statusMutation.mutate({ id: h.id, status: "active" });
    toast({ title: "Internação reaberta" });
  };

  const handleMoveBox = (h: ApiHospitalization, boxId: string) => {
    updateMutation.mutate({ id: h.id, payload: { box_id: boxId } });
    toast({ title: "Box atualizado" });
  };

  const handleAddPrescription = () => {
    if (!selected || !prescForm.medication || !prescForm.dosage) return;

    const startDate = new Date();
    const endDate = new Date();
    // daysAhead = 3 means 3 days total (today + 2 more days), so add (daysAhead - 1)
    endDate.setDate(
      endDate.getDate() + parseInt(prescForm.daysAhead || "3") - 1,
    );

    addPrescMutation.mutate({
      hospId: selected.id,
      payload: {
        medication: prescForm.medication,
        dosage: prescForm.dosage,
        frequency: prescForm.frequency || "8/8h",
        route: prescForm.route || undefined,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        notes: prescForm.notes || undefined,
      },
    });
  };

  const handleDeletePrescription = (prescId: string) => {
    if (!selected) return;
    if (!confirm("Excluir esta prescrição?")) return;
    deletePrescMutation.mutate({ hospId: selected.id, prescId });
  };

  const getPet = (id: string) => pets.find((p: ApiPet) => p.id === id);
  const getBox = (id?: string | null) => boxes.find((b: ApiBox) => b.id === id);

  const active = hospitalizations.filter((h) => h.status === "active");
  const others = hospitalizations.filter((h) => h.status !== "active");

  if (loading)
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary [font-family:var(--font-heading)]">Internação</h1>
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
          { label: "Internados", value: active.length, color: "text-info" },
          {
            label: "Alta hoje",
            value: others.filter((h) =>
              h.discharge_date?.startsWith(
                new Date().toISOString().split("T")[0],
              ),
            ).length,
            color: "text-success",
          },
          {
            label: "Boxes livres",
            value: boxes.filter(
              (b) => b.active && !active.find((h) => h.box_id === b.id),
            ).length,
            color: "text-primary",
          },
          {
            label: "Total histórico",
            value: hospitalizations.length,
            color: "text-muted-foreground",
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
            const pet = getPet(h.pet_id);
            const box = getBox(h.box_id);
            return (
              <Card
                key={h.id}
                className={`cursor-pointer transition-colors ${selected?.id === h.id ? "border-primary" : ""}`}
                onClick={() => setSelected(h)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        {h.pet?.name ?? pet?.name ?? "–"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {h.client?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {box?.name ?? h.box?.name ?? "Sem box"} •{" "}
                        {formatDate(h.admission_date)}
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
            const pet = getPet(h.pet_id);
            return (
              <Card
                key={h.id}
                className={`cursor-pointer opacity-70 transition-colors ${selected?.id === h.id ? "border-primary opacity-100" : ""}`}
                onClick={() => setSelected(h)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {h.pet?.name ?? pet?.name ?? "–"}
                    </p>
                    <Badge variant={statusColors[h.status]}>
                      {statusLabels[h.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(h.admission_date)}{" "}
                    {h.discharge_date && `→ ${formatDate(h.discharge_date)}`}
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
                    <CardTitle>
                      {selected.pet?.name ??
                        getPet(selected.pet_id)?.name ??
                        "–"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selected.client?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={statusColors[selected.status]}>
                      {statusLabels[selected.status]}
                    </Badge>
                    {selected.status === "active" && (
                      <>
                        <Select
                          value={selected.box_id ?? ""}
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
                      Prescrições ({selected.prescriptions?.length ?? 0})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Admissão</p>
                        <p className="font-medium">
                          {formatDateTime(selected.admission_date)}
                        </p>
                      </div>
                      {selected.discharge_date && (
                        <div>
                          <p className="text-muted-foreground">Alta</p>
                          <p className="font-medium">
                            {formatDateTime(selected.discharge_date)}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Box</p>
                        <p className="font-medium">
                          {selected.box?.name ??
                            getBox(selected.box_id)?.name ??
                            "–"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Veterinário</p>
                        <p className="font-medium">
                          {selected.vet?.name ??
                            (vets as ApiUser[]).find(
                              (v) => v.id === selected.vet_id,
                            )?.name ??
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
                    {(selected.prescriptions?.length ?? 0) === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        Nenhuma prescrição cadastrada
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {(selected.prescriptions ?? []).map((p) => {
                          const now = new Date();

                          // Use doses from backend (administrations)
                          const allDoses = (p.administrations ?? []).map(
                            (admin) => ({
                              id: admin.id,
                              scheduledTime: new Date(admin.scheduled_time),
                              administeredAt: admin.administered_at
                                ? new Date(admin.administered_at)
                                : null,
                              administeredBy: admin.administered_by,
                              notes: admin.notes,
                              status: admin.status as
                                | "pending"
                                | "done"
                                | "late"
                                | "skipped",
                            }),
                          );

                          // Sort by scheduled time
                          allDoses.sort(
                            (a, b) =>
                              a.scheduledTime.getTime() -
                              b.scheduledTime.getTime(),
                          );

                          const isExpanded = expandedPresc === p.id;
                          const doneCount = allDoses.filter(
                            (d) => d.status === "done",
                          ).length;
                          const totalDoses = allDoses.length;

                          return (
                            <div
                              key={p.id}
                              className="rounded-lg border border-info/25 overflow-hidden"
                            >
                              {/* Header */}
                              <div className="flex items-start gap-3 p-3 bg-info/10">
                                <Syringe className="w-4 h-4 text-info mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="font-semibold text-sm">
                                        {p.medication}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {p.dosage}
                                        {p.route ? ` • ${p.route}` : ""} •{" "}
                                        {p.frequency}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatDate(p.start_date)}
                                        {p.end_date
                                          ? ` – ${formatDate(p.end_date)}`
                                          : ""}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {totalDoses > 0 && (
                                        <span
                                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                            doneCount === totalDoses
                                              ? "bg-success/12 text-success"
                                              : "bg-warning/12 text-[color:var(--warning)]"
                                           }`}
                                         >
                                          {doneCount}/{totalDoses}
                                        </span>
                                      )}
                                      {selected.status === "active" && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                          onClick={() =>
                                            handleDeletePrescription(p.id)
                                          }
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      )}
                                      <button
                                        onClick={() =>
                                          setExpandedPresc(
                                            isExpanded ? null : p.id,
                                          )
                                        }
                                        className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground px-1"
                                      >
                                        <History className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Dose slots */}
                              {allDoses.length === 0 ? (
                                <div className="px-4 py-3 text-xs text-muted-foreground">
                                  Nenhuma dose programada
                                </div>
                              ) : (
                                <div className="divide-y">
                                  {allDoses.map((dose) => {
                                    const isPast = dose.scheduledTime < now;
                                    const isLate = dose.status === "late";
                                    const isDone = dose.status === "done";
                                    const isFuture = dose.scheduledTime > now;
                                    return (
                                      <div
                                        key={dose.id}
                                        className={`flex items-center gap-3 px-4 py-2.5 ${
                                          isDone
                                            ? "bg-success/10"
                                            : isLate
                                              ? "bg-destructive/10"
                                              : isFuture
                                                ? "bg-info/8"
                                                : "bg-white"
                                        }`}
                                      >
                                        <button
                                          disabled={
                                            isDone ||
                                            isFuture ||
                                            selected.status !== "active" ||
                                            confirmDoseMutation.isPending
                                          }
                                          onClick={() => {
                                            setConfirmingDose({
                                              presc: p,
                                              slotTime: dose.scheduledTime,
                                            });
                                            setDoseNotes("");
                                            const now = new Date();
                                            const hours = String(
                                              now.getHours(),
                                            ).padStart(2, "0");
                                            const minutes = String(
                                              now.getMinutes(),
                                            ).padStart(2, "0");
                                            setAdministeredTime(
                                              `${hours}:${minutes}`,
                                            );
                                          }}
                                          className="shrink-0 disabled:opacity-60"
                                        >
                                          {isDone ? (
                                            <CheckSquare className="w-5 h-5 text-success" />
                                          ) : (
                                            <Square className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                                          )}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <Clock className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-sm font-medium">
                                              {dose.scheduledTime.toLocaleTimeString(
                                                "pt-BR",
                                                {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                },
                                              )}
                                              {" • "}
                                              {dose.scheduledTime.toLocaleDateString(
                                                "pt-BR",
                                                {
                                                  day: "2-digit",
                                                  month: "short",
                                                },
                                              )}
                                            </span>
                                            {isLate && (
                                              <span className="text-xs bg-destructive/12 text-destructive px-1.5 py-0.5 rounded-full font-medium">
                                                Atrasada
                                              </span>
                                            )}
                                          </div>
                                          {isDone && dose.administeredAt && (
                                            <p className="text-xs text-success mt-0.5">
                                              <CheckCheck className="w-3 h-3 inline mr-1" />
                                              Administrado{" "}
                                              {dose.administeredAt.toLocaleTimeString(
                                                "pt-BR",
                                                {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                },
                                              )}
                                              {" por "}
                                              {dose.administeredBy}
                                              {dose.notes && ` • ${dose.notes}`}
                                            </p>
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

      {/* Boxes Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Boxes</p>
          <Button size="sm" variant="outline" onClick={openNewBox}>
            <Plus className="w-4 h-4 mr-1" /> Novo Box
          </Button>
        </div>
        {boxes.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Nenhum box cadastrado. Crie um box para alocar os animais
              internados.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {boxes.map((b) => {
              const occupant = active.find((h) => h.box_id === b.id);
              return (
                <Card
                  key={b.id}
                  className={`relative ${occupant ? "border-info/35 bg-info/10" : "border-success/35 bg-success/10"}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{b.name}</p>
                        {b.size && (
                          <p className="text-xs text-muted-foreground">
                            Tam: {b.size}
                          </p>
                        )}
                        {b.location && (
                          <p className="text-xs text-muted-foreground">
                            {b.location}
                          </p>
                        )}
                        {occupant ? (
                          <p className="text-xs text-info font-medium mt-1">
                            {occupant.pet?.name ?? "Ocupado"}
                          </p>
                        ) : (
                          <p className="text-xs text-success font-medium mt-1">
                            Livre
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => openEditBox(b)}
                        >
                          <Plus className="w-3 h-3 rotate-45" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Excluir box?"))
                              deleteBoxMutation.mutate(b.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
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
                    clientId: pet?.client?.id ?? "",
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar pet..." />
                </SelectTrigger>
                <SelectContent>
                  {pets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      {p.client ? ` (${p.client.name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Veterinário</Label>
                {isAutonomous ? (
                  <Input
                    value={currentUser?.name ?? ""}
                    readOnly
                    className="bg-muted"
                  />
                ) : (
                  <Select
                    value={form.vetId}
                    onValueChange={(v: string) =>
                      setForm((f) => ({ ...f, vetId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(vets as ApiUser[]).map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
              <p className="text-xs text-muted-foreground bg-info/8 border border-info/20 rounded px-3 py-2">
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

      {/* Dose Confirmation Dialog */}
      <Dialog
        open={!!confirmingDose}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmingDose(null);
            setDoseNotes("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-success" />
              Confirmar Administração
            </DialogTitle>
          </DialogHeader>
          {confirmingDose && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-info/8 border border-info/20 p-3 space-y-1">
                <p className="text-sm font-semibold">
                  {confirmingDose.presc.medication}
                </p>
                <p className="text-xs text-muted-foreground">
                  {confirmingDose.presc.dosage}
                  {confirmingDose.presc.route
                    ? ` • ${confirmingDose.presc.route}`
                    : ""}
                  {" • "}
                  {confirmingDose.presc.frequency}
                </p>
                <p className="text-xs text-muted-foreground">
                  Dose prevista:{" "}
                  <strong>
                    {confirmingDose.slotTime.toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Administrado por:{" "}
                  <strong>{currentUser?.name ?? "Equipe"}</strong>
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Hora da Administração *</Label>
                <Input
                  type="time"
                  value={administeredTime}
                  onChange={(e) => setAdministeredTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Observações (opcional)</Label>
                <Textarea
                  value={doseNotes}
                  onChange={(e) => setDoseNotes(e.target.value)}
                  placeholder="Reação, intercorrência, etc."
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmingDose(null);
                setDoseNotes("");
                setAdministeredTime("");
              }}
            >
              Cancelar
            </Button>
            <Button
              disabled={confirmDoseMutation.isPending || !administeredTime}
              onClick={() => {
                if (!selected || !confirmingDose || !administeredTime) return;

                // Combine today's date with the selected time
                const [hours, minutes] = administeredTime.split(":");
                const administeredDate = new Date();
                administeredDate.setHours(parseInt(hours, 10));
                administeredDate.setMinutes(parseInt(minutes, 10));
                administeredDate.setSeconds(0);

                confirmDoseMutation.mutate({
                  hospId: selected.id,
                  prescId: confirmingDose.presc.id,
                  scheduledTime: confirmingDose.slotTime.toISOString(),
                  administeredAt: administeredDate.toISOString(),
                  notes: doseNotes || undefined,
                });
              }}
            >
              {confirmDoseMutation.isPending ? "Confirmando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Box CRUD Dialog */}
      <Dialog open={boxDialogOpen} onOpenChange={setBoxDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingBox ? "Editar Box" : "Novo Box"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input
                value={boxForm.name}
                onChange={(e) =>
                  setBoxForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Ex: Box 01, UTI A"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tamanho</Label>
                <Select
                  value={boxForm.size}
                  onValueChange={(v: string) =>
                    setBoxForm((f) => ({ ...f, size: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P">Pequeno</SelectItem>
                    <SelectItem value="M">Médio</SelectItem>
                    <SelectItem value="G">Grande</SelectItem>
                    <SelectItem value="GG">Extra Grande</SelectItem>
                    <SelectItem value="UTI">UTI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Localização</Label>
                <Input
                  value={boxForm.location}
                  onChange={(e) =>
                    setBoxForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="Ex: Ala A"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                value={boxForm.notes}
                onChange={(e) =>
                  setBoxForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBoxDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveBox}
              disabled={
                createBoxMutation.isPending || updateBoxMutation.isPending
              }
            >
              {createBoxMutation.isPending || updateBoxMutation.isPending
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
