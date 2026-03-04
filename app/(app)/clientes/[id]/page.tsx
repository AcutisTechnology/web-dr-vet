"use client";
import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  ArrowLeft,
  Edit,
  Skull,
  Printer,
  Download,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientService } from "@/services/client.service";
import { petService } from "@/services/pet.service";
import { medicalEventService } from "@/services/medical-event.service";
import { adaptApiClientToClient } from "@/adapters/client.adapter";
import { adaptApiPetToPet } from "@/adapters/pet.adapter";
import { useUpdatePet } from "@/hooks/use-clients-pets";
import type { ApiMedicalEvent } from "@/types/api";
import type { Pet } from "@/types";
import { formatDate, exportToCSV } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const eventTypeLabels: Record<string, string> = {
  consultation: "Consulta",
  vaccine: "Vacina",
  exam: "Exame",
  prescription: "Receita",
  observation: "Observação",
  weight: "Pesagem",
  surgery: "Cirurgia",
  return: "Retorno",
};
const eventTypeColors: Record<string, string> = {
  consultation: "bg-blue-100 text-blue-800",
  vaccine: "bg-green-100 text-green-800",
  exam: "bg-purple-100 text-purple-800",
  prescription: "bg-orange-100 text-orange-800",
  observation: "bg-gray-100 text-gray-800",
  weight: "bg-cyan-100 text-cyan-800",
  surgery: "bg-red-100 text-red-800",
  return: "bg-yellow-100 text-yellow-800",
};

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: client, isLoading: loadingClient } = useQuery({
    queryKey: ["clients", id],
    queryFn: () => clientService.get(id),
    select: adaptApiClientToClient,
    enabled: !!id,
  });

  const { data: pets = [], isLoading: loadingPets } = useQuery({
    queryKey: ["pets", "client", id],
    queryFn: () => petService.byClient(id),
    select: (data) => data.map(adaptApiPetToPet),
    enabled: !!id,
  });

  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  // Auto-select first pet
  const effectivePet = selectedPet ?? (pets.length > 0 ? pets[0] : null);

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ["medical-events", effectivePet?.id],
    queryFn: () => medicalEventService.byPet(effectivePet!.id),
    select: (data) =>
      [...data].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    enabled: !!effectivePet?.id,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const updatePet = useUpdatePet();
  const createEvent = useMutation({
    mutationFn: (payload: Parameters<typeof medicalEventService.create>[0]) =>
      medicalEventService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medical-events", effectivePet?.id] });
    },
  });

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    type: "consultation",
    date: new Date().toISOString().split("T")[0],
    description: "",
    diagnosis: "",
    treatment: "",
    notes: "",
    vital_signs: "",
    medications: "",
    exams: "",
  });

  const resetEventForm = () =>
    setEventForm({
      type: "consultation",
      date: new Date().toISOString().split("T")[0],
      description: "",
      diagnosis: "",
      treatment: "",
      notes: "",
      vital_signs: "",
      medications: "",
      exams: "",
    });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleMarkDeceased = (pet: Pet) => {
    if (!confirm(`Marcar ${pet.name} como falecido?`)) return;
    updatePet.mutate(
      { id: pet.id, payload: {} },
      {
        onSuccess: () => toast({ title: `${pet.name} marcado como falecido` }),
      },
    );
  };

  const handleSaveEvent = () => {
    if (!effectivePet) return;
    createEvent.mutate(
      {
        pet_id: effectivePet.id,
        type: eventForm.type,
        date: eventForm.date,
        description: eventForm.description || undefined,
        diagnosis: eventForm.diagnosis || undefined,
        treatment: eventForm.treatment || undefined,
        notes: eventForm.notes || undefined,
        vital_signs: eventForm.vital_signs || undefined,
        medications: eventForm.medications || undefined,
        exams: eventForm.exams || undefined,
      },
      {
        onSuccess: () => {
          toast({ title: "Evento registrado" });
          setEventDialogOpen(false);
          resetEventForm();
        },
        onError: () =>
          toast({ title: "Erro ao registrar evento", variant: "destructive" }),
      },
    );
  };

  const handlePrintPrescription = (event: ApiMedicalEvent) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Receita</title>
      <style>body{font-family:Arial;padding:30px;max-width:600px}h2{color:#333}hr{margin:20px 0}.block{margin:10px 0;padding:10px;border:1px solid #ddd;border-radius:4px}</style>
      </head><body>
      <h2>VetDom – Receituário Veterinário</h2>
      <p><b>Pet:</b> ${effectivePet?.name} | <b>Data:</b> ${formatDate(event.date)}</p>
      <hr/>
      ${event.medications ? `<div class="block"><b>Medicações:</b><br/>${event.medications}</div>` : ""}
      ${event.diagnosis ? `<div class="block"><b>Diagnóstico:</b><br/>${event.diagnosis}</div>` : ""}
      ${event.treatment ? `<div class="block"><b>Tratamento:</b><br/>${event.treatment}</div>` : ""}
      <hr/>
      <p style="font-size:12px;color:#666">Impresso em ${new Date().toLocaleString("pt-BR")}</p>
      </body></html>
    `);
    win.print();
  };

  const handleExportCSV = () => {
    exportToCSV(
      events.map((e) => ({
        Data: formatDate(e.date),
        Tipo: eventTypeLabels[e.type] ?? e.type,
        Descrição: e.description ?? "",
        Diagnóstico: e.diagnosis ?? "",
        Tratamento: e.treatment ?? "",
        Notas: e.notes ?? "",
      })),
      `prontuario-${effectivePet?.name}`,
    );
  };

  // ── Render guards ──────────────────────────────────────────────────────────
  const loading = loadingClient || loadingPets;

  if (loading)
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  if (!client)
    return (
      <div className="text-center py-12 text-muted-foreground">
        Cliente não encontrado
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground text-sm">
            {client.phone} {client.email && `• ${client.email}`}
          </p>
        </div>
      </div>

      <Tabs defaultValue="pets">
        <TabsList>
          <TabsTrigger value="pets">Pets ({pets.length})</TabsTrigger>
          <TabsTrigger value="prontuario" disabled={!effectivePet}>
            Prontuário
          </TabsTrigger>
          <TabsTrigger value="info">Dados do Cliente</TabsTrigger>
        </TabsList>

        {/* ── Pets tab ── */}
        <TabsContent value="pets" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Link href={`/clientes/${id}/pets/new`}>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" /> Novo Pet
              </Button>
            </Link>
          </div>
          {pets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum pet cadastrado
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pets.map((pet) => (
                <Card
                  key={pet.id}
                  className={`cursor-pointer transition-colors ${effectivePet?.id === pet.id ? "border-primary" : ""} ${pet.status === "deceased" ? "opacity-60" : ""}`}
                  onClick={() => setSelectedPet(pet)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{pet.name}</p>
                          {pet.status === "deceased" && (
                            <Badge variant="destructive">Óbito</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {pet.breed} •{" "}
                          {pet.species === "dog"
                            ? "Cão"
                            : pet.species === "cat"
                              ? "Gato"
                              : pet.species}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pet.sex === "male" ? "Macho" : "Fêmea"} •{" "}
                          {pet.neutered ? "Castrado" : "Inteiro"}
                        </p>
                        {pet.weight && (
                          <p className="text-xs text-muted-foreground">
                            {pet.weight} kg
                          </p>
                        )}
                        {pet.birthDate && (
                          <p className="text-xs text-muted-foreground">
                            Nasc: {formatDate(pet.birthDate)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/clientes/${id}/pets/${pet.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Ver / Editar pet"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                        {pet.status === "active" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkDeceased(pet);
                            }}
                          >
                            <Skull className="w-3 h-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {pet.notes && (
                      <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-2">
                        {pet.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Prontuário tab ── */}
        <TabsContent value="prontuario" className="space-y-4 mt-4">
          {effectivePet && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-medium">
                  Prontuário de{" "}
                  <span className="text-primary">{effectivePet.name}</span>
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="w-4 h-4 mr-1" /> Exportar CSV
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      resetEventForm();
                      setEventDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Novo Evento
                  </Button>
                </div>
              </div>
              {loadingEvents ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : events.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Nenhum evento registrado
                  </CardContent>
                </Card>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-4 pl-10">
                    {events.map((event) => (
                      <div key={event.id} className="relative">
                        <div
                          className={`absolute -left-6 top-3 w-3 h-3 rounded-full border-2 border-background ${(eventTypeColors[event.type] ?? "bg-gray-100 text-gray-800").split(" ")[0]}`}
                        />
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${eventTypeColors[event.type] ?? "bg-gray-100 text-gray-800"}`}
                                  >
                                    {eventTypeLabels[event.type] ?? event.type}
                                  </span>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(event.date)}
                                  </p>
                                  {event.vet && (
                                    <p className="text-xs text-muted-foreground">
                                      • {event.vet.name}
                                    </p>
                                  )}
                                </div>
                                {event.description && (
                                  <p className="text-sm mt-2">
                                    {event.description}
                                  </p>
                                )}
                                {event.vital_signs && (
                                  <p className="text-sm mt-1 bg-muted p-2 rounded">
                                    <strong>Sinais vitais:</strong>{" "}
                                    {event.vital_signs}
                                  </p>
                                )}
                                {event.diagnosis && (
                                  <p className="text-sm mt-1">
                                    <strong>Diagnóstico:</strong>{" "}
                                    {event.diagnosis}
                                  </p>
                                )}
                                {event.treatment && (
                                  <p className="text-sm mt-1">
                                    <strong>Tratamento:</strong>{" "}
                                    {event.treatment}
                                  </p>
                                )}
                                {event.medications && (
                                  <p className="text-sm mt-1 bg-orange-50 text-orange-800 rounded px-2 py-1">
                                    <strong>Medicações:</strong>{" "}
                                    {event.medications}
                                  </p>
                                )}
                                {event.exams && (
                                  <p className="text-sm mt-1 bg-purple-50 text-purple-800 rounded px-2 py-1">
                                    <strong>Exames:</strong> {event.exams}
                                  </p>
                                )}
                                {event.notes && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {event.notes}
                                  </p>
                                )}
                              </div>
                              {event.type === "prescription" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handlePrintPrescription(event)}
                                  title="Imprimir receita"
                                >
                                  <Printer className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Client info tab ── */}
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nome</p>
                  <p className="font-medium">{client.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefone</p>
                  <p className="font-medium">{client.phone}</p>
                </div>
                {client.email && (
                  <div>
                    <p className="text-muted-foreground">E-mail</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                )}
                {client.cpf && (
                  <div>
                    <p className="text-muted-foreground">CPF</p>
                    <p className="font-medium">{client.cpf}</p>
                  </div>
                )}
                {client.address && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Endereço</p>
                    <p className="font-medium">
                      {client.address.street}, {client.address.number} –{" "}
                      {client.address.neighborhood}, {client.address.city}/
                      {client.address.state}
                    </p>
                  </div>
                )}
                {client.notes && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Observações</p>
                    <p className="font-medium">{client.notes}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Cadastrado em</p>
                  <p className="font-medium">{formatDate(client.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Event Dialog ── */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Evento – {effectivePet?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select
                  value={eventForm.type}
                  onValueChange={(v) =>
                    setEventForm((f) => ({ ...f, type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(eventTypeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={eventForm.date}
                  onChange={(e) =>
                    setEventForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Descrição / Queixa principal</Label>
                <Textarea
                  value={eventForm.description}
                  onChange={(e) =>
                    setEventForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={2}
                />
              </div>
              {(eventForm.type === "consultation" ||
                eventForm.type === "surgery") && (
                <>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Sinais vitais</Label>
                    <Input
                      value={eventForm.vital_signs}
                      onChange={(e) =>
                        setEventForm((f) => ({
                          ...f,
                          vital_signs: e.target.value,
                        }))
                      }
                      placeholder="FC, FR, Temp, TPC..."
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Diagnóstico</Label>
                    <Textarea
                      value={eventForm.diagnosis}
                      onChange={(e) =>
                        setEventForm((f) => ({
                          ...f,
                          diagnosis: e.target.value,
                        }))
                      }
                      rows={2}
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Tratamento</Label>
                    <Textarea
                      value={eventForm.treatment}
                      onChange={(e) =>
                        setEventForm((f) => ({
                          ...f,
                          treatment: e.target.value,
                        }))
                      }
                      rows={2}
                    />
                  </div>
                </>
              )}
              {(eventForm.type === "prescription" ||
                eventForm.type === "consultation") && (
                <div className="col-span-2 space-y-1.5">
                  <Label>Medicações prescritas</Label>
                  <Textarea
                    value={eventForm.medications}
                    onChange={(e) =>
                      setEventForm((f) => ({
                        ...f,
                        medications: e.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Ex: Amoxicilina 500mg – 1 comp. 2x/dia por 7 dias"
                  />
                </div>
              )}
              {eventForm.type === "exam" && (
                <div className="col-span-2 space-y-1.5">
                  <Label>Resultado dos exames</Label>
                  <Textarea
                    value={eventForm.exams}
                    onChange={(e) =>
                      setEventForm((f) => ({ ...f, exams: e.target.value }))
                    }
                    rows={3}
                  />
                </div>
              )}
              <div className="col-span-2 space-y-1.5">
                <Label>Observações complementares</Label>
                <Textarea
                  value={eventForm.notes}
                  onChange={(e) =>
                    setEventForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEvent} disabled={createEvent.isPending}>
              {createEvent.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
