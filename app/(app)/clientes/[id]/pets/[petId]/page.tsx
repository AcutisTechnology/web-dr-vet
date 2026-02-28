"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Save,
  Edit,
  Skull,
  Printer,
  Download,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  petsDb,
  clientsDb,
  medicalEventsDb,
  usersDb,
  financeEntriesDb,
} from "@/mocks/db";
import type {
  Pet,
  Client,
  MedicalEvent,
  User,
  PetAnamnesis,
  FinanceEntry,
} from "@/types";
import { useSessionStore } from "@/stores/session";
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  exportToCSV,
} from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const EMPTY_AN: PetAnamnesis = {
  vomiting: "",
  diarrhea: "",
  eating: "",
  drinking: "",
  urination: "",
  defecation: "",
  coughing: "",
  sneezing: "",
  dyspnea: "",
  nasalDischarge: "",
  ocularDischarge: "",
  pruritus: "",
  skinLesions: "",
  lameness: "",
  seizures: "",
  weightLoss: "",
  fatigue: "",
  complaintsNotes: "",
  environment: "",
  housingType: "",
  contactWithOtherAnimals: false,
  contactWithWildAnimals: false,
  walkFrequency: "",
  foodType: "",
  foodBrand: "",
  feedingsPerDay: undefined,
  waterSource: "",
  vaccinationUpToDate: false,
  vaccinationProtocol: "",
  dewormingUpToDate: false,
  dewormingLastDate: "",
  ectoparasiteControl: "",
  heartwormPrevention: false,
  previousDiseases: "",
  previousSurgeries: "",
  knownAllergies: "",
  bloodType: "",
  chronicConditions: "",
  currentMedications: "",
  reproductiveHistory: "",
  temperament: "",
  behaviorNotes: "",
  clinicalObservations: "",
  // Neurológico
  ataxia: "",
  tremors: "",
  mentalStatus: "",
  vestibularSigns: "",
  // Olhos
  eyeDischarge: "",
  eyeRedness: "",
  eyeOpacity: "",
  eyePain: "",
  // Ouvido
  earDischarge: "",
  earOdor: "",
  earScratch: "",
  earAffected: "",
};

const SIM_NAO = [
  { value: "nao", label: "Não" },
  { value: "ocasional", label: "Ocasional" },
  { value: "sim_agudo", label: "Sim (agudo)" },
  { value: "sim_cronico", label: "Sim (crônico)" },
];
const FREQ = [
  { value: "nao", label: "Não" },
  { value: "ocasional", label: "Ocasional" },
  { value: "frequente", label: "Frequente" },
  { value: "constante", label: "Constante" },
];
const INTENS = [
  { value: "nao", label: "Não" },
  { value: "leve", label: "Leve" },
  { value: "moderado", label: "Moderado" },
  { value: "intenso", label: "Intenso / Grave" },
];
const INGESTAO = [
  { value: "normal", label: "Normal" },
  { value: "aumentado", label: "Aumentado" },
  { value: "diminuido", label: "Diminuído" },
  { value: "ausente", label: "Ausente / Não faz" },
];
const SECRECAO = [
  { value: "nao", label: "Não" },
  { value: "seroso", label: "Seroso (claro)" },
  { value: "mucoso", label: "Mucoso" },
  { value: "purulento", label: "Purulento" },
  { value: "sanguinolento", label: "Sanguinolento" },
];
const MENTAL = [
  { value: "normal", label: "Normal / Alerta" },
  { value: "deprimido", label: "Deprimido" },
  { value: "estuporoso", label: "Estuporoso" },
  { value: "comatoso", label: "Comatoso" },
];
const SIM_NAO_SIMPLES = [
  { value: "nao", label: "Não" },
  { value: "sim", label: "Sim" },
];
const OUVIDO_SECRECAO = [
  { value: "nao", label: "Não" },
  { value: "seroso", label: "Seroso" },
  { value: "marrom", label: "Marrom / Cera excessiva" },
  { value: "purulento", label: "Purulento" },
  { value: "sanguinolento", label: "Sanguinolento" },
];
const OUVIDO_AFETADO = [
  { value: "nao", label: "Nenhum" },
  { value: "esquerdo", label: "Ouvido esquerdo" },
  { value: "direito", label: "Ouvido direito" },
  { value: "bilateral", label: "Bilateral" },
];
const OLHO_OPACIDADE = [
  { value: "nao", label: "Não" },
  { value: "sim_unilateral", label: "Sim (unilateral)" },
  { value: "sim_bilateral", label: "Sim (bilateral)" },
];

function SRow({
  label,
  opts,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  opts: { value: string; label: string }[];
  value: string | undefined;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  const display = opts.find((o) => o.value === value)?.label;
  if (readOnly) {
    if (!value) return null;
    return (
      <div className="flex items-center justify-between py-1.5 border-b last:border-0">
        <span className="text-sm text-muted-foreground flex-1">{label}</span>
        <span className="text-sm font-medium">{display}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b last:border-0">
      <span className="text-sm flex-1">{label}</span>
      <Select
        value={value || "__none__"}
        onValueChange={(v) => onChange(v === "__none__" ? "" : v)}
      >
        <SelectTrigger className="w-44 h-8 text-xs">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Não avaliado</SelectItem>
          {opts.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
const SP: Record<string, string> = {
  dog: "Cão",
  cat: "Gato",
  bird: "Ave",
  rabbit: "Coelho",
  reptile: "Réptil",
  other: "Outro",
};
const EVT_LBL: Record<string, string> = {
  consultation: "Consulta",
  vaccine: "Vacina",
  exam: "Exame",
  prescription: "Receita",
  observation: "Observação",
  weight: "Pesagem",
  surgery: "Cirurgia",
  return: "Retorno",
};
const EVT_CLR: Record<string, string> = {
  consultation: "bg-blue-100 text-blue-800",
  vaccine: "bg-green-100 text-green-800",
  exam: "bg-purple-100 text-purple-800",
  prescription: "bg-orange-100 text-orange-800",
  observation: "bg-gray-100 text-gray-800",
  weight: "bg-cyan-100 text-cyan-800",
  surgery: "bg-red-100 text-red-800",
  return: "bg-yellow-100 text-yellow-800",
};

function IR({ l, v }: { l: string; v?: string | number | null }) {
  if (!v && v !== 0) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{l}</p>
      <p className="text-sm font-medium">{String(v)}</p>
    </div>
  );
}
function BB({ l, v }: { l: string; v?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {v ? (
        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
      )}
      <span className={v ? "font-medium" : "text-muted-foreground"}>{l}</span>
    </div>
  );
}

export default function PetDetailPage() {
  const { id: clientId, petId } = useParams<{ id: string; petId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useSessionStore();
  const isAutonomous = currentUser?.accountType === "autonomous";
  const [pet, setPet] = useState<Pet | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [vets, setVets] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [petFinanceEntries, setPetFinanceEntries] = useState<FinanceEntry[]>(
    [],
  );
  const [financeDialogOpen, setFinanceDialogOpen] = useState(false);
  const [financeForm, setFinanceForm] = useState({
    petFinanceType: "consultation" as
      | "consultation"
      | "medication"
      | "material"
      | "fuel"
      | "exam",
    description: "",
    amount: "",
    examCharge: "", // valor cobrado do cliente pelo exame
    examLab: "", // valor pago ao laboratório
    medCharge: "", // valor cobrado do cliente pela medicação
    medCost: "", // custo do medicamento
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "pix" as FinanceEntry["paymentMethod"],
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    species: "dog" as Pet["species"],
    breed: "",
    sex: "male" as Pet["sex"],
    birthDate: "",
    color: "",
    neutered: false,
    weight: "",
    microchip: "",
    notes: "",
  });
  const [an, setAn] = useState<PetAnamnesis>({ ...EMPTY_AN });
  const [rx, setRx] = useState({
    vetName: "",
    vetCrmv: "",
    clinicName: "DrVet",
    clinicAddress: "",
    clinicPhone: "",
    date: new Date().toISOString().split("T")[0],
    items: [
      {
        medication: "",
        dosage: "",
        quantity: "",
        route: "",
        notes: "",
      },
    ],
    rxNotes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [p, cl, usrs] = await Promise.all([
      petsDb.findById(petId),
      clientsDb.findById(clientId),
      usersDb.findWhere((u) => u.role === "vet" || u.role === "admin"),
    ]);
    if (!p) {
      router.push(`/clientes/${clientId}`);
      return;
    }
    setPet(p);
    setClient(cl ?? null);
    setVets(usrs);
    setForm({
      name: p.name,
      species: p.species,
      breed: p.breed,
      sex: p.sex,
      birthDate: p.birthDate ?? "",
      color: p.color ?? "",
      neutered: p.neutered,
      weight: p.weight ? String(p.weight) : "",
      microchip: p.microchip ?? "",
      notes: p.notes ?? "",
    });
    setAn({ ...EMPTY_AN, ...(p.anamnesis ?? {}) });
    const evts = await medicalEventsDb.findWhere((e) => e.petId === p.id);
    setEvents(
      evts.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    );
    const fins = await financeEntriesDb.findWhere((e) => e.petId === p.id);
    setPetFinanceEntries(
      fins.sort(
        (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
      ),
    );
    setLoading(false);
    setDirty(false);
  }, [petId, clientId, router]);

  const PET_FINANCE_INCOME_TYPES = [
    "consultation",
    "exam_charge",
    "medication_charge",
  ];
  const PET_FINANCE_LABELS: Record<string, string> = {
    consultation: "Consulta",
    medication: "Medicação",
    medication_charge: "Medicação (cobrado)",
    medication_cost: "Medicação (custo)",
    material: "Material",
    fuel: "Combustível",
    exam_charge: "Exame (cobrado)",
    exam_lab: "Exame (laboratório)",
  };
  const petFinanceSummary = {
    revenue: petFinanceEntries
      .filter(
        (e) =>
          !e.fromSale &&
          PET_FINANCE_INCOME_TYPES.includes(e.petFinanceType ?? ""),
      )
      .reduce((s, e) => s + e.amount, 0),
    cost: petFinanceEntries
      .filter(
        (e) =>
          !e.fromSale &&
          !PET_FINANCE_INCOME_TYPES.includes(e.petFinanceType ?? "") &&
          !!e.petId,
      )
      .reduce((s, e) => s + e.amount, 0),
    pdvRevenue: petFinanceEntries
      .filter((e) => e.fromSale)
      .reduce((s, e) => s + e.amount, 0),
  };
  const refreshFinance = async (petId: string) => {
    const updated = await financeEntriesDb.findWhere((e) => e.petId === petId);
    setPetFinanceEntries(
      updated.sort(
        (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
      ),
    );
  };
  const handleSavePetFinance = async () => {
    if (!pet) return;
    const dueDate = new Date(financeForm.date + "T12:00:00").toISOString();

    if (financeForm.petFinanceType === "exam") {
      const charge = parseFloat(financeForm.examCharge);
      const lab = parseFloat(financeForm.examLab);
      if (!financeForm.examCharge && !financeForm.examLab) {
        toast({
          title: "Informe ao menos um valor para o exame",
          variant: "destructive",
        });
        return;
      }
      const desc = financeForm.description || `Exame – ${pet.name}`;
      if (financeForm.examCharge && charge > 0) {
        await financeEntriesDb.create({
          type: "income",
          description: `${desc} (cobrado do cliente)`,
          amount: charge,
          dueDate,
          status: "paid",
          paidDate: dueDate,
          categoryId: "fc1",
          paymentMethod: financeForm.paymentMethod,
          petId: pet.id,
          petFinanceType: "exam_charge",
          recurring: false,
        });
      }
      if (financeForm.examLab && lab > 0) {
        await financeEntriesDb.create({
          type: "expense",
          description: `${desc} (laboratório)`,
          amount: lab,
          dueDate,
          status: "paid",
          paidDate: dueDate,
          categoryId: "fc7",
          paymentMethod: financeForm.paymentMethod,
          petId: pet.id,
          petFinanceType: "exam_lab",
          recurring: false,
        });
      }
    } else if (financeForm.petFinanceType === "medication") {
      const charge = parseFloat(financeForm.medCharge);
      const cost = parseFloat(financeForm.medCost);
      if (!financeForm.medCharge && !financeForm.medCost) {
        toast({
          title: "Informe ao menos um valor para a medicação",
          variant: "destructive",
        });
        return;
      }
      const desc = financeForm.description || `Medicação – ${pet.name}`;
      if (financeForm.medCharge && charge > 0) {
        await financeEntriesDb.create({
          type: "income",
          description: `${desc} (cobrado do cliente)`,
          amount: charge,
          dueDate,
          status: "paid",
          paidDate: dueDate,
          categoryId: "fc1",
          paymentMethod: financeForm.paymentMethod,
          petId: pet.id,
          petFinanceType: "medication_charge",
          recurring: false,
        });
      }
      if (financeForm.medCost && cost > 0) {
        await financeEntriesDb.create({
          type: "expense",
          description: `${desc} (custo)`,
          amount: cost,
          dueDate,
          status: "paid",
          paidDate: dueDate,
          categoryId: "fc7",
          paymentMethod: financeForm.paymentMethod,
          petId: pet.id,
          petFinanceType: "medication_cost",
          recurring: false,
        });
      }
    } else {
      if (!financeForm.description || !financeForm.amount) {
        toast({
          title: "Descrição e valor são obrigatórios",
          variant: "destructive",
        });
        return;
      }
      const isIncome = PET_FINANCE_INCOME_TYPES.includes(
        financeForm.petFinanceType,
      );
      await financeEntriesDb.create({
        type: isIncome ? "income" : "expense",
        description: financeForm.description,
        amount: parseFloat(financeForm.amount),
        dueDate,
        status: "paid",
        paidDate: dueDate,
        categoryId: isIncome ? "fc1" : "fc7",
        paymentMethod: financeForm.paymentMethod,
        petId: pet.id,
        petFinanceType: financeForm.petFinanceType as
          | "consultation"
          | "material"
          | "fuel",
        recurring: false,
      });
    }

    toast({ title: "Registro financeiro salvo" });
    setFinanceDialogOpen(false);
    refreshFinance(pet.id);
  };

  useEffect(() => {
    load();
  }, [load]);
  const sf = (field: keyof typeof form, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }));
    setDirty(true);
  };
  const sa = (
    field: keyof PetAnamnesis,
    value: string | boolean | number | undefined,
  ) => {
    setAn((a) => ({ ...a, [field]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!pet || !form.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    await petsDb.update(pet.id, {
      name: form.name.trim(),
      species: form.species,
      breed: form.breed,
      sex: form.sex,
      birthDate: form.birthDate || undefined,
      color: form.color || undefined,
      neutered: form.neutered,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      microchip: form.microchip || undefined,
      notes: form.notes || undefined,
      anamnesis: {
        ...an,
        dewormingLastDate: an.dewormingLastDate || undefined,
        feedingsPerDay: an.feedingsPerDay || undefined,
      },
    });
    toast({ title: "Pet atualizado com sucesso!" });
    setSaving(false);
    setDirty(false);
    setEditMode(false);
    load();
  };
  const handleMarkDeceased = async () => {
    if (!pet || !confirm(`Marcar ${pet.name} como falecido?`)) return;
    await petsDb.update(pet.id, { status: "deceased" });
    toast({ title: `${pet.name} marcado como falecido` });
    load();
  };
  const handleExportCSV = () => {
    exportToCSV(
      events.map((e) => ({
        Data: formatDate(e.date),
        Tipo: EVT_LBL[e.type],
        Título: e.title,
        Descrição: e.description ?? "",
        Peso: e.weightKg ?? "",
      })),
      `prontuario-${pet?.name ?? "pet"}`,
    );
  };
  const handlePrintPrescription = (event: MedicalEvent) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(
      `<html><head><title>Receita</title><style>body{font-family:Arial;padding:30px;max-width:600px}.item{margin:10px 0;padding:10px;border:1px solid #ddd;border-radius:4px}</style></head><body><h2>VetDom – Receituário</h2><p><b>Pet:</b>${pet?.name}|<b>Tutor:</b>${client?.name}|<b>Data:</b>${formatDate(event.date)}</p><hr/>${event.prescriptionItems?.map((item, i) => `<div class="item"><b>${i + 1}. ${item.medication}</b><br/>Dose:${item.dosage}|Freq:${item.frequency}|Dur:${item.duration}${item.notes ? `<br/>Obs:${item.notes}` : ""}</div>`).join("") ?? ""}<hr/><p style="font-size:12px;color:#666">Impresso em ${new Date().toLocaleString("pt-BR")}</p></body></html>`,
    );
    win.print();
  };
  const handlePrintAnamnesis = () => {
    if (!pet || !client) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const b = (v?: boolean) => (v ? "Sim" : "Não");
    const OPTS: Record<string, { value: string; label: string }[]> = {
      vomiting: [
        { value: "nao", label: "Não" },
        { value: "ocasional", label: "Ocasional" },
        { value: "sim_agudo", label: "Sim (agudo)" },
        { value: "sim_cronico", label: "Sim (crônico)" },
      ],
      diarrhea: [
        { value: "nao", label: "Não" },
        { value: "ocasional", label: "Ocasional" },
        { value: "sim_agudo", label: "Sim (agudo)" },
        { value: "sim_cronico", label: "Sim (crônico)" },
      ],
      eating: [
        { value: "normal", label: "Normal" },
        { value: "aumentado", label: "Aumentado" },
        { value: "diminuido", label: "Diminuído" },
        { value: "ausente", label: "Ausente" },
      ],
      drinking: [
        { value: "normal", label: "Normal" },
        { value: "aumentado", label: "Aumentado" },
        { value: "diminuido", label: "Diminuído" },
        { value: "ausente", label: "Ausente" },
      ],
      urination: [
        { value: "normal", label: "Normal" },
        { value: "aumentado", label: "Aumentada" },
        { value: "diminuido", label: "Diminuída" },
        { value: "ausente", label: "Ausente" },
        { value: "doloroso", label: "Com esforço/dor" },
        { value: "hematuria", label: "Com sangue" },
      ],
      defecation: [
        { value: "normal", label: "Normal" },
        { value: "aumentado", label: "Aumentado" },
        { value: "diminuido", label: "Diminuído" },
        { value: "ausente", label: "Ausente" },
      ],
      coughing: [
        { value: "nao", label: "Não" },
        { value: "ocasional", label: "Ocasional" },
        { value: "frequente", label: "Frequente" },
        { value: "constante", label: "Constante" },
      ],
      sneezing: [
        { value: "nao", label: "Não" },
        { value: "ocasional", label: "Ocasional" },
        { value: "frequente", label: "Frequente" },
        { value: "constante", label: "Constante" },
      ],
      dyspnea: [
        { value: "nao", label: "Não" },
        { value: "leve", label: "Leve" },
        { value: "moderado", label: "Moderado" },
        { value: "intenso", label: "Grave" },
      ],
      nasalDischarge: [
        { value: "nao", label: "Não" },
        { value: "seroso", label: "Seroso" },
        { value: "mucoso", label: "Mucoso" },
        { value: "purulento", label: "Purulento" },
        { value: "sanguinolento", label: "Sanguinolento" },
      ],
      ocularDischarge: [
        { value: "nao", label: "Não" },
        { value: "seroso", label: "Seroso" },
        { value: "mucoso", label: "Mucoso" },
        { value: "purulento", label: "Purulento" },
        { value: "sanguinolento", label: "Sanguinolento" },
      ],
      pruritus: [
        { value: "nao", label: "Não" },
        { value: "leve", label: "Leve" },
        { value: "moderado", label: "Moderado" },
        { value: "intenso", label: "Intenso" },
      ],
      skinLesions: [
        { value: "nao", label: "Não" },
        { value: "sim_localizado", label: "Sim (localizado)" },
        { value: "sim_generalizado", label: "Sim (generalizado)" },
      ],
      lameness: [
        { value: "nao", label: "Não" },
        { value: "leve", label: "Leve" },
        { value: "moderado", label: "Moderado" },
        { value: "intenso", label: "Grave" },
      ],
      seizures: [
        { value: "nao", label: "Não" },
        { value: "historico", label: "Histórico anterior" },
        { value: "recente", label: "Episódio recente" },
      ],
      weightLoss: [
        { value: "nao", label: "Não" },
        { value: "leve", label: "Leve" },
        { value: "moderado", label: "Moderado" },
        { value: "intenso", label: "Grave" },
      ],
      fatigue: [
        { value: "nao", label: "Não" },
        { value: "leve", label: "Leve" },
        { value: "moderado", label: "Moderado" },
        { value: "intenso", label: "Grave" },
      ],
      ataxia: [
        { value: "nao", label: "Não" },
        { value: "leve", label: "Leve" },
        { value: "moderado", label: "Moderado" },
        { value: "intenso", label: "Grave" },
      ],
      tremors: [
        { value: "nao", label: "Não" },
        { value: "ocasional", label: "Ocasional" },
        { value: "frequente", label: "Frequente" },
        { value: "constante", label: "Constante" },
      ],
      mentalStatus: [
        { value: "normal", label: "Normal / Alerta" },
        { value: "deprimido", label: "Deprimido" },
        { value: "estuporoso", label: "Estuporoso" },
        { value: "comatoso", label: "Comatoso" },
      ],
      vestibularSigns: [
        { value: "nao", label: "Não" },
        { value: "sim", label: "Sim" },
      ],
      eyeDischarge: [
        { value: "nao", label: "Não" },
        { value: "seroso", label: "Seroso" },
        { value: "mucoso", label: "Mucoso" },
        { value: "purulento", label: "Purulento" },
        { value: "sanguinolento", label: "Sanguinolento" },
      ],
      eyeRedness: [
        { value: "nao", label: "Não" },
        { value: "leve", label: "Leve" },
        { value: "moderado", label: "Moderado" },
        { value: "intenso", label: "Intenso" },
      ],
      eyeOpacity: [
        { value: "nao", label: "Não" },
        { value: "sim_unilateral", label: "Sim (unilateral)" },
        { value: "sim_bilateral", label: "Sim (bilateral)" },
      ],
      eyePain: [
        { value: "nao", label: "Não" },
        { value: "sim", label: "Sim" },
      ],
      earDischarge: [
        { value: "nao", label: "Não" },
        { value: "seroso", label: "Seroso" },
        { value: "marrom", label: "Marrom / Cera" },
        { value: "purulento", label: "Purulento" },
        { value: "sanguinolento", label: "Sanguinolento" },
      ],
      earOdor: [
        { value: "nao", label: "Não" },
        { value: "leve", label: "Leve" },
        { value: "intenso", label: "Intenso" },
      ],
      earScratch: [
        { value: "nao", label: "Não" },
        { value: "ocasional", label: "Ocasional" },
        { value: "frequente", label: "Frequente" },
        { value: "constante", label: "Constante" },
      ],
      earAffected: [
        { value: "nao", label: "Nenhum" },
        { value: "esquerdo", label: "Ouvido esquerdo" },
        { value: "direito", label: "Ouvido direito" },
        { value: "bilateral", label: "Bilateral" },
      ],
    };
    const lbl = (field: string, val?: string) =>
      val ? (OPTS[field]?.find((o) => o.value === val)?.label ?? val) : null;
    const r = (label: string, val?: string | number | null) =>
      val
        ? `<tr><td class="l">${label}</td><td class="v">${val}</td></tr>`
        : "";
    const rl = (label: string, field: string, val?: string) => {
      const d = lbl(field, val);
      return d
        ? `<tr><td class="l">${label}</td><td class="v">${d}</td></tr>`
        : "";
    };
    const rb = (label: string, val?: boolean) =>
      `<tr><td class="l">${label}</td><td class="v">${b(val)}</td></tr>`;
    const css = `body{font-family:Arial,sans-serif;padding:28px;font-size:12px;color:#111}
h1{font-size:17px;margin:0 0 3px}p.sub{font-size:11px;color:#555;margin:0 0 14px}
h2{font-size:11px;font-weight:700;background:#eef2ff;padding:3px 8px;margin:14px 0 5px;border-left:3px solid #4f46e5;text-transform:uppercase;letter-spacing:.04em}
table{width:100%;border-collapse:collapse}td{padding:2px 5px;vertical-align:top}
td.l{width:46%;color:#666;font-size:11px}td.v{font-weight:600;font-size:12px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:0 20px}
.note{background:#f8fafc;border:1px solid #e2e8f0;border-radius:3px;padding:6px 8px;font-size:11px;white-space:pre-wrap;margin-top:4px}
.foot{font-size:10px;color:#aaa;margin-top:20px;border-top:1px solid #eee;padding-top:6px}
@media print{body{padding:12px}}`;
    const hasQ = !!(
      an.vomiting ||
      an.diarrhea ||
      an.eating ||
      an.drinking ||
      an.urination ||
      an.defecation ||
      an.coughing ||
      an.sneezing ||
      an.dyspnea ||
      an.nasalDischarge ||
      an.ocularDischarge ||
      an.pruritus ||
      an.skinLesions ||
      an.lameness ||
      an.seizures ||
      an.weightLoss ||
      an.fatigue ||
      an.complaintsNotes
    );
    const hasAmb = !!(
      an.environment ||
      an.housingType ||
      an.walkFrequency ||
      an.foodType
    );
    const hasPrev = !!(
      an.vaccinationProtocol ||
      an.ectoparasiteControl ||
      an.dewormingLastDate ||
      an.vaccinationUpToDate ||
      an.dewormingUpToDate
    );
    const hasHist = !!(
      an.previousDiseases ||
      an.previousSurgeries ||
      an.knownAllergies ||
      an.chronicConditions ||
      an.currentMedications ||
      an.bloodType ||
      an.reproductiveHistory
    );
    const hasNeuro = !!(
      an.mentalStatus ||
      an.ataxia ||
      an.tremors ||
      an.vestibularSigns ||
      an.eyeDischarge ||
      an.eyeRedness ||
      an.eyeOpacity ||
      an.eyePain ||
      an.earAffected ||
      an.earDischarge ||
      an.earOdor ||
      an.earScratch
    );
    const hasComp = !!(
      an.temperament ||
      an.behaviorNotes ||
      an.clinicalObservations
    );
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Anamnese – ${pet.name}</title><style>${css}</style></head><body>
<h1>DrVet – Ficha de Anamnese</h1>
<p class="sub"><b>Pet:</b> ${pet.name} &nbsp;|&nbsp; <b>Espécie:</b> ${SP[pet.species]} &nbsp;|&nbsp; <b>Raça:</b> ${pet.breed || "–"} &nbsp;|&nbsp; <b>Tutor:</b> ${client.name} &nbsp;|&nbsp; <b>Data:</b> ${formatDate(new Date().toISOString())}</p>
<h2>Identificação</h2><div class="two"><div><table>
${r("Sexo", pet.sex === "male" ? "Macho" : "Fêmea")}
${rb("Castrado(a)", pet.neutered)}
${r("Peso", pet.weight ? pet.weight + " kg" : null)}
${r("Nascimento", pet.birthDate ? formatDate(pet.birthDate) : null)}
${r("Microchip", pet.microchip)}
${r("Cor / Pelagem", pet.color)}
</table></div><div><table>${r("Observações gerais", pet.notes)}</table></div></div>
${
  hasQ
    ? `<h2>Queixa Atual e Sinais Clínicos</h2><div class="two"><div><table>
${rl("Vômito", "vomiting", an.vomiting)}${rl("Diarreia", "diarrhea", an.diarrhea)}
${rl("Apetite (comendo?)", "eating", an.eating)}${rl("Ingestão de água", "drinking", an.drinking)}
${rl("Urina", "urination", an.urination)}${rl("Fezes", "defecation", an.defecation)}
${rl("Perda de peso", "weightLoss", an.weightLoss)}${rl("Cansaço / Letargia", "fatigue", an.fatigue)}
</table></div><div><table>
${rl("Tosse", "coughing", an.coughing)}${rl("Espirro", "sneezing", an.sneezing)}
${rl("Dif. respiratória", "dyspnea", an.dyspnea)}${rl("Secreção nasal", "nasalDischarge", an.nasalDischarge)}
${rl("Secreção ocular", "ocularDischarge", an.ocularDischarge)}${rl("Coceira / Prurido", "pruritus", an.pruritus)}
${rl("Lesões de pele", "skinLesions", an.skinLesions)}${rl("Claudicação", "lameness", an.lameness)}
${rl("Convulsão", "seizures", an.seizures)}
</table></div></div>${an.complaintsNotes ? `<p style="font-size:10px;color:#555;margin:4px 0 2px">Observações complementares:</p><div class="note">${an.complaintsNotes}</div>` : ""}`
    : ""
}
${
  hasAmb
    ? `<h2>Rotina e Alimentação</h2><div class="two"><div><table>
${r("Ambiente", an.environment)}${r("Tipo de moradia", an.housingType)}
${r("Passeios", an.walkFrequency)}${rb("Outros animais domésticos", an.contactWithOtherAnimals)}
${rb("Animais silvestres", an.contactWithWildAnimals)}
</table></div><div><table>
${r("Alimentação", an.foodType)}${r("Marca / Produto", an.foodBrand)}
${r("Refeições/dia", an.feedingsPerDay)}${r("Fonte de água", an.waterSource)}
</table></div></div>`
    : ""
}
${
  hasPrev
    ? `<h2>Preventivos</h2><table>
${rb("Vacinação em dia", an.vaccinationUpToDate)}${r("Protocolo vacinal", an.vaccinationProtocol)}
${rb("Vermifugação em dia", an.dewormingUpToDate)}${r("Última vermifugação", an.dewormingLastDate)}
${r("Controle de ectoparasitas", an.ectoparasiteControl)}${rb("Prevenção heartworm", an.heartwormPrevention)}
</table>`
    : ""
}
${
  hasHist
    ? `<h2>Histórico Médico</h2><table>
${r("Doenças anteriores", an.previousDiseases)}${r("Cirurgias", an.previousSurgeries)}
${r("Alergias", an.knownAllergies)}${r("Condições crônicas", an.chronicConditions)}
${r("Medicações em uso", an.currentMedications)}${r("Tipo sanguíneo", an.bloodType)}
${r("Histórico reprodutivo", an.reproductiveHistory)}
</table>`
    : ""
}
${
  hasNeuro
    ? `<h2>Neurológico / Olhos / Ouvido</h2><div class="two"><div><table>
${rl("Estado mental", "mentalStatus", an.mentalStatus)}${rl("Ataxia", "ataxia", an.ataxia)}
${rl("Tremores", "tremors", an.tremors)}${rl("Sinais vestibulares", "vestibularSigns", an.vestibularSigns)}
</table></div><div><table>
${rl("Secreção ocular", "eyeDischarge", an.eyeDischarge)}${rl("Vermelhidão ocular", "eyeRedness", an.eyeRedness)}
${rl("Opacidade ocular", "eyeOpacity", an.eyeOpacity)}${rl("Dor ocular", "eyePain", an.eyePain)}
${rl("Ouvido afetado", "earAffected", an.earAffected)}${rl("Secreção auricular", "earDischarge", an.earDischarge)}
${rl("Odor auricular", "earOdor", an.earOdor)}${rl("Coçar/chacoalhar", "earScratch", an.earScratch)}
</table></div></div>`
    : ""
}
${
  hasComp
    ? `<h2>Comportamento e Observações</h2><table>
${r("Temperamento", an.temperament)}${r("Comportamento", an.behaviorNotes)}
${r("Observações clínicas", an.clinicalObservations)}
</table>`
    : ""
}
<p class="foot">Impresso em ${new Date().toLocaleString("pt-BR")} &nbsp;•&nbsp; DrVet – Sistema de Gestão Veterinária</p>
</body></html>`;
    win.document.write(html);
    win.document.close();
    win.print();
  };

  const handlePrintRx = () => {
    if (!pet || !client) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const rxCss = `
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Arial',sans-serif;font-size:13px;color:#1a1a1a;background:#fff}
      .page{max-width:720px;margin:0 auto;padding:32px 40px}
      .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:3px solid #4f46e5;margin-bottom:20px}
      .logo{font-size:22px;font-weight:800;color:#4f46e5;letter-spacing:-.5px}.logo span{color:#2563eb}
      .clinic-info{text-align:right;font-size:11px;color:#555;line-height:1.6}
      .patient{background:#f5f3ff;border:1px solid #ddd6fe;border-radius:6px;padding:10px 14px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
      .patient .field .lbl{font-size:9px;text-transform:uppercase;color:#7c3aed;font-weight:700;letter-spacing:.06em}.patient .field .val{font-size:12px;font-weight:600}
      h2{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#4f46e5;font-weight:700;margin-bottom:10px;padding-bottom:4px;border-bottom:1px solid #e0e7ff}
      .item{display:grid;grid-template-columns:24px 1fr;gap:0 10px;margin-bottom:14px;page-break-inside:avoid}
      .item-num{width:24px;height:24px;background:#4f46e5;color:#fff;border-radius:50%;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:2px}
      .item-body .med{font-size:14px;font-weight:700;color:#1e1b4b}
      .item-body .details{font-size:11px;color:#555;margin-top:3px;line-height:1.7}
      .item-body .item-notes{font-size:11px;color:#7c3aed;font-style:italic;margin-top:2px}
      .obs{background:#fafafa;border:1px solid #e5e7eb;border-radius:4px;padding:8px 12px;font-size:11px;color:#444;margin-top:12px;white-space:pre-wrap}
      .footer{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:20px}
      .sig-box{border-top:1px solid #444;padding-top:6px;text-align:center;font-size:11px;color:#555}
      .disclaimer{font-size:9px;color:#aaa;text-align:center;margin-top:20px;border-top:1px solid #eee;padding-top:8px}
      @media print{.page{padding:16px 20px}}
    `;
    const itemsHtml = rx.items
      .filter((it) => it.medication.trim())
      .map(
        (it, i) => `
      <div class="item">
        <div class="item-num">${i + 1}</div>
        <div class="item-body">
          <div class="med">${it.medication}</div>
          <div class="details">${[it.dosage && `<b>Dose:</b> ${it.dosage}`, it.quantity && `<b>Quantidade:</b> ${it.quantity}`, it.route && `<b>Via:</b> ${it.route}`].filter(Boolean).join(" &nbsp;|&nbsp; ")}</div>
          ${it.notes ? `<div class="item-notes">↳ ${it.notes}</div>` : ""}
        </div>
      </div>`,
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Receituário – ${pet.name}</title><style>${rxCss}</style></head>
<body><div class="page">
<div class="header">
  <div>
    <div class="logo">Dr<span>Vet</span></div>
    <div style="font-size:10px;color:#666;margin-top:2px">Sistema de Gestão Veterinária</div>
  </div>
  <div class="clinic-info">
    ${rx.clinicName ? `<b>${rx.clinicName}</b><br/>` : ""}
    ${rx.clinicAddress ? `${rx.clinicAddress}<br/>` : ""}
    ${rx.clinicPhone ? `Tel: ${rx.clinicPhone}<br/>` : ""}
    Data: ${formatDate(rx.date || new Date().toISOString())}
  </div>
</div>
<div class="patient">
  <div class="field"><div class="lbl">Paciente</div><div class="val">${pet.name}</div></div>
  <div class="field"><div class="lbl">Espécie / Raça</div><div class="val">${SP[pet.species]} – ${pet.breed || "–"}</div></div>
  <div class="field"><div class="lbl">Tutor</div><div class="val">${client.name}</div></div>
  ${pet.weight ? `<div class="field"><div class="lbl">Peso</div><div class="val">${pet.weight} kg</div></div>` : ""}
  ${pet.color ? `<div class="field"><div class="lbl">Cor / Pelagem</div><div class="val">${pet.color}</div></div>` : ""}
</div>
<h2>Prescrição Médica Veterinária</h2>
${itemsHtml || "<p style='color:#aaa;font-size:12px'>Nenhum item prescrito.</p>"}
${rx.rxNotes ? `<div class="obs"><b>Observações:</b><br/>${rx.rxNotes}</div>` : ""}
<div class="footer">
  <div class="sig-box">
    ${rx.vetName || "Médico(a) Veterinário(a)"}<br/>
    ${rx.vetCrmv ? `CRMV: ${rx.vetCrmv}` : "CRMV: ___________________"}
  </div>
  <div class="sig-box">
    Assinatura<br/>&nbsp;
  </div>
</div>
<div class="disclaimer">Este receituário é válido por 30 dias a partir da data de emissão. DrVet – Sistema de Gestão Veterinária</div>
</div></body></html>`;
    win.document.write(html);
    win.document.close();
    win.print();
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  if (!pet) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/clientes/${clientId}`}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{pet.name}</h1>
              {pet.status === "deceased" && (
                <Badge variant="destructive">Óbito</Badge>
              )}
              {dirty && <Badge variant="secondary">Não salvo</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {SP[pet.species]} • {pet.breed} • Tutor: {client?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handlePrintAnamnesis}>
            <Printer className="w-4 h-4 mr-1" />
            Imprimir Anamnese
          </Button>
          {!editMode ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(true)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditMode(false);
                  load();
                }}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </>
          )}
          {pet.status === "active" && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleMarkDeceased}
            >
              <Skull className="w-4 h-4 mr-1" />
              Óbito
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="dados" className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-56 shrink-0">
          <div className="sticky top-4 space-y-1">
            <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 gap-1">
              <TabsTrigger
                value="dados"
                className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Identificação
              </TabsTrigger>
              <TabsTrigger
                value="queixas"
                className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Queixa Atual
              </TabsTrigger>
              <TabsTrigger
                value="historico"
                className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Histórico Médico
              </TabsTrigger>
              <TabsTrigger
                value="ambiente"
                className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Rotina e Alimentação
              </TabsTrigger>
              <TabsTrigger
                value="preventivos"
                className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Preventivos
              </TabsTrigger>
              <TabsTrigger
                value="obs"
                className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Comportamento
              </TabsTrigger>
              <TabsTrigger
                value="receituario"
                className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Receituário
              </TabsTrigger>
              <TabsTrigger
                value="prontuario"
                className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Prontuário ({events.length})
              </TabsTrigger>
              <TabsTrigger
                value="financeiro"
                className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Financeiro
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* DADOS BÁSICOS */}
          <TabsContent value="dados">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Identificação</CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <Label>Nome *</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => sf("name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Espécie</Label>
                      <Select
                        value={form.species}
                        onValueChange={(v) => sf("species", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dog">Cão</SelectItem>
                          <SelectItem value="cat">Gato</SelectItem>
                          <SelectItem value="bird">Ave</SelectItem>
                          <SelectItem value="rabbit">Coelho</SelectItem>
                          <SelectItem value="reptile">Réptil</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Raça</Label>
                      <Input
                        value={form.breed}
                        onChange={(e) => sf("breed", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Sexo</Label>
                      <Select
                        value={form.sex}
                        onValueChange={(v) => sf("sex", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Macho</SelectItem>
                          <SelectItem value="female">Fêmea</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nascimento</Label>
                      <Input
                        type="date"
                        value={form.birthDate}
                        onChange={(e) => sf("birthDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Cor / Pelagem</Label>
                      <Input
                        value={form.color}
                        onChange={(e) => sf("color", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Peso (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={form.weight}
                        onChange={(e) => sf("weight", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Microchip</Label>
                      <Input
                        value={form.microchip}
                        onChange={(e) => sf("microchip", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 flex items-center gap-3">
                      <Switch
                        checked={form.neutered}
                        onCheckedChange={(v) => sf("neutered", v)}
                        id="neu"
                      />
                      <Label htmlFor="neu">Castrado(a)</Label>
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label>Observações gerais</Label>
                      <Textarea
                        value={form.notes}
                        onChange={(e) => sf("notes", e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <IR l="Nome" v={pet.name} />
                    <IR l="Espécie" v={SP[pet.species]} />
                    <IR l="Raça" v={pet.breed} />
                    <IR l="Sexo" v={pet.sex === "male" ? "Macho" : "Fêmea"} />
                    <IR
                      l="Nascimento"
                      v={pet.birthDate ? formatDate(pet.birthDate) : null}
                    />
                    <IR l="Cor / Pelagem" v={pet.color} />
                    <IR l="Peso" v={pet.weight ? `${pet.weight} kg` : null} />
                    <IR l="Microchip" v={pet.microchip} />
                    <div className="col-span-2 sm:col-span-3">
                      <BB l="Castrado(a)" v={pet.neutered} />
                    </div>
                    {pet.notes && (
                      <div className="col-span-2 sm:col-span-3 space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          Observações
                        </p>
                        <p className="text-sm bg-amber-50 text-amber-800 rounded px-3 py-2">
                          {pet.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* QUEIXA ATUAL */}
          <TabsContent value="queixas">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Queixa Atual e Sinais Clínicos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                      Digestivo / Sistêmico
                    </p>
                    <SRow
                      label="Vômito"
                      opts={SIM_NAO}
                      value={an.vomiting}
                      onChange={(v) => sa("vomiting", v)}
                      readOnly={!editMode}
                    />
                    <SRow
                      label="Diarreia"
                      opts={SIM_NAO}
                      value={an.diarrhea}
                      onChange={(v) => sa("diarrhea", v)}
                      readOnly={!editMode}
                    />
                    <SRow
                      label="Apetite (está comendo?)"
                      opts={INGESTAO}
                      value={an.eating}
                      onChange={(v) => sa("eating", v)}
                      readOnly={!editMode}
                    />
                    <SRow
                      label="Ingestão de água"
                      opts={INGESTAO}
                      value={an.drinking}
                      onChange={(v) => sa("drinking", v)}
                      readOnly={!editMode}
                    />
                    <SRow
                      label="Urina (frequência/aspecto)"
                      opts={[
                        { value: "normal", label: "Normal" },
                        { value: "aumentado", label: "Aumentada" },
                        { value: "diminuido", label: "Diminuída" },
                        { value: "ausente", label: "Ausente" },
                        { value: "doloroso", label: "Com esforço/dor" },
                        { value: "hematuria", label: "Com sangue" },
                      ]}
                      value={an.urination}
                      onChange={(v) => sa("urination", v)}
                      readOnly={!editMode}
                    />
                    <SRow
                      label="Fezes (está defecando?)"
                      opts={INGESTAO}
                      value={an.defecation}
                      onChange={(v) => sa("defecation", v)}
                      readOnly={!editMode}
                    />
                    <SRow
                      label="Perda de peso"
                      opts={INTENS}
                      value={an.weightLoss}
                      onChange={(v) => sa("weightLoss", v)}
                      readOnly={!editMode}
                    />
                    <SRow
                      label="Cansaço / Letargia"
                      opts={INTENS}
                      value={an.fatigue}
                      onChange={(v) => sa("fatigue", v)}
                      readOnly={!editMode}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                      Respiratório / Pele / Neuro
                    </p>
                    <SRow
                      label="Tosse"
                      opts={FREQ}
                      value={an.coughing}
                      onChange={(v) => sa("coughing", v)}
                      readOnly={!editMode}
                    />
                    <SRow
                      label="Espirro"
                      opts={FREQ}
                      value={an.sneezing}
                      onChange={(v) => sa("sneezing", v)}
                      readOnly={!editMode}
                    />
                    <SRow
                      label="Dificuldade respiratória"
                      opts={INTENS}
                      value={an.dyspnea}
                      onChange={(v) => sa("dyspnea", v)}
                      readOnly={!editMode}
                    />
                    <SRow
                      label="Secreção nasal"
                      opts={SECRECAO}
                      value={an.nasalDischarge}
                      onChange={(v) => sa("nasalDischarge", v)}
                      readOnly={!editMode}
                    />
                    <SRow
                      label="Secreção ocular"
                      opts={SECRECAO}
                      value={an.ocularDischarge}
                      onChange={(v) => sa("ocularDischarge", v)}
                      readOnly={!editMode}
                    />
                    <SRow
                      label="Coceira / Prurido"
                      opts={INTENS}
                      value={an.pruritus}
                      onChange={(v) => sa("pruritus", v)}
                      readOnly={!editMode}
                    />
                    <SRow
                      label="Lesões de pele"
                      opts={[
                        { value: "nao", label: "Não" },
                        { value: "sim_localizado", label: "Sim (localizado)" },
                        {
                          value: "sim_generalizado",
                          label: "Sim (generalizado)",
                        },
                      ]}
                      value={an.skinLesions}
                      onChange={(v) => sa("skinLesions", v)}
                      readOnly={!editMode}
                    />
                    <SRow
                      label="Claudicação / Manqueira"
                      opts={INTENS}
                      value={an.lameness}
                      onChange={(v) => sa("lameness", v)}
                      readOnly={!editMode}
                    />
                    <SRow
                      label="Convulsão / Crise epiléptica"
                      opts={[
                        { value: "nao", label: "Não" },
                        { value: "historico", label: "Histórico anterior" },
                        { value: "recente", label: "Episódio recente" },
                      ]}
                      value={an.seizures}
                      onChange={(v) => sa("seizures", v)}
                      readOnly={!editMode}
                    />
                  </div>
                </div>
                {(editMode || an.complaintsNotes) && (
                  <div className="mt-4 space-y-1.5">
                    <p className="text-xs text-muted-foreground">
                      Observações complementares
                    </p>
                    {editMode ? (
                      <Textarea
                        value={an.complaintsNotes ?? ""}
                        onChange={(e) => sa("complaintsNotes", e.target.value)}
                        rows={3}
                        placeholder="Início dos sintomas, evolução, situações que pioram ou melhoram..."
                      />
                    ) : (
                      <p className="text-sm bg-muted rounded px-3 py-2 whitespace-pre-wrap">
                        {an.complaintsNotes}
                      </p>
                    )}
                  </div>
                )}
                {!editMode &&
                  !an.vomiting &&
                  !an.diarrhea &&
                  !an.eating &&
                  !an.drinking &&
                  !an.coughing &&
                  !an.fatigue &&
                  !an.complaintsNotes && (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Nenhuma queixa registrada. Clique em{" "}
                      <strong>Editar</strong> para preencher.
                    </p>
                  )}
              </CardContent>
            </Card>

            {/* Neuro / Olhos / Ouvido */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Card className="md:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Sistema Neurológico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SRow
                    label="Estado mental"
                    opts={MENTAL}
                    value={an.mentalStatus}
                    onChange={(v) => sa("mentalStatus", v)}
                    readOnly={!editMode}
                  />
                  <SRow
                    label="Ataxia / Incoordenação"
                    opts={INTENS}
                    value={an.ataxia}
                    onChange={(v) => sa("ataxia", v)}
                    readOnly={!editMode}
                  />
                  <SRow
                    label="Tremores"
                    opts={FREQ}
                    value={an.tremors}
                    onChange={(v) => sa("tremors", v)}
                    readOnly={!editMode}
                  />
                  <SRow
                    label="Sinais vestibulares"
                    opts={SIM_NAO_SIMPLES}
                    value={an.vestibularSigns}
                    onChange={(v) => sa("vestibularSigns", v)}
                    readOnly={!editMode}
                  />
                  <SRow
                    label="Convulsão"
                    opts={[
                      { value: "nao", label: "Não" },
                      { value: "historico", label: "Histórico anterior" },
                      { value: "recente", label: "Episódio recente" },
                    ]}
                    value={an.seizures}
                    onChange={(v) => sa("seizures", v)}
                    readOnly={!editMode}
                  />
                  {!editMode &&
                    !an.mentalStatus &&
                    !an.ataxia &&
                    !an.tremors &&
                    !an.vestibularSigns &&
                    !an.seizures && (
                      <p className="text-xs text-muted-foreground py-3 text-center">
                        Não avaliado
                      </p>
                    )}
                </CardContent>
              </Card>
              <Card className="md:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Olhos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SRow
                    label="Secreção ocular"
                    opts={SECRECAO}
                    value={an.eyeDischarge}
                    onChange={(v) => sa("eyeDischarge", v)}
                    readOnly={!editMode}
                  />
                  <SRow
                    label="Vermelhidão / Hiperemia"
                    opts={INTENS}
                    value={an.eyeRedness}
                    onChange={(v) => sa("eyeRedness", v)}
                    readOnly={!editMode}
                  />
                  <SRow
                    label="Opacidade / Catarata"
                    opts={OLHO_OPACIDADE}
                    value={an.eyeOpacity}
                    onChange={(v) => sa("eyeOpacity", v)}
                    readOnly={!editMode}
                  />
                  <SRow
                    label="Dor ocular / Blefaroespasmo"
                    opts={SIM_NAO_SIMPLES}
                    value={an.eyePain}
                    onChange={(v) => sa("eyePain", v)}
                    readOnly={!editMode}
                  />
                  {!editMode &&
                    !an.eyeDischarge &&
                    !an.eyeRedness &&
                    !an.eyeOpacity &&
                    !an.eyePain && (
                      <p className="text-xs text-muted-foreground py-3 text-center">
                        Não avaliado
                      </p>
                    )}
                </CardContent>
              </Card>
              <Card className="md:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Ouvido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SRow
                    label="Ouvido afetado"
                    opts={OUVIDO_AFETADO}
                    value={an.earAffected}
                    onChange={(v) => sa("earAffected", v)}
                    readOnly={!editMode}
                  />
                  <SRow
                    label="Secreção auricular"
                    opts={OUVIDO_SECRECAO}
                    value={an.earDischarge}
                    onChange={(v) => sa("earDischarge", v)}
                    readOnly={!editMode}
                  />
                  <SRow
                    label="Odor auricular"
                    opts={[
                      { value: "nao", label: "Não" },
                      { value: "leve", label: "Leve" },
                      { value: "intenso", label: "Intenso" },
                    ]}
                    value={an.earOdor}
                    onChange={(v) => sa("earOdor", v)}
                    readOnly={!editMode}
                  />
                  <SRow
                    label="Coçar / Chacoalhar cabeça"
                    opts={FREQ}
                    value={an.earScratch}
                    onChange={(v) => sa("earScratch", v)}
                    readOnly={!editMode}
                  />
                  {!editMode &&
                    !an.earAffected &&
                    !an.earDischarge &&
                    !an.earOdor &&
                    !an.earScratch && (
                      <p className="text-xs text-muted-foreground py-3 text-center">
                        Não avaliado
                      </p>
                    )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AMBIENTE E ALIMENTAÇÃO */}
          <TabsContent value="ambiente">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ambiente e Rotina</CardTitle>
                </CardHeader>
                <CardContent>
                  {editMode ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Ambiente</Label>
                        <Select
                          value={an.environment || "__none__"}
                          onValueChange={(v) =>
                            sa("environment", v === "__none__" ? "" : v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">
                              Não informado
                            </SelectItem>
                            <SelectItem value="domiciliar">
                              Domiciliar (interior)
                            </SelectItem>
                            <SelectItem value="quintal">
                              Quintal / Área externa
                            </SelectItem>
                            <SelectItem value="misto">Misto</SelectItem>
                            <SelectItem value="rural">
                              Rural / Fazenda
                            </SelectItem>
                            <SelectItem value="canil">Canil / Gatil</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Tipo de moradia</Label>
                        <Select
                          value={an.housingType || "__none__"}
                          onValueChange={(v) =>
                            sa("housingType", v === "__none__" ? "" : v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">
                              Não informado
                            </SelectItem>
                            <SelectItem value="apartamento">
                              Apartamento
                            </SelectItem>
                            <SelectItem value="casa_quintal">
                              Casa com quintal
                            </SelectItem>
                            <SelectItem value="casa_sem_quintal">
                              Casa sem quintal
                            </SelectItem>
                            <SelectItem value="sitio">
                              Sítio / Chácara
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Frequência de passeios</Label>
                        <Input
                          value={an.walkFrequency ?? ""}
                          onChange={(e) => sa("walkFrequency", e.target.value)}
                          placeholder="Ex: 2x ao dia..."
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={!!an.contactWithOtherAnimals}
                            onCheckedChange={(v) =>
                              sa("contactWithOtherAnimals", v)
                            }
                            id="oa"
                          />
                          <Label htmlFor="oa">
                            Contato com outros animais domésticos
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={!!an.contactWithWildAnimals}
                            onCheckedChange={(v) =>
                              sa("contactWithWildAnimals", v)
                            }
                            id="wa"
                          />
                          <Label htmlFor="wa">
                            Contato com animais silvestres
                          </Label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <IR l="Ambiente" v={an.environment} />
                      <IR l="Moradia" v={an.housingType} />
                      <IR l="Passeios" v={an.walkFrequency} />
                      <BB
                        l="Contato com outros animais"
                        v={!!an.contactWithOtherAnimals}
                      />
                      <BB
                        l="Contato com silvestres"
                        v={!!an.contactWithWildAnimals}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Alimentação</CardTitle>
                </CardHeader>
                <CardContent>
                  {editMode ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Tipo de alimentação</Label>
                        <Select
                          value={an.foodType || "__none__"}
                          onValueChange={(v) =>
                            sa("foodType", v === "__none__" ? "" : v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">
                              Não informado
                            </SelectItem>
                            <SelectItem value="racao_seca">
                              Ração seca
                            </SelectItem>
                            <SelectItem value="racao_umida">
                              Ração úmida
                            </SelectItem>
                            <SelectItem value="natural">
                              Alimentação natural (BARF)
                            </SelectItem>
                            <SelectItem value="misto">Misto</SelectItem>
                            <SelectItem value="caseira">
                              Comida caseira
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Marca / Produto</Label>
                        <Input
                          value={an.foodBrand ?? ""}
                          onChange={(e) => sa("foodBrand", e.target.value)}
                          placeholder="Ex: Royal Canin..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Refeições por dia</Label>
                        <Input
                          type="number"
                          min="1"
                          value={an.feedingsPerDay ?? ""}
                          onChange={(e) =>
                            sa(
                              "feedingsPerDay",
                              e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Fonte de água</Label>
                        <Select
                          value={an.waterSource || "__none__"}
                          onValueChange={(v) =>
                            sa("waterSource", v === "__none__" ? "" : v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">
                              Não informado
                            </SelectItem>
                            <SelectItem value="filtrada">Filtrada</SelectItem>
                            <SelectItem value="torneira">Torneira</SelectItem>
                            <SelectItem value="mineral">Mineral</SelectItem>
                            <SelectItem value="fonte">
                              Bebedouro automático
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <IR l="Tipo" v={an.foodType} />
                      <IR l="Marca" v={an.foodBrand} />
                      <IR l="Refeições/dia" v={an.feedingsPerDay} />
                      <IR l="Fonte de água" v={an.waterSource} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* PREVENTIVOS */}
          <TabsContent value="preventivos">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Preventivos e Profilaxia
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={!!an.vaccinationUpToDate}
                          onCheckedChange={(v) => sa("vaccinationUpToDate", v)}
                          id="vac"
                        />
                        <Label htmlFor="vac">Vacinação em dia</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={!!an.dewormingUpToDate}
                          onCheckedChange={(v) => sa("dewormingUpToDate", v)}
                          id="dew"
                        />
                        <Label htmlFor="dew">Vermifugação em dia</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={!!an.heartwormPrevention}
                          onCheckedChange={(v) => sa("heartwormPrevention", v)}
                          id="hw"
                        />
                        <Label htmlFor="hw">
                          Prevenção de filária / heartworm
                        </Label>
                      </div>
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label>Protocolo vacinal</Label>
                      <Textarea
                        value={an.vaccinationProtocol ?? ""}
                        onChange={(e) =>
                          sa("vaccinationProtocol", e.target.value)
                        }
                        rows={2}
                        placeholder="Ex: V10, Anti-rábica, Leishmaniose – datas de aplicação..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Última vermifugação</Label>
                      <Input
                        type="date"
                        value={an.dewormingLastDate ?? ""}
                        onChange={(e) =>
                          sa("dewormingLastDate", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Controle de ectoparasitas</Label>
                      <Input
                        value={an.ectoparasiteControl ?? ""}
                        onChange={(e) =>
                          sa("ectoparasiteControl", e.target.value)
                        }
                        placeholder="Ex: Bravecto, coleira Seresto, Frontline..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <BB l="Vacinação em dia" v={!!an.vaccinationUpToDate} />
                    <BB l="Vermifugação em dia" v={!!an.dewormingUpToDate} />
                    <BB l="Prevenção de filária" v={!!an.heartwormPrevention} />
                    {an.vaccinationProtocol && (
                      <div className="col-span-2 sm:col-span-3 space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          Protocolo vacinal
                        </p>
                        <p className="text-sm">{an.vaccinationProtocol}</p>
                      </div>
                    )}
                    <IR
                      l="Última vermifugação"
                      v={
                        an.dewormingLastDate
                          ? formatDate(an.dewormingLastDate)
                          : null
                      }
                    />
                    <IR l="Ectoparasitas" v={an.ectoparasiteControl} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* HISTÓRICO MÉDICO */}
          <TabsContent value="historico">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Histórico Médico</CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <Label>Doenças pré-existentes / anteriores</Label>
                      <Textarea
                        value={an.previousDiseases ?? ""}
                        onChange={(e) => sa("previousDiseases", e.target.value)}
                        rows={3}
                        placeholder="Liste doenças diagnosticadas anteriormente..."
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label>Cirurgias realizadas</Label>
                      <Textarea
                        value={an.previousSurgeries ?? ""}
                        onChange={(e) =>
                          sa("previousSurgeries", e.target.value)
                        }
                        rows={2}
                        placeholder="Ex: castração (2022), exérese de nódulo..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Alergias conhecidas</Label>
                      <Textarea
                        value={an.knownAllergies ?? ""}
                        onChange={(e) => sa("knownAllergies", e.target.value)}
                        rows={2}
                        placeholder="Alimentos, medicamentos, ambiente..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Condições crônicas</Label>
                      <Textarea
                        value={an.chronicConditions ?? ""}
                        onChange={(e) =>
                          sa("chronicConditions", e.target.value)
                        }
                        rows={2}
                        placeholder="Ex: diabetes, epilepsia, hipotireoidismo..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Medicações em uso contínuo</Label>
                      <Textarea
                        value={an.currentMedications ?? ""}
                        onChange={(e) =>
                          sa("currentMedications", e.target.value)
                        }
                        rows={2}
                        placeholder="Medicamentos de uso contínuo atual..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tipo sanguíneo</Label>
                      <Input
                        value={an.bloodType ?? ""}
                        onChange={(e) => sa("bloodType", e.target.value)}
                        placeholder="Ex: DEA 1.1 positivo"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label>Histórico reprodutivo</Label>
                      <Textarea
                        value={an.reproductiveHistory ?? ""}
                        onChange={(e) =>
                          sa("reproductiveHistory", e.target.value)
                        }
                        rows={2}
                        placeholder="Ciclos de cio, gestações, partos, pseudociese..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <IR l="Tipo sanguíneo" v={an.bloodType} />
                    </div>
                    {an.previousDiseases && (
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          Doenças anteriores
                        </p>
                        <p className="text-sm bg-muted rounded px-3 py-2 whitespace-pre-wrap">
                          {an.previousDiseases}
                        </p>
                      </div>
                    )}
                    {an.previousSurgeries && (
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          Cirurgias realizadas
                        </p>
                        <p className="text-sm bg-muted rounded px-3 py-2 whitespace-pre-wrap">
                          {an.previousSurgeries}
                        </p>
                      </div>
                    )}
                    {an.knownAllergies && (
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          Alergias conhecidas
                        </p>
                        <p className="text-sm bg-red-50 text-red-800 rounded px-3 py-2 whitespace-pre-wrap">
                          {an.knownAllergies}
                        </p>
                      </div>
                    )}
                    {an.chronicConditions && (
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          Condições crônicas
                        </p>
                        <p className="text-sm bg-orange-50 text-orange-800 rounded px-3 py-2 whitespace-pre-wrap">
                          {an.chronicConditions}
                        </p>
                      </div>
                    )}
                    {an.currentMedications && (
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          Medicações em uso contínuo
                        </p>
                        <p className="text-sm bg-blue-50 text-blue-800 rounded px-3 py-2 whitespace-pre-wrap">
                          {an.currentMedications}
                        </p>
                      </div>
                    )}
                    {an.reproductiveHistory && (
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          Histórico reprodutivo
                        </p>
                        <p className="text-sm bg-muted rounded px-3 py-2 whitespace-pre-wrap">
                          {an.reproductiveHistory}
                        </p>
                      </div>
                    )}
                    {!an.previousDiseases &&
                      !an.previousSurgeries &&
                      !an.knownAllergies &&
                      !an.chronicConditions &&
                      !an.currentMedications &&
                      !an.bloodType &&
                      !an.reproductiveHistory && (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          Nenhum histórico médico registrado. Clique em{" "}
                          <strong>Editar</strong> para adicionar.
                        </p>
                      )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* RECEITUÁRIO */}
          <TabsContent value="receituario">
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm font-medium">
                  Receituário de{" "}
                  <span className="text-primary font-semibold">{pet.name}</span>
                </p>
                <Button size="sm" onClick={handlePrintRx}>
                  <Printer className="w-4 h-4 mr-1" />
                  Imprimir Receita
                </Button>
              </div>
              {/* Cabeçalho da clínica */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Dados da Clínica / Veterinário
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>Clínica</Label>
                      <Input
                        value={rx.clinicName}
                        onChange={(e) =>
                          setRx((r) => ({ ...r, clinicName: e.target.value }))
                        }
                        placeholder="DrVet"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Endereço</Label>
                      <Input
                        value={rx.clinicAddress}
                        onChange={(e) =>
                          setRx((r) => ({
                            ...r,
                            clinicAddress: e.target.value,
                          }))
                        }
                        placeholder="Rua, nº, cidade..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Telefone</Label>
                      <Input
                        value={rx.clinicPhone}
                        onChange={(e) =>
                          setRx((r) => ({ ...r, clinicPhone: e.target.value }))
                        }
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Médico(a) Veterinário(a)</Label>
                      <Input
                        value={rx.vetName}
                        onChange={(e) =>
                          setRx((r) => ({ ...r, vetName: e.target.value }))
                        }
                        placeholder="Dr(a). Nome Sobrenome"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>CRMV</Label>
                      <Input
                        value={rx.vetCrmv}
                        onChange={(e) =>
                          setRx((r) => ({ ...r, vetCrmv: e.target.value }))
                        }
                        placeholder="CRMV-SP 12345"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Data da prescrição</Label>
                      <Input
                        type="date"
                        value={rx.date}
                        onChange={(e) =>
                          setRx((r) => ({ ...r, date: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Itens da receita */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Itens Prescritos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rx.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-2 md:grid-cols-6 gap-3 p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="col-span-2 md:col-span-2 space-y-1">
                        <Label className="text-xs">Medicamento *</Label>
                        <Input
                          value={item.medication}
                          onChange={(e) =>
                            setRx((r) => {
                              const items = [...r.items];
                              items[idx] = {
                                ...items[idx],
                                medication: e.target.value,
                              };
                              return { ...r, items };
                            })
                          }
                          placeholder="Nome do medicamento"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Dose</Label>
                        <Input
                          value={item.dosage}
                          onChange={(e) =>
                            setRx((r) => {
                              const items = [...r.items];
                              items[idx] = {
                                ...items[idx],
                                dosage: e.target.value,
                              };
                              return { ...r, items };
                            })
                          }
                          placeholder="Ex: 5mg/kg"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Quantidade</Label>
                        <Input
                          value={item.quantity}
                          onChange={(e) =>
                            setRx((r) => {
                              const items = [...r.items];
                              items[idx] = {
                                ...items[idx],
                                quantity: e.target.value,
                              };
                              return { ...r, items };
                            })
                          }
                          placeholder="Ex: 30 comprimidos"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Via de Administração</Label>
                        <Select
                          value={item.route}
                          onValueChange={(value) =>
                            setRx((r) => {
                              const items = [...r.items];
                              items[idx] = {
                                ...items[idx],
                                route: value,
                              };
                              return { ...r, items };
                            })
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Selecionar via..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Nenhum">
                              <span className="flex items-center gap-2">
                                <span className="text-gray-400">—</span>
                                Nenhum
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso oral">
                              <span className="flex items-center gap-2">
                                <span className="text-blue-600">💊</span>
                                Uso oral
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso tópico">
                              <span className="flex items-center gap-2">
                                <span className="text-green-600">🧴</span>
                                Uso tópico
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso otológico">
                              <span className="flex items-center gap-2">
                                <span className="text-purple-600">👂</span>
                                Uso otológico
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso oftálmico">
                              <span className="flex items-center gap-2">
                                <span className="text-cyan-600">👁️</span>
                                Uso oftálmico
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso intranasal">
                              <span className="flex items-center gap-2">
                                <span className="text-pink-600">👃</span>
                                Uso intranasal
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso inalatório">
                              <span className="flex items-center gap-2">
                                <span className="text-indigo-600">💨</span>
                                Uso inalatório
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso subcutâneo">
                              <span className="flex items-center gap-2">
                                <span className="text-orange-600">💉</span>
                                Uso subcutâneo (SC)
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso intramuscular">
                              <span className="flex items-center gap-2">
                                <span className="text-red-600">💉</span>
                                Uso intramuscular (IM)
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso intravenoso">
                              <span className="flex items-center gap-2">
                                <span className="text-rose-600">💉</span>
                                Uso intravenoso (IV)
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso retal">
                              <span className="flex items-center gap-2">
                                <span className="text-amber-600">🔸</span>
                                Uso retal
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso intravaginal">
                              <span className="flex items-center gap-2">
                                <span className="text-fuchsia-600">🔹</span>
                                Uso intravaginal
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 md:col-span-4 space-y-1">
                        <Label className="text-xs">Obs. deste item</Label>
                        <Input
                          value={item.notes}
                          onChange={(e) =>
                            setRx((r) => {
                              const items = [...r.items];
                              items[idx] = {
                                ...items[idx],
                                notes: e.target.value,
                              };
                              return { ...r, items };
                            })
                          }
                          placeholder="Instruções adicionais ao tutor..."
                        />
                      </div>
                      {rx.items.length > 1 && (
                        <div className="md:col-span-1 flex items-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive w-full"
                            onClick={() =>
                              setRx((r) => ({
                                ...r,
                                items: r.items.filter((_, i) => i !== idx),
                              }))
                            }
                          >
                            Remover
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRx((r) => ({
                        ...r,
                        items: [
                          ...r.items,
                          {
                            medication: "",
                            dosage: "",
                            quantity: "",
                            route: "",
                            notes: "",
                          },
                        ],
                      }))
                    }
                  >
                    + Adicionar medicamento
                  </Button>
                </CardContent>
              </Card>
              {/* Observações gerais */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Observações Gerais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={rx.rxNotes}
                    onChange={(e) =>
                      setRx((r) => ({ ...r, rxNotes: e.target.value }))
                    }
                    rows={3}
                    placeholder="Cuidados em casa, retorno previsto, orientações ao tutor..."
                  />
                </CardContent>
              </Card>
              {/* Preview */}
              {rx.items.some((it) => it.medication.trim()) && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-primary">
                      Preview da Receita
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border-b-2 border-primary pb-3 mb-3 flex justify-between items-start">
                      <div>
                        <p className="text-xl font-extrabold text-primary">
                          DrVet
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sistema de Gestão Veterinária
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {rx.clinicName && (
                          <p className="font-semibold">{rx.clinicName}</p>
                        )}
                        {rx.clinicAddress && <p>{rx.clinicAddress}</p>}
                        {rx.clinicPhone && <p>Tel: {rx.clinicPhone}</p>}
                        <p>
                          Data:{" "}
                          {rx.date
                            ? formatDate(rx.date)
                            : formatDate(new Date().toISOString())}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 bg-primary/10 rounded-lg p-3 mb-4 text-xs">
                      <div>
                        <p className="text-muted-foreground uppercase tracking-wider text-[9px] font-bold">
                          Paciente
                        </p>
                        <p className="font-semibold">{pet.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase tracking-wider text-[9px] font-bold">
                          Espécie / Raça
                        </p>
                        <p className="font-semibold">
                          {SP[pet.species]} – {pet.breed || "–"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase tracking-wider text-[9px] font-bold">
                          Tutor
                        </p>
                        <p className="font-semibold">{client?.name}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3 border-b border-primary/20 pb-1">
                      Prescrição Médica Veterinária
                    </p>
                    <div className="space-y-3">
                      {rx.items
                        .filter((it) => it.medication.trim())
                        .map((it, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            <div>
                              <p className="font-bold text-sm">
                                {it.medication}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {[
                                  it.dosage && `Dose: ${it.dosage}`,
                                  it.quantity && `Quantidade: ${it.quantity}`,
                                  it.route && `Via: ${it.route}`,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                              {it.notes && (
                                <p className="text-xs text-primary/70 italic mt-0.5">
                                  ↳ {it.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                    {rx.rxNotes && (
                      <div className="mt-3 text-xs bg-muted rounded p-2 whitespace-pre-wrap">
                        <b>Observações:</b> {rx.rxNotes}
                      </div>
                    )}
                    <div className="mt-6 grid grid-cols-2 gap-6 text-xs text-center text-muted-foreground">
                      <div className="border-t border-gray-400 pt-1">
                        {rx.vetName || "Médico(a) Veterinário(a)"}
                        <br />
                        {rx.vetCrmv
                          ? `CRMV: ${rx.vetCrmv}`
                          : "CRMV: _______________"}
                      </div>
                      <div className="border-t border-gray-400 pt-1">
                        Assinatura
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* COMPORTAMENTO E OBSERVAÇÕES */}
          <TabsContent value="obs">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Comportamento e Observações Clínicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Temperamento</Label>
                      <Select
                        value={an.temperament || "__none__"}
                        onValueChange={(v) =>
                          sa("temperament", v === "__none__" ? "" : v)
                        }
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            Não informado
                          </SelectItem>
                          <SelectItem value="docil">Dócil / Calmo</SelectItem>
                          <SelectItem value="agitado">
                            Agitado / Hiperativo
                          </SelectItem>
                          <SelectItem value="agressivo">Agressivo</SelectItem>
                          <SelectItem value="medroso">
                            Medroso / Ansioso
                          </SelectItem>
                          <SelectItem value="brincalhao">Brincalhão</SelectItem>
                          <SelectItem value="independente">
                            Independente
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Notas de comportamento</Label>
                      <Textarea
                        value={an.behaviorNotes ?? ""}
                        onChange={(e) => sa("behaviorNotes", e.target.value)}
                        rows={3}
                        placeholder="Comportamentos específicos, medos, reações ao veterinário..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Observações clínicas gerais</Label>
                      <Textarea
                        value={an.clinicalObservations ?? ""}
                        onChange={(e) =>
                          sa("clinicalObservations", e.target.value)
                        }
                        rows={4}
                        placeholder="Observações relevantes para o atendimento clínico..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {an.temperament && (
                      <IR l="Temperamento" v={an.temperament} />
                    )}
                    {an.behaviorNotes && (
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          Notas de comportamento
                        </p>
                        <p className="text-sm bg-muted rounded px-3 py-2 whitespace-pre-wrap">
                          {an.behaviorNotes}
                        </p>
                      </div>
                    )}
                    {an.clinicalObservations && (
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          Observações clínicas gerais
                        </p>
                        <p className="text-sm bg-yellow-50 text-yellow-900 rounded px-3 py-2 whitespace-pre-wrap">
                          {an.clinicalObservations}
                        </p>
                      </div>
                    )}
                    {!an.temperament &&
                      !an.behaviorNotes &&
                      !an.clinicalObservations && (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          Nenhuma observação registrada. Clique em{" "}
                          <strong>Editar</strong> para adicionar.
                        </p>
                      )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* PRONTUÁRIO */}
          <TabsContent value="prontuario">
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-medium text-sm">
                  Histórico clínico de{" "}
                  <span className="text-primary font-semibold">{pet.name}</span>
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="w-4 h-4 mr-1" />
                    Exportar CSV
                  </Button>
                </div>
              </div>
              {events.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Nenhum evento registrado no prontuário
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
                            className={`absolute -left-6 top-3 w-3 h-3 rounded-full border-2 border-background ${EVT_CLR[event.type].split(" ")[0]}`}
                          />
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${EVT_CLR[event.type]}`}
                                    >
                                      {EVT_LBL[event.type]}
                                    </span>
                                    <p className="font-medium">{event.title}</p>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDate(event.date)}
                                    {vet && ` • ${vet.name}`}
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
            </div>
          </TabsContent>

          {/* FINANCEIRO */}
          <TabsContent value="financeiro" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="font-medium text-sm">
                Registros financeiros deste atendimento
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setFinanceForm({
                    petFinanceType: "consultation",
                    description: `Consulta – ${pet?.name}`,
                    amount: "",
                    examCharge: "",
                    examLab: "",
                    medCharge: "",
                    medCost: "",
                    date: new Date().toISOString().split("T")[0],
                    paymentMethod: "pix",
                  });
                  setFinanceDialogOpen(true);
                }}
              >
                <Save className="w-4 h-4 mr-1" /> Novo Registro
              </Button>
            </div>

            {/* Summary */}
            <div
              className={`grid grid-cols-1 gap-3 ${petFinanceSummary.pdvRevenue > 0 ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}
            >
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">
                    Receita (Consultas)
                  </p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(petFinanceSummary.revenue)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">
                    Custos{isAutonomous ? " (incl. combustível)" : ""}
                  </p>
                  <p className="text-xl font-bold text-red-500">
                    {formatCurrency(petFinanceSummary.cost)}
                  </p>
                </CardContent>
              </Card>
              {petFinanceSummary.pdvRevenue > 0 && (
                <Card className="border-blue-200 bg-blue-50/40">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">
                      Receita PDV (Produtos/Serviços)
                    </p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(petFinanceSummary.pdvRevenue)}
                    </p>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Lucro Líquido</p>
                  <p
                    className={`text-xl font-bold ${
                      petFinanceSummary.revenue +
                        petFinanceSummary.pdvRevenue -
                        petFinanceSummary.cost >=
                      0
                        ? "text-[#1B2A6B]"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(
                      petFinanceSummary.revenue +
                        petFinanceSummary.pdvRevenue -
                        petFinanceSummary.cost,
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Manual entries (editable) */}
            {(() => {
              const manualEntries = petFinanceEntries.filter(
                (e) => !e.fromSale,
              );
              const saleEntries = petFinanceEntries.filter((e) => e.fromSale);
              return (
                <>
                  {manualEntries.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground text-sm">
                        Nenhum registro financeiro manual. Clique em &quot;Novo
                        Registro&quot; para começar.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left px-4 py-2 font-medium">
                              Data
                            </th>
                            <th className="text-left px-4 py-2 font-medium">
                              Tipo
                            </th>
                            <th className="text-left px-4 py-2 font-medium">
                              Descrição
                            </th>
                            <th className="text-right px-4 py-2 font-medium">
                              Valor
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {manualEntries.map((entry) => {
                            const isIncome = entry.type === "income";
                            return (
                              <tr
                                key={entry.id}
                                className="border-b last:border-0 hover:bg-muted/30"
                              >
                                <td className="px-4 py-2 text-muted-foreground">
                                  {formatDate(entry.dueDate)}
                                </td>
                                <td className="px-4 py-2">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                      isIncome
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {PET_FINANCE_LABELS[
                                      entry.petFinanceType ?? ""
                                    ] ?? entry.petFinanceType}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  {entry.description}
                                </td>
                                <td
                                  className={`px-4 py-2 text-right font-semibold ${isIncome ? "text-green-600" : "text-red-500"}`}
                                >
                                  {isIncome ? "+" : "-"}
                                  {formatCurrency(entry.amount)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* PDV sale entries (read-only) */}
                  {saleEntries.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
                        Vendas PDV (somente leitura)
                      </p>
                      <div className="rounded-lg border border-blue-100 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-blue-50/60">
                              <th className="text-left px-4 py-2 font-medium">
                                Data
                              </th>
                              <th className="text-left px-4 py-2 font-medium">
                                Item
                              </th>
                              <th className="text-right px-4 py-2 font-medium">
                                Valor
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {saleEntries.map((entry) => (
                              <tr
                                key={entry.id}
                                className="border-b last:border-0 hover:bg-blue-50/40"
                              >
                                <td className="px-4 py-2 text-muted-foreground">
                                  {formatDate(entry.dueDate)}
                                </td>
                                <td className="px-4 py-2">
                                  {entry.description}
                                </td>
                                <td className="px-4 py-2 text-right font-semibold text-green-600">
                                  +{formatCurrency(entry.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Finance dialog */}
            <Dialog
              open={financeDialogOpen}
              onOpenChange={setFinanceDialogOpen}
            >
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    Novo Registro Financeiro – {pet?.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Tipo</Label>
                      <Select
                        value={financeForm.petFinanceType}
                        onValueChange={(v) =>
                          setFinanceForm((f) => ({
                            ...f,
                            petFinanceType:
                              v as typeof financeForm.petFinanceType,
                            description:
                              v === "consultation"
                                ? `Consulta – ${pet?.name}`
                                : v === "medication"
                                  ? "Medicação"
                                  : v === "material"
                                    ? "Material"
                                    : v === "exam"
                                      ? `Exame – ${pet?.name}`
                                      : "Combustível",
                            examCharge: "",
                            examLab: "",
                            medCharge: "",
                            medCost: "",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consultation">
                            Consulta (receita)
                          </SelectItem>
                          <SelectItem value="exam">Exames</SelectItem>
                          <SelectItem value="medication">Medicação</SelectItem>
                          <SelectItem value="material">
                            Material (custo)
                          </SelectItem>
                          {isAutonomous && (
                            <SelectItem value="fuel">
                              Combustível (custo)
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={financeForm.date}
                        onChange={(e) =>
                          setFinanceForm((f) => ({
                            ...f,
                            date: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label>
                        {financeForm.petFinanceType === "exam"
                          ? "Descrição do Exame"
                          : financeForm.petFinanceType === "medication"
                            ? "Descrição da Medicação"
                            : "Descrição *"}
                      </Label>
                      <Input
                        value={financeForm.description}
                        onChange={(e) =>
                          setFinanceForm((f) => ({
                            ...f,
                            description: e.target.value,
                          }))
                        }
                        placeholder={
                          financeForm.petFinanceType === "exam"
                            ? "Ex: Hemograma completo"
                            : financeForm.petFinanceType === "medication"
                              ? "Ex: Amoxicilina 250mg"
                              : "Ex: Consulta de rotina"
                        }
                      />
                    </div>
                    {financeForm.petFinanceType === "exam" ? (
                      <>
                        <div className="space-y-1.5">
                          <Label>Cobrado do cliente (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={financeForm.examCharge}
                            onChange={(e) =>
                              setFinanceForm((f) => ({
                                ...f,
                                examCharge: e.target.value,
                              }))
                            }
                            placeholder="0,00"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Pago ao laboratório (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={financeForm.examLab}
                            onChange={(e) =>
                              setFinanceForm((f) => ({
                                ...f,
                                examLab: e.target.value,
                              }))
                            }
                            placeholder="0,00"
                          />
                        </div>
                      </>
                    ) : financeForm.petFinanceType === "medication" ? (
                      <>
                        <div className="space-y-1.5">
                          <Label>Cobrado do cliente (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={financeForm.medCharge}
                            onChange={(e) =>
                              setFinanceForm((f) => ({
                                ...f,
                                medCharge: e.target.value,
                              }))
                            }
                            placeholder="0,00"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Custo do medicamento (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={financeForm.medCost}
                            onChange={(e) =>
                              setFinanceForm((f) => ({
                                ...f,
                                medCost: e.target.value,
                              }))
                            }
                            placeholder="0,00"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1.5">
                        <Label>Valor (R$) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={financeForm.amount}
                          onChange={(e) =>
                            setFinanceForm((f) => ({
                              ...f,
                              amount: e.target.value,
                            }))
                          }
                          placeholder="0,00"
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label>Forma de Pagamento</Label>
                      <Select
                        value={financeForm.paymentMethod ?? "pix"}
                        onValueChange={(v) =>
                          setFinanceForm((f) => ({
                            ...f,
                            paymentMethod: v as FinanceEntry["paymentMethod"],
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="cash">Dinheiro</SelectItem>
                          <SelectItem value="credit_card">Crédito</SelectItem>
                          <SelectItem value="debit_card">Débito</SelectItem>
                          <SelectItem value="bank_slip">Boleto</SelectItem>
                          <SelectItem value="bank_transfer">
                            Transferência
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {financeForm.petFinanceType === "consultation" && (
                    <p className="text-xs text-muted-foreground bg-green-50 border border-green-100 rounded px-3 py-2">
                      Consultas são lançadas como <strong>receita pura</strong>{" "}
                      — sem custo associado.
                    </p>
                  )}
                  {financeForm.petFinanceType === "exam" && (
                    <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded px-3 py-2">
                      O valor <strong>cobrado do cliente</strong> entra como
                      receita. O valor <strong>pago ao laboratório</strong>{" "}
                      entra como custo. Ambos são opcionais.
                    </p>
                  )}
                  {financeForm.petFinanceType === "medication" && (
                    <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-100 rounded px-3 py-2">
                      O valor <strong>cobrado do cliente</strong> entra como
                      receita. O <strong>custo do medicamento</strong> entra
                      como despesa. Ambos são opcionais.
                    </p>
                  )}
                  {financeForm.petFinanceType !== "consultation" &&
                    financeForm.petFinanceType !== "exam" &&
                    financeForm.petFinanceType !== "medication" && (
                      <p className="text-xs text-muted-foreground bg-red-50 border border-red-100 rounded px-3 py-2">
                        Este lançamento será registrado como{" "}
                        <strong>custo</strong> e abatido do lucro.
                      </p>
                    )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setFinanceDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSavePetFinance}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
