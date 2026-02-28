"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Search, ClipboardList, Stethoscope, FlaskConical, Pill, FileText, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { consultationsDb, clientsDb, petsDb, usersDb, appointmentsDb } from "@/mocks/db";
import type { Consultation, Client, Pet, User, Appointment } from "@/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const statusColors: Record<string, "info" | "success" | "secondary"> = {
  in_progress: "info", completed: "success", cancelled: "secondary",
};
const statusLabels: Record<string, string> = {
  in_progress: "Em andamento", completed: "Concluído", cancelled: "Cancelado",
};

export default function AtendimentoPage() {
  const { toast } = useToast();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [vets, setVets] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newForm, setNewForm] = useState({ petId: "", clientId: "", vetId: "", appointmentId: "__none__", chiefComplaint: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [cons, cls, pts, usrs, appts] = await Promise.all([
      consultationsDb.findAll(),
      clientsDb.findAll(),
      petsDb.findAll(),
      usersDb.findWhere((u) => u.role === "vet" || u.role === "admin"),
      appointmentsDb.findWhere((a) => a.status === "confirmed" || a.status === "scheduled" || a.status === "in_progress"),
    ]);
    setConsultations(cons.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setClients(cls);
    setPets(pts);
    setVets(usrs);
    setAppointments(appts);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = consultations.filter((c) => {
    const pet = pets.find((p) => p.id === c.petId);
    const client = clients.find((cl) => cl.id === c.clientId);
    const matchSearch = !search ||
      pet?.name.toLowerCase().includes(search.toLowerCase()) ||
      client?.name.toLowerCase().includes(search.toLowerCase()) ||
      c.chiefComplaint.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = async () => {
    if (!newForm.petId || !newForm.vetId || !newForm.chiefComplaint) {
      toast({ title: "Pet, veterinário e queixa principal são obrigatórios", variant: "destructive" });
      return;
    }
    const cons = await consultationsDb.create({
      petId: newForm.petId,
      clientId: newForm.clientId,
      vetId: newForm.vetId,
      appointmentId: newForm.appointmentId !== "__none__" ? newForm.appointmentId : undefined,
      status: "in_progress",
      date: new Date().toISOString(),
      chiefComplaint: newForm.chiefComplaint,
      medications: [],
      requestedExams: [],
    });
    if (newForm.appointmentId !== "__none__") {
      await appointmentsDb.update(newForm.appointmentId, { status: "in_progress" });
    }
    toast({ title: "Atendimento iniciado" });
    setNewDialogOpen(false);
    setNewForm({ petId: "", clientId: "", vetId: "", appointmentId: "__none__", chiefComplaint: "" });
    load();
    window.location.href = `/atendimento/${cons.id}`;
  };

  const clientPets = pets.filter((p) => p.clientId === newForm.clientId && p.status === "active");
  const todayAppts = appointments.filter((a) => {
    const today = new Date().toISOString().split("T")[0];
    return a.date.startsWith(today);
  });

  if (loading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Atendimentos</h1>
          <p className="text-muted-foreground text-sm">
            {consultations.filter((c) => c.status === "in_progress").length} em andamento hoje
          </p>
        </div>
        <Button onClick={() => setNewDialogOpen(true)}>
          <Plus className="w-4 h-4" /> Novo Atendimento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Em andamento", value: consultations.filter((c) => c.status === "in_progress").length, color: "text-blue-600", icon: Clock },
          { label: "Concluídos", value: consultations.filter((c) => c.status === "completed").length, color: "text-green-600", icon: CheckCircle2 },
          { label: "Total", value: consultations.length, color: "text-gray-600", icon: ClipboardList },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color} opacity-80`} />
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por pet, tutor ou queixa..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="in_progress">Em andamento</SelectItem>
            <SelectItem value="completed">Concluídos</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Pet</TableHead>
              <TableHead>Tutor</TableHead>
              <TableHead>Queixa Principal</TableHead>
              <TableHead>Veterinário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  Nenhum atendimento encontrado
                </TableCell>
              </TableRow>
            )}
            {filtered.map((c) => {
              const pet = pets.find((p) => p.id === c.petId);
              const client = clients.find((cl) => cl.id === c.clientId);
              const vet = vets.find((v) => v.id === c.vetId);
              return (
                <TableRow key={c.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(c.date)}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{pet?.name ?? "–"}</p>
                    <p className="text-xs text-muted-foreground">{pet?.species === "dog" ? "Cão" : pet?.species === "cat" ? "Gato" : pet?.species}</p>
                  </TableCell>
                  <TableCell className="text-sm">{client?.name ?? "–"}</TableCell>
                  <TableCell className="text-sm max-w-xs truncate">{c.chiefComplaint}</TableCell>
                  <TableCell className="text-sm">{vet?.name ?? "–"}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[c.status]}>{statusLabels[c.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/atendimento/${c.id}`}>
                      <Button variant="outline" size="sm" className="text-xs h-7">
                        {c.status === "in_progress" ? "Continuar" : "Ver"}
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* New Consultation Dialog */}
      {newDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold">Novo Atendimento</h2>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tutor</label>
                <Select value={newForm.clientId || "__none__"} onValueChange={(v) => setNewForm((f) => ({ ...f, clientId: v === "__none__" ? "" : v, petId: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar tutor..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Selecionar...</SelectItem>
                    {clients.filter((c) => c.active).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Pet *</label>
                <Select value={newForm.petId || "__none__"} onValueChange={(v) => setNewForm((f) => ({ ...f, petId: v === "__none__" ? "" : v }))} disabled={!newForm.clientId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar pet..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Selecionar...</SelectItem>
                    {clientPets.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Veterinário *</label>
                <Select value={newForm.vetId || "__none__"} onValueChange={(v) => setNewForm((f) => ({ ...f, vetId: v === "__none__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar veterinário..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Selecionar...</SelectItem>
                    {vets.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Agendamento (opcional)</label>
                <Select value={newForm.appointmentId} onValueChange={(v) => setNewForm((f) => ({ ...f, appointmentId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Vincular agendamento..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem agendamento</SelectItem>
                    {todayAppts.map((a) => {
                      const p = pets.find((pt) => pt.id === a.petId);
                      return <SelectItem key={a.id} value={a.id}>{a.startTime} – {p?.name} ({a.serviceType})</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Queixa Principal *</label>
                <Input
                  placeholder="Ex: Vômito há 2 dias, letargia..."
                  value={newForm.chiefComplaint}
                  onChange={(e) => setNewForm((f) => ({ ...f, chiefComplaint: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate}>Iniciar Atendimento</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
