"use client";
import { useEffect, useState, useCallback } from "react";
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
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import {
  clientsDb,
  petsDb,
  medicalEventsDb,
  usersDb,
  salesDb,
} from "@/mocks/db";
import type { Client, Pet, MedicalEvent, User, Sale } from "@/types";
import { useSessionStore } from "@/stores/session";
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  exportToCSV,
} from "@/lib/utils";
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

  const [client, setClient] = useState<Client | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [vets, setVets] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [petSales, setPetSales] = useState<Record<string, Sale[]>>({});

  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    type: "consultation" as MedicalEvent["type"],
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    vetId: "",
    weightKg: "",
    vaccineProtocol: "",
    vaccineNextDate: "",
    examResult: "",
    pathologies: "",
  });

  const { user: currentUser } = useSessionStore();
  const isAutonomous = currentUser?.accountType === "autonomous";

  const load = useCallback(async () => {
    setLoading(true);
    const [cl, pts, usrs, allSales] = await Promise.all([
      clientsDb.findById(id),
      petsDb.findWhere((p) => p.clientId === id),
      usersDb.findWhere((u) => u.role === "vet"),
      salesDb.findWhere((s) => s.clientId === id && s.status === "completed"),
    ]);
    setClient(cl ?? null);
    setPets(pts);
    setVets(usrs);
    if (pts.length > 0) setSelectedPet(pts[0]);
    // Group sales by petId
    const byPet: Record<string, Sale[]> = {};
    for (const sale of allSales) {
      if (sale.petId) {
        if (!byPet[sale.petId]) byPet[sale.petId] = [];
        byPet[sale.petId].push(sale);
      }
    }
    setPetSales(byPet);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selectedPet) return;
    medicalEventsDb
      .findWhere((e) => e.petId === selectedPet.id)
      .then((evts) =>
        setEvents(
          evts.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          ),
        ),
      );
  }, [selectedPet]);

  const handleMarkDeceased = async (pet: Pet) => {
    if (!confirm(`Marcar ${pet.name} como falecido?`)) return;
    await petsDb.update(pet.id, { status: "deceased" });
    toast({ title: `${pet.name} marcado como falecido` });
    load();
  };

  const handleSaveEvent = async () => {
    if (!selectedPet || !eventForm.title) {
      toast({ title: "Título é obrigatório", variant: "destructive" });
      return;
    }
    await medicalEventsDb.create({
      petId: selectedPet.id,
      type: eventForm.type,
      title: eventForm.title,
      description: eventForm.description || undefined,
      date: new Date(eventForm.date + "T12:00:00").toISOString(),
      vetId: eventForm.vetId || undefined,
      weightKg: eventForm.weightKg ? parseFloat(eventForm.weightKg) : undefined,
      vaccineProtocol: eventForm.vaccineProtocol || undefined,
      vaccineNextDate: eventForm.vaccineNextDate
        ? new Date(eventForm.vaccineNextDate + "T12:00:00").toISOString()
        : undefined,
      vaccineStatus: eventForm.vaccineProtocol ? "active" : undefined,
      examResult: eventForm.examResult || undefined,
      pathologies: eventForm.pathologies
        ? eventForm.pathologies.split(",").map((s) => s.trim())
        : undefined,
    });
    toast({ title: "Evento registrado" });
    setEventDialogOpen(false);
    if (selectedPet) {
      const evts = await medicalEventsDb.findWhere(
        (e) => e.petId === selectedPet.id,
      );
      setEvents(
        evts.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      );
    }
  };

  const handlePrintPrescription = (event: MedicalEvent) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Receita</title>
      <style>body{font-family:Arial;padding:30px;max-width:600px}h2{color:#333}hr{margin:20px 0}.item{margin:10px 0;padding:10px;border:1px solid #ddd;border-radius:4px}</style>
      </head><body>
      <h2>VetDom – Receituário Veterinário</h2>
      <p><b>Pet:</b> ${selectedPet?.name} | <b>Data:</b> ${formatDate(event.date)}</p>
      <hr/>
      ${
        event.prescriptionItems
          ?.map(
            (item, i) => `
        <div class="item">
          <b>${i + 1}. ${item.medication}</b><br/>
          Dose: ${item.dosage} | Frequência: ${item.frequency} | Duração: ${item.duration}
          ${item.notes ? `<br/>Obs: ${item.notes}` : ""}
        </div>
      `,
          )
          .join("") ?? ""
      }
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
        Tipo: eventTypeLabels[e.type],
        Título: e.title,
        Descrição: e.description ?? "",
        Peso: e.weightKg ?? "",
      })),
      `prontuario-${selectedPet?.name}`,
    );
  };

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
          <TabsTrigger value="prontuario" disabled={!selectedPet}>
            Prontuário
          </TabsTrigger>
          <TabsTrigger value="info">Dados do Cliente</TabsTrigger>
        </TabsList>

        {/* Pets tab */}
        <TabsContent value="pets" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Link href={`/clientes/${id}/pets/new`}>
              <Button size="sm">
                <Plus className="w-4 h-4" /> Novo Pet
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
                  className={`cursor-pointer transition-colors ${selectedPet?.id === pet.id ? "border-primary" : ""} ${pet.status === "deceased" ? "opacity-60" : ""}`}
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
                    {(() => {
                      const sales = petSales[pet.id] ?? [];
                      if (sales.length === 0) return null;
                      const allItems = sales.flatMap((s) => s.items);
                      const total = sales.reduce((sum, s) => sum + s.total, 0);
                      const preview = allItems.slice(0, 3);
                      const extra = allItems.length - preview.length;
                      return (
                        <div className="mt-2 pt-2 border-t border-blue-100 space-y-1">
                          <p className="text-xs font-medium text-blue-700 flex items-center justify-between">
                            <span>Vendas PDV</span>
                            <span className="font-semibold">
                              {formatCurrency(total)}
                            </span>
                          </p>
                          {preview.map((item, i) => (
                            <p
                              key={i}
                              className="text-xs text-muted-foreground truncate"
                            >
                              • {item.name}
                              {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                            </p>
                          ))}
                          {extra > 0 && (
                            <p className="text-xs text-muted-foreground">
                              + {extra} {extra === 1 ? "item" : "itens"}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Prontuário tab */}
        <TabsContent value="prontuario" className="space-y-4 mt-4">
          {selectedPet && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-medium">
                  Prontuário de{" "}
                  <span className="text-primary">{selectedPet.name}</span>
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="w-4 h-4" /> Exportar CSV
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEventForm({
                        type: "consultation",
                        title: "",
                        description: "",
                        date: new Date().toISOString().split("T")[0],
                        vetId: "",
                        weightKg: "",
                        vaccineProtocol: "",
                        vaccineNextDate: "",
                        examResult: "",
                        pathologies: "",
                      });
                      setEventDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4" /> Novo Evento
                  </Button>
                </div>
              </div>
              {events.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Nenhum evento registrado
                  </CardContent>
                </Card>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-4 pl-10">
                    {events.map((event) => {
                      const vet = vets.find((v) => v.id === event.vetId);
                      return (
                        <div key={event.id} className="relative">
                          <div
                            className={`absolute -left-6 top-3 w-3 h-3 rounded-full border-2 border-background ${eventTypeColors[event.type].split(" ")[0].replace("bg-", "bg-")}`}
                          />
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${eventTypeColors[event.type]}`}
                                    >
                                      {eventTypeLabels[event.type]}
                                    </span>
                                    <p className="font-medium">{event.title}</p>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDate(event.date)}{" "}
                                    {vet && `• ${vet.name}`}
                                  </p>
                                  {event.description && (
                                    <p className="text-sm mt-2">
                                      {event.description}
                                    </p>
                                  )}
                                  {event.weightKg && (
                                    <p className="text-sm mt-1">
                                      Peso: <strong>{event.weightKg} kg</strong>
                                    </p>
                                  )}
                                  {event.vaccineProtocol && (
                                    <p className="text-sm mt-1">
                                      Protocolo: {event.vaccineProtocol}
                                      {event.vaccineNextDate &&
                                        ` • Próxima: ${formatDate(event.vaccineNextDate)}`}
                                    </p>
                                  )}
                                  {event.examResult && (
                                    <p className="text-sm mt-1 bg-muted p-2 rounded">
                                      {event.examResult}
                                    </p>
                                  )}
                                  {event.pathologies &&
                                    event.pathologies.length > 0 && (
                                      <div className="flex gap-1 mt-1 flex-wrap">
                                        {event.pathologies.map((p) => (
                                          <Badge
                                            key={p}
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {p}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  {event.prescriptionItems &&
                                    event.prescriptionItems.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        {event.prescriptionItems.map(
                                          (item, i) => (
                                            <p
                                              key={i}
                                              className="text-xs bg-orange-50 text-orange-800 rounded px-2 py-1"
                                            >
                                              {item.medication} – {item.dosage}{" "}
                                              / {item.frequency} /{" "}
                                              {item.duration}
                                            </p>
                                          ),
                                        )}
                                      </div>
                                    )}
                                </div>
                                {event.type === "prescription" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handlePrintPrescription(event)
                                    }
                                    title="Imprimir receita"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Client info tab */}
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

      {/* Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Evento – {selectedPet?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select
                  value={eventForm.type}
                  onValueChange={(v) =>
                    setEventForm((f) => ({
                      ...f,
                      type: v as MedicalEvent["type"],
                    }))
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
                <Label>Título *</Label>
                <Input
                  value={eventForm.title}
                  onChange={(e) =>
                    setEventForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Veterinário</Label>
                <Select
                  value={eventForm.vetId}
                  onValueChange={(v) =>
                    setEventForm((f) => ({ ...f, vetId: v }))
                  }
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
              <div className="col-span-2 space-y-1.5">
                <Label>Descrição</Label>
                <Textarea
                  value={eventForm.description}
                  onChange={(e) =>
                    setEventForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={2}
                />
              </div>
              {eventForm.type === "weight" && (
                <div className="space-y-1.5">
                  <Label>Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={eventForm.weightKg}
                    onChange={(e) =>
                      setEventForm((f) => ({ ...f, weightKg: e.target.value }))
                    }
                  />
                </div>
              )}
              {eventForm.type === "vaccine" && (
                <>
                  <div className="space-y-1.5">
                    <Label>Protocolo</Label>
                    <Input
                      value={eventForm.vaccineProtocol}
                      onChange={(e) =>
                        setEventForm((f) => ({
                          ...f,
                          vaccineProtocol: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Próxima dose</Label>
                    <Input
                      type="date"
                      value={eventForm.vaccineNextDate}
                      onChange={(e) =>
                        setEventForm((f) => ({
                          ...f,
                          vaccineNextDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </>
              )}
              {eventForm.type === "exam" && (
                <div className="col-span-2 space-y-1.5">
                  <Label>Resultado</Label>
                  <Textarea
                    value={eventForm.examResult}
                    onChange={(e) =>
                      setEventForm((f) => ({
                        ...f,
                        examResult: e.target.value,
                      }))
                    }
                    rows={2}
                  />
                </div>
              )}
              {eventForm.type === "consultation" && (
                <div className="col-span-2 space-y-1.5">
                  <Label>Patologias (separadas por vírgula)</Label>
                  <Input
                    value={eventForm.pathologies}
                    onChange={(e) =>
                      setEventForm((f) => ({
                        ...f,
                        pathologies: e.target.value,
                      }))
                    }
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEvent}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
