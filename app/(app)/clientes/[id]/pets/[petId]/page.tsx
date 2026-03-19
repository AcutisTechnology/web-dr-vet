"use client";
import { useEffect, useState } from "react";
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
  ClipboardList,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VerticalTabs } from "@/components/ui/vertical-tabs";
import { AiDiagnosisTab } from "@/components/pet/ai-diagnosis-tab";
import { petService } from "@/services/pet.service";
import { clientService } from "@/services/client.service";
import { medicalEventService } from "@/services/medical-event.service";
import { financeService } from "@/services/finance.service";
import { adaptApiPetToPet } from "@/adapters/pet.adapter";
import { adaptApiClientToClient } from "@/adapters/client.adapter";
import { adaptApiFinanceEntryToFinanceEntry } from "@/adapters/finance.adapter";
import type { ApiMedicalEvent } from "@/types/api";
import type { Pet, Client, PetAnamnesis, FinanceEntry } from "@/types";
import { useSessionStore } from "@/stores/session";
import { useLogoStore } from "@/stores/logo";
import { AnamnesisDrawer } from "@/components/pet/anamnesis-drawer";
import { formatDate, formatCurrency, exportToCSV } from "@/lib/utils";
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
  consultation: "bg-info/12 text-info",
  vaccine: "bg-success/12 text-success",
  exam: "bg-secondary text-secondary-foreground",
  prescription: "bg-warning/12 text-[color:var(--warning)]",
  observation: "bg-muted text-foreground",
  weight: "bg-accent/15 text-primary",
  surgery: "bg-destructive/12 text-destructive",
  return: "bg-warning/10 text-[color:var(--warning)]",
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
        <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
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
  const { getLogo } = useLogoStore();
  const isAutonomous = currentUser?.accountType === "autonomous";
  const qc = useQueryClient();
  const { data: pet, isLoading: loadingPet } = useQuery({
    queryKey: ["pets", petId],
    queryFn: () => petService.get(petId),
    select: adaptApiPetToPet,
    enabled: !!petId,
  });
  const { data: client, isLoading: loadingClient } = useQuery({
    queryKey: ["clients", clientId],
    queryFn: () => clientService.get(clientId),
    select: adaptApiClientToClient,
    enabled: !!clientId,
  });
  const { data: apiEvents = [] } = useQuery({
    queryKey: ["medical-events", petId],
    queryFn: () => medicalEventService.byPet(petId),
    select: (data: ApiMedicalEvent[]) =>
      [...data].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    enabled: !!petId,
  });
  const events = apiEvents as ApiMedicalEvent[];
  const loading = loadingPet || loadingClient;
  const { data: apiFinanceEntries = [], isLoading: loadingFinance } = useQuery({
    queryKey: ["finance-entries", "pet", petId],
    queryFn: () => financeService.listEntriesByPet(petId),
    select: (data) => data.map(adaptApiFinanceEntryToFinanceEntry),
    enabled: !!petId,
  });
  const petFinanceEntries = apiFinanceEntries;
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
  const [activeTab, setActiveTab] = useState("dados");
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
  // Prontuário — anamnese snapshot
  const [drawerEvent, setDrawerEvent] = useState<import("@/types/api").ApiMedicalEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saveAnamnesisDialogOpen, setSaveAnamnesisDialogOpen] = useState(false);
  const [anamnesisTitle, setAnamnesisTitle] = useState("");
  const [savingSnapshot, setSavingSnapshot] = useState(false);
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

  useEffect(() => {
    if (!pet) return;
    setForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      sex: pet.sex,
      birthDate: pet.birthDate ?? "",
      color: pet.color ?? "",
      neutered: pet.neutered,
      weight: pet.weight ? String(pet.weight) : "",
      microchip: pet.microchip ?? "",
      notes: pet.notes ?? "",
    });
    setAn({ ...EMPTY_AN, ...(pet.anamnesis ?? {}) });
    setDirty(false);
  }, [pet]);

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
      .filter((e) => !e.fromSale && e.type === "income")
      .reduce((s, e) => s + e.amount, 0),
    cost: petFinanceEntries
      .filter((e) => !e.fromSale && e.type === "expense")
      .reduce((s, e) => s + e.amount, 0),
    pdvRevenue: petFinanceEntries
      .filter((e) => e.fromSale)
      .reduce((s, e) => s + e.amount, 0),
  };
  const refreshFinance = () => {
    qc.invalidateQueries({ queryKey: ["finance-entries", "pet", petId] });
    qc.invalidateQueries({ queryKey: ["finance-entries"] });
  };
  const { data: categories = [] } = useQuery({
    queryKey: ["finance-categories"],
    queryFn: () => financeService.listCategories(),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["finance-accounts"],
    queryFn: () => financeService.listAccounts(),
  });

  const createFinanceMutation = useMutation({
    mutationFn: financeService.createEntry,
    onSuccess: () => {
      refreshFinance();
    },
  });

  const handleSavePetFinance = async () => {
    if (!pet) return;

    // Auto-create default categories and account if they don't exist
    let incomeCategory = categories.find((c) => c.type === "income");
    let expenseCategory = categories.find((c) => c.type === "expense");
    let activeAccount = accounts.find((a) => a.active);

    try {
      if (!incomeCategory) {
        const newCategory = await financeService.createCategory({
          name: "Receitas",
          type: "income",
        });
        incomeCategory = newCategory;
      }

      if (!expenseCategory) {
        const newCategory = await financeService.createCategory({
          name: "Despesas",
          type: "expense",
        });
        expenseCategory = newCategory;
      }

      if (!activeAccount) {
        const newAccount = await financeService.createAccount({
          name: "Conta Principal",
          type: "checking",
          balance: 0,
        });
        activeAccount = newAccount;
      }
    } catch (error) {
      toast({
        title: "Erro ao criar categorias/contas padrão",
        variant: "destructive",
      });
      return;
    }

    const dueDate = financeForm.date;

    try {
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
          await createFinanceMutation.mutateAsync({
            type: "income",
            description: `${desc} (cobrado do cliente)`,
            amount: charge,
            due_date: dueDate,
            status: "paid",
            category_id: incomeCategory.id,
            account_id: activeAccount.id,
            payment_method: financeForm.paymentMethod,
            pet_id: pet.id,
          });
        }
        if (financeForm.examLab && lab > 0) {
          await createFinanceMutation.mutateAsync({
            type: "expense",
            description: `${desc} (laboratório)`,
            amount: lab,
            due_date: dueDate,
            status: "paid",
            category_id: expenseCategory.id,
            account_id: activeAccount.id,
            payment_method: financeForm.paymentMethod,
            pet_id: pet.id,
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
          await createFinanceMutation.mutateAsync({
            type: "income",
            description: `${desc} (cobrado do cliente)`,
            amount: charge,
            due_date: dueDate,
            status: "paid",
            category_id: incomeCategory.id,
            account_id: activeAccount.id,
            payment_method: financeForm.paymentMethod,
            pet_id: pet.id,
          });
        }
        if (financeForm.medCost && cost > 0) {
          await createFinanceMutation.mutateAsync({
            type: "expense",
            description: `${desc} (custo)`,
            amount: cost,
            due_date: dueDate,
            status: "paid",
            category_id: expenseCategory.id,
            account_id: activeAccount.id,
            payment_method: financeForm.paymentMethod,
            pet_id: pet.id,
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
        await createFinanceMutation.mutateAsync({
          type: isIncome ? "income" : "expense",
          description: financeForm.description,
          amount: parseFloat(financeForm.amount),
          due_date: dueDate,
          status: "paid",
          category_id: isIncome ? incomeCategory.id : expenseCategory.id,
          account_id: activeAccount.id,
          payment_method: financeForm.paymentMethod,
          pet_id: pet.id,
        });
      }

      toast({ title: "Registro financeiro salvo" });
      setFinanceDialogOpen(false);
      refreshFinance();
    } catch (error) {
      toast({
        title: "Erro ao salvar registro financeiro",
        variant: "destructive",
      });
    }
  };

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

  const updatePetMutation = useMutation({
    mutationFn: (payload: Parameters<typeof petService.update>[1]) =>
      petService.update(petId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pets", petId] });
      toast({ title: "Identificação salva com sucesso!" });
      setSaving(false);
      setDirty(false);
      setEditMode(false);
    },
    onError: () => {
      toast({ title: "Erro ao salvar identificação", variant: "destructive" });
      setSaving(false);
    },
  });

  const updateAnamnesisM = useMutation({
    mutationFn: (anamnesis: Record<string, unknown>) =>
      petService.updateAnamnesis(petId, anamnesis),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pets", petId] });
      toast({ title: "Anamnese salva com sucesso!" });
      setSaving(false);
      setDirty(false);
    },
    onError: () => {
      toast({ title: "Erro ao salvar anamnese", variant: "destructive" });
      setSaving(false);
    },
  });

  const handleSaveIdentification = () => {
    if (!pet || !form.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    updatePetMutation.mutate({
      name: form.name.trim(),
      species: form.species,
      breed: form.breed,
      sex: form.sex,
      birth_date: form.birthDate || undefined,
      color: form.color || undefined,
      neutered: form.neutered,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      microchip: form.microchip || undefined,
      notes: form.notes || undefined,
    });
  };

  const handleSaveAnamnesis = () => {
    if (!pet) return;
    setSaving(true);
    const cleaned = Object.fromEntries(
      Object.entries(an).filter(
        ([, v]) => v !== undefined && v !== null && v !== "",
      ),
    );
    updateAnamnesisM.mutate(cleaned);
  };

  const handleSaveAnamnesisSnapshot = async () => {
    if (!pet) return;
    setSavingSnapshot(true);
    try {
      const snapshot = Object.fromEntries(
        Object.entries(an).filter(([, v]) => v !== undefined && v !== null && v !== ""),
      );
      const title = anamnesisTitle.trim() || `Anamnese – ${new Date().toLocaleDateString("pt-BR")}`;
      await medicalEventService.create({
        pet_id: pet.id,
        type: "observation",
        date: new Date().toISOString().split("T")[0],
        title,
        description: "Snapshot de anamnese salvo pelo veterinário.",
        anamnesis_snapshot: snapshot,
      });
      qc.invalidateQueries({ queryKey: ["medical-events", petId] });
      toast({ title: `Anamnese salva no prontuário: "${title}"` });
      setSaveAnamnesisDialogOpen(false);
      setAnamnesisTitle("");
      setActiveTab("prontuario");
    } catch {
      toast({ title: "Erro ao salvar anamnese no prontuário", variant: "destructive" });
    } finally {
      setSavingSnapshot(false);
    }
  };
  const handleMarkDeceased = () => {
    if (!pet || !confirm(`Marcar ${pet.name} como falecido?`)) return;
    updatePetMutation.mutate({ status: "deceased" });
    toast({ title: `${pet.name} marcado como falecido` });
  };
  const handleExportCSV = () => {
    exportToCSV(
      events.map((e) => ({
        Data: formatDate(e.date),
        Tipo: EVT_LBL[e.type] ?? e.type,
        Descrição: e.description ?? "",
        Diagnóstico: e.diagnosis ?? "",
        Tratamento: e.treatment ?? "",
      })),
      `prontuario-${pet?.name ?? "pet"}`,
    );
  };
  const handlePrintPrescription = (event: ApiMedicalEvent) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(
      `<html><head><title>Receita</title><style>body{font-family:Poppins,Arial,sans-serif;padding:30px;max-width:600px}.blk{margin:10px 0;padding:10px;border:1px solid #dde3ee;border-radius:4px}</style></head><body><h2 style="color:#1b2a6b">VetDom – Receituário</h2><p><b>Pet:</b> ${pet?.name} | <b>Tutor:</b> ${client?.name} | <b>Data:</b> ${formatDate(event.date)}</p><hr/>${event.medications ? '<div class="blk"><b>Medicações:</b><br/>' + event.medications + "</div>" : ""}${event.diagnosis ? '<div class="blk"><b>Diagnóstico:</b><br/>' + event.diagnosis + "</div>" : ""}${event.treatment ? '<div class="blk"><b>Tratamento:</b><br/>' + event.treatment + "</div>" : ""}<hr/><p style="font-size:12px;color:#5e6b85">Impresso em ${new Date().toLocaleString("pt-BR")}</p></body></html>`,
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
    const css = `body{font-family:Poppins,Arial,sans-serif;padding:28px;font-size:12px;color:#111}
h1{font-size:17px;margin:0 0 3px}p.sub{font-size:11px;color:#555;margin:0 0 14px}
h2{font-size:11px;font-weight:700;background:#eef2ff;padding:3px 8px;margin:14px 0 5px;border-left:3px solid #1b2a6b;text-transform:uppercase;letter-spacing:.04em}
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

    // Use user's custom logo or fall back to DrVet branding
    const userLogoUrl = currentUser?.id ? getLogo(currentUser.id) : null;
    const clinicDisplayName = currentUser?.clinicName || rx.clinicName || "DrVet";
    const doctorName = rx.vetName || currentUser?.name || "Médico(a) Veterinário(a)";

    const rxCss = `
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Poppins',Arial,sans-serif;font-size:13px;color:#1a1a1a;background:#fff}
      .page{max-width:720px;margin:0 auto;padding:32px 40px}
      .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:3px solid #1b2a6b;margin-bottom:20px}
      .logo-area{display:flex;align-items:center;gap:12px}
      .logo-img{width:56px;height:56px;object-fit:contain;border-radius:8px}
      .logo-text{font-size:22px;font-weight:800;color:#1b2a6b;letter-spacing:-.5px}.logo-text span{color:#2f7eea}
      .logo-subtext{font-size:10px;color:#666;margin-top:2px}
      .clinic-info{text-align:right;font-size:11px;color:#555;line-height:1.6}
      .patient{background:#f5f3ff;border:1px solid #ddd6fe;border-radius:6px;padding:10px 14px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
      .patient .field .lbl{font-size:9px;text-transform:uppercase;color:#7c3aed;font-weight:700;letter-spacing:.06em}.patient .field .val{font-size:12px;font-weight:600}
      h2{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#1b2a6b;font-weight:700;margin-bottom:10px;padding-bottom:4px;border-bottom:1px solid #e0e7ff}
      .item{display:grid;grid-template-columns:24px 1fr;gap:0 10px;margin-bottom:14px;page-break-inside:avoid}
      .item-num{width:24px;height:24px;background:#1b2a6b;color:#fff;border-radius:50%;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:2px}
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

    // Header left: logo image if available, else DrVet text
    const headerLogoHtml = userLogoUrl
      ? `<div class="logo-area">
          <img src="${userLogoUrl}" alt="Logo" class="logo-img" />
          <div>
            <div class="logo-text">${clinicDisplayName}</div>
            <div class="logo-subtext">Dr. ${doctorName}</div>
          </div>
        </div>`
      : `<div class="logo-area">
          <div>
            <div class="logo-text">Dr<span>Vet</span></div>
            <div class="logo-subtext">${clinicDisplayName}</div>
            <div style="font-size:10px;color:#888;margin-top:1px">Dr. ${doctorName}</div>
          </div>
        </div>`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Receituário – ${pet.name}</title><style>${rxCss}</style></head>
<body><div class="page">
<div class="header">
  ${headerLogoHtml}
  <div class="clinic-info">
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
    ${doctorName}<br/>
    ${rx.vetCrmv ? `CRMV: ${rx.vetCrmv}` : "CRMV: ___________________"}
  </div>
  <div class="sig-box">
    Assinatura<br/>&nbsp;
  </div>
</div>
<div class="disclaimer">Este receituário é válido por 30 dias a partir da data de emissão. ${clinicDisplayName} – Sistema de Gestão Veterinária</div>
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
    <div className="space-y-4 font-sans">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/clientes/${clientId}`}>
            <Button variant="ghost" size="icon" className="shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold [font-family:var(--font-heading)]">{pet.name}</h1>
              {pet.status === "deceased" && (
                <Badge variant="destructive">Óbito</Badge>
              )}
              {dirty && <Badge variant="secondary">Não salvo</Badge>}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {SP[pet.species]} • {pet.breed} • Tutor: {client?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handlePrintAnamnesis} className="hidden sm:flex">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditMode(false);
                if (pet) {
                  setForm({
                    name: pet.name,
                    species: pet.species,
                    breed: pet.breed,
                    sex: pet.sex,
                    birthDate: pet.birthDate ?? "",
                    color: pet.color ?? "",
                    neutered: pet.neutered,
                    weight: pet.weight ? String(pet.weight) : "",
                    microchip: pet.microchip ?? "",
                    notes: pet.notes ?? "",
                  });
                  setAn({ ...EMPTY_AN, ...(pet.anamnesis ?? {}) });
                  setDirty(false);
                }
              }}
            >
              Cancelar
            </Button>
          )}
          {editMode && (
            <Button
              size="sm"
              onClick={handleSaveIdentification}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-1" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
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

      <VerticalTabs
        tabs={[
          { value: "dados", label: "Identificação" },
          { value: "queixas", label: "Queixa Atual" },
          { value: "historico", label: "Histórico Médico" },
          { value: "ambiente", label: "Rotina e Alimentação" },
          { value: "preventivos", label: "Preventivos" },
          { value: "obs", label: "Comportamento" },
          { value: "ia", label: "✨ Diagnóstico IA" },
          { value: "receituario", label: "Receituário" },
          { value: "prontuario", label: `Prontuário (${events.length})` },
          { value: "financeiro", label: "Financeiro" },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      >
        {/* conteúdo das tabs — div wrapper para manter space-y-4 */}
        <div>
          {/* DADOS BÁSICOS */}
          <TabsContent value="dados">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Identificação</CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
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
                    <div className="sm:col-span-2 flex items-center gap-3">
                      <Switch
                        checked={form.neutered}
                        onCheckedChange={(v) => sf("neutered", v)}
                        id="neu"
                      />
                      <Label htmlFor="neu">Castrado(a)</Label>
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
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
                        <p className="text-sm bg-warning/10 text-[color:var(--warning)] rounded px-3 py-2">
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
                    />
                    <SRow
                      label="Diarreia"
                      opts={SIM_NAO}
                      value={an.diarrhea}
                      onChange={(v) => sa("diarrhea", v)}
                    />
                    <SRow
                      label="Apetite (está comendo?)"
                      opts={INGESTAO}
                      value={an.eating}
                      onChange={(v) => sa("eating", v)}
                    />
                    <SRow
                      label="Ingestão de água"
                      opts={INGESTAO}
                      value={an.drinking}
                      onChange={(v) => sa("drinking", v)}
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
                    />
                    <SRow
                      label="Fezes (está defecando?)"
                      opts={INGESTAO}
                      value={an.defecation}
                      onChange={(v) => sa("defecation", v)}
                    />
                    <SRow
                      label="Perda de peso"
                      opts={INTENS}
                      value={an.weightLoss}
                      onChange={(v) => sa("weightLoss", v)}
                    />
                    <SRow
                      label="Cansaço / Letargia"
                      opts={INTENS}
                      value={an.fatigue}
                      onChange={(v) => sa("fatigue", v)}
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
                    />
                    <SRow
                      label="Espirro"
                      opts={FREQ}
                      value={an.sneezing}
                      onChange={(v) => sa("sneezing", v)}
                    />
                    <SRow
                      label="Dificuldade respiratória"
                      opts={INTENS}
                      value={an.dyspnea}
                      onChange={(v) => sa("dyspnea", v)}
                    />
                    <SRow
                      label="Secreção nasal"
                      opts={SECRECAO}
                      value={an.nasalDischarge}
                      onChange={(v) => sa("nasalDischarge", v)}
                    />
                    <SRow
                      label="Secreção ocular"
                      opts={SECRECAO}
                      value={an.ocularDischarge}
                      onChange={(v) => sa("ocularDischarge", v)}
                    />
                    <SRow
                      label="Coceira / Prurido"
                      opts={INTENS}
                      value={an.pruritus}
                      onChange={(v) => sa("pruritus", v)}
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
                    />
                    <SRow
                      label="Claudicação / Manqueira"
                      opts={INTENS}
                      value={an.lameness}
                      onChange={(v) => sa("lameness", v)}
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
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-1.5">
                  <Label>Observações complementares</Label>
                  <Textarea
                    value={an.complaintsNotes ?? ""}
                    onChange={(e) => sa("complaintsNotes", e.target.value)}
                    rows={3}
                    placeholder="Início dos sintomas, evolução, situações que pioram ou melhoram..."
                  />
                </div>
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
                  />
                  <SRow
                    label="Ataxia / Incoordenação"
                    opts={INTENS}
                    value={an.ataxia}
                    onChange={(v) => sa("ataxia", v)}
                  />
                  <SRow
                    label="Tremores"
                    opts={FREQ}
                    value={an.tremors}
                    onChange={(v) => sa("tremors", v)}
                  />
                  <SRow
                    label="Sinais vestibulares"
                    opts={SIM_NAO_SIMPLES}
                    value={an.vestibularSigns}
                    onChange={(v) => sa("vestibularSigns", v)}
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
                  />
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
                  />
                  <SRow
                    label="Vermelhidão / Hiperemia"
                    opts={INTENS}
                    value={an.eyeRedness}
                    onChange={(v) => sa("eyeRedness", v)}
                  />
                  <SRow
                    label="Opacidade / Catarata"
                    opts={OLHO_OPACIDADE}
                    value={an.eyeOpacity}
                    onChange={(v) => sa("eyeOpacity", v)}
                  />
                  <SRow
                    label="Dor ocular / Blefaroespasmo"
                    opts={SIM_NAO_SIMPLES}
                    value={an.eyePain}
                    onChange={(v) => sa("eyePain", v)}
                  />
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
                  />
                  <SRow
                    label="Secreção auricular"
                    opts={OUVIDO_SECRECAO}
                    value={an.earDischarge}
                    onChange={(v) => sa("earDischarge", v)}
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
                  />
                  <SRow
                    label="Coçar / Chacoalhar cabeça"
                    opts={FREQ}
                    value={an.earScratch}
                    onChange={(v) => sa("earScratch", v)}
                  />
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={handleSaveAnamnesis} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          <SelectItem value="rural">Rural / Fazenda</SelectItem>
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
                          <SelectItem value="sitio">Sítio / Chácara</SelectItem>
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
                    <div className="sm:col-span-2 space-y-2">
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
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Alimentação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          <SelectItem value="racao_seca">Ração seca</SelectItem>
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
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={handleSaveAnamnesis} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-2">
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
                  <div className="sm:col-span-2 space-y-1.5">
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
                      onChange={(e) => sa("dewormingLastDate", e.target.value)}
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
              </CardContent>
            </Card>
            <div className="flex justify-end mt-4">
              <Button onClick={handleSaveAnamnesis} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </TabsContent>
          {/* HISTÓRICO MÉDICO */}
          <TabsContent value="historico">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Histórico Médico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Doenças pré-existentes / anteriores</Label>
                    <Textarea
                      value={an.previousDiseases ?? ""}
                      onChange={(e) => sa("previousDiseases", e.target.value)}
                      rows={3}
                      placeholder="Liste doenças diagnosticadas anteriormente..."
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Cirurgias realizadas</Label>
                    <Textarea
                      value={an.previousSurgeries ?? ""}
                      onChange={(e) => sa("previousSurgeries", e.target.value)}
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
                      onChange={(e) => sa("chronicConditions", e.target.value)}
                      rows={2}
                      placeholder="Ex: diabetes, epilepsia, hipotireoidismo..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Medicações em uso contínuo</Label>
                    <Textarea
                      value={an.currentMedications ?? ""}
                      onChange={(e) => sa("currentMedications", e.target.value)}
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
                  <div className="sm:col-span-2 space-y-1.5">
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
              </CardContent>
            </Card>
            <div className="flex justify-end mt-4">
              <Button onClick={handleSaveAnamnesis} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </TabsContent>
          {/* DIAGNÓSTICO IA */}
          <TabsContent value="ia">
            <AiDiagnosisTab
              petId={petId}
              petName={pet.name}
              hasAnamnesis={!!pet.anamnesis && Object.keys(pet.anamnesis).length > 0}
            />
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="sm:col-span-2 md:col-span-2 space-y-1">
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
                                <span className="text-info">💊</span>
                                Uso oral
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso tópico">
                              <span className="flex items-center gap-2">
                                <span className="text-success">🧴</span>
                                Uso tópico
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso otológico">
                              <span className="flex items-center gap-2">
                                <span className="text-primary">👂</span>
                                Uso otológico
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso oftálmico">
                              <span className="flex items-center gap-2">
                                <span className="text-accent">👁️</span>
                                Uso oftálmico
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso intranasal">
                              <span className="flex items-center gap-2">
                                <span className="text-primary">👃</span>
                                Uso intranasal
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso inalatório">
                              <span className="flex items-center gap-2">
                                <span className="text-info">💨</span>
                                Uso inalatório
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso subcutâneo">
                              <span className="flex items-center gap-2">
                                <span className="text-[color:var(--warning)]">💉</span>
                                Uso subcutâneo (SC)
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso intramuscular">
                              <span className="flex items-center gap-2">
                                <span className="text-destructive">💉</span>
                                Uso intramuscular (IM)
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso intravenoso">
                              <span className="flex items-center gap-2">
                                <span className="text-destructive">💉</span>
                                Uso intravenoso (IV)
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso retal">
                              <span className="flex items-center gap-2">
                                <span className="text-[color:var(--warning)]">🔸</span>
                                Uso retal
                              </span>
                            </SelectItem>
                            <SelectItem value="Uso intravaginal">
                              <span className="flex items-center gap-2">
                                <span className="text-primary">🔹</span>
                                Uso intravaginal
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2 md:col-span-4 space-y-1">
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
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Temperamento</Label>
                    <Select
                      value={an.temperament || "__none__"}
                      onValueChange={(v) =>
                        sa("temperament", v === "__none__" ? "" : v)
                      }
                    >
                      <SelectTrigger className="w-full sm:w-64">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Não informado</SelectItem>
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
              </CardContent>
            </Card>
            <div className="flex justify-end mt-4">
              <Button onClick={handleSaveAnamnesis} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </TabsContent>
          {/* PRONTUÁRIO */}
          <TabsContent value="prontuario">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-medium text-sm">
                  Histórico clínico de{" "}
                  <span className="text-primary font-semibold">{pet.name}</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-violet-300 text-violet-700 hover:bg-violet-50"
                    onClick={() => setSaveAnamnesisDialogOpen(true)}
                  >
                    <ClipboardList className="w-4 h-4 mr-1" />
                    Salvar anamnese atual
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="w-4 h-4 mr-1" />
                    Exportar CSV
                  </Button>
                </div>
              </div>

              {events.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground space-y-2">
                    <BookOpen className="w-10 h-10 mx-auto opacity-20" />
                    <p>Nenhum evento registrado no prontuário.</p>
                    <p className="text-xs">Use o botão acima para salvar um snapshot da anamnese atual.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-4 pl-10">
                    {events.map((event) => {
                      const isAnamnesis = !!event.anamnesis_snapshot;
                      const dotColor = isAnamnesis
                        ? "bg-violet-500"
                        : (EVT_CLR[event.type] ?? "bg-gray-100 text-gray-800").split(" ")[0];

                      return (
                        <div key={event.id} className="relative">
                          <div className={`absolute -left-6 top-3 w-3 h-3 rounded-full border-2 border-background ${dotColor}`} />
                          <Card className={isAnamnesis ? "border-violet-200 bg-violet-50/30" : ""}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  {/* Badges */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {isAnamnesis ? (
                                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-violet-100 text-violet-700">
                                        Anamnese
                                      </span>
                                    ) : (
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EVT_CLR[event.type] ?? "bg-gray-100 text-gray-800"}`}>
                                        {EVT_LBL[event.type] ?? event.type}
                                      </span>
                                    )}
                                    {event.title && !isAnamnesis && (
                                      <span className="text-xs text-muted-foreground truncate">{event.title}</span>
                                    )}
                                  </div>

                                  {/* Title for anamnesis */}
                                  {isAnamnesis && event.title && (
                                    <p className="text-sm font-semibold text-violet-900 mt-1">{event.title}</p>
                                  )}

                                  {/* Date + vet */}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDate(event.date)}
                                    {event.vet && ` · Dr(a). ${event.vet.name}`}
                                  </p>

                                  {/* Regular event fields */}
                                  {!isAnamnesis && (() => {
                                    const isAiEvent = event.title?.startsWith("IA:");
                                    if (isAiEvent) {
                                      // Render AI diagnosis with formatted sections
                                      // The backend uses \n and emoji-prefixed headers
                                      const SECTION_EMOJI = /^[🤖📋🔍🧪💊📝⚠️]/u;
                                      const lines = (event.description ?? "").split("\n");
                                      return (
                                        <div className="mt-2 space-y-0.5 text-xs">
                                          {lines.map((line, i) => {
                                            if (!line.trim()) return <div key={i} className="h-2" />;
                                            if (SECTION_EMOJI.test(line)) {
                                              return (
                                                <p key={i} className="font-bold text-primary mt-3 mb-1">
                                                  {line}
                                                </p>
                                              );
                                            }
                                            if (line.startsWith("•")) {
                                              return (
                                                <p key={i} className="text-gray-700 pl-2">
                                                  {line}
                                                </p>
                                              );
                                            }
                                            if (line.startsWith("  ")) {
                                              return (
                                                <p key={i} className="text-muted-foreground pl-4">
                                                  {line.trim()}
                                                </p>
                                              );
                                            }
                                            return (
                                              <p key={i} className="text-gray-700">
                                                {line}
                                              </p>
                                            );
                                          })}
                                          {event.notes && (
                                            <p className="text-[color:var(--warning)] bg-warning/10 rounded px-2 py-1.5 mt-2 border border-warning/20">
                                              {event.notes}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    }
                                    return (
                                      <>
                                        {event.description && (
                                          <p className="text-sm mt-2 text-gray-700">{event.description}</p>
                                        )}
                                        {event.diagnosis && (
                                          <p className="text-sm mt-1">
                                            <strong>Diagnóstico:</strong> {event.diagnosis}
                                          </p>
                                        )}
                                        {event.treatment && (
                                          <p className="text-sm mt-1">
                                            <strong>Tratamento:</strong> {event.treatment}
                                          </p>
                                        )}
                                        {event.notes && (
                                          <p className="text-sm mt-1 text-muted-foreground italic">{event.notes}</p>
                                        )}
                                      </>
                                    );
                                  })()}

                                  {/* Anamnesis snapshot preview */}
                                  {isAnamnesis && (
                                    <p className="text-xs text-violet-600 mt-1.5">
                                      {Object.keys(event.anamnesis_snapshot ?? {}).length} campos preenchidos
                                    </p>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {isAnamnesis && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-violet-200 text-violet-700 hover:bg-violet-50 text-xs h-8"
                                      onClick={() => {
                                        setDrawerEvent(event);
                                        setDrawerOpen(true);
                                      }}
                                    >
                                      <ClipboardList className="w-3.5 h-3.5 mr-1" />
                                      Ver anamnese
                                    </Button>
                                  )}
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

            {/* Dialog: Save anamnesis snapshot */}
            <Dialog open={saveAnamnesisDialogOpen} onOpenChange={setSaveAnamnesisDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-violet-600" />
                    Salvar anamnese no prontuário
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <p className="text-sm text-muted-foreground">
                    Um snapshot completo da anamnese atual será salvo como registro no prontuário de <strong>{pet.name}</strong>.
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="anamnesis-title">
                      Título do registro{" "}
                      <span className="text-muted-foreground font-normal">(opcional)</span>
                    </Label>
                    <input
                      id="anamnesis-title"
                      type="text"
                      value={anamnesisTitle}
                      onChange={(e) => setAnamnesisTitle(e.target.value)}
                      placeholder={`Anamnese – ${new Date().toLocaleDateString("pt-BR")}`}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 transition-all"
                    />
                    <p className="text-xs text-muted-foreground">
                      Se não informar, o título será gerado com a data de hoje.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveAnamnesisDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveAnamnesisSnapshot}
                    disabled={savingSnapshot}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    <ClipboardList className="w-4 h-4 mr-2" />
                    {savingSnapshot ? "Salvando..." : "Salvar no prontuário"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Drawer: View anamnesis snapshot */}
            <AnamnesisDrawer
              event={drawerEvent}
              open={drawerOpen}
              onOpenChange={setDrawerOpen}
            />
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
                  <p className="text-xl font-bold text-success">
                    {formatCurrency(petFinanceSummary.revenue)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">
                    Custos{isAutonomous ? " (incl. combustível)" : ""}
                  </p>
                  <p className="text-xl font-bold text-destructive">
                    {formatCurrency(petFinanceSummary.cost)}
                  </p>
                </CardContent>
              </Card>
              {petFinanceSummary.pdvRevenue > 0 && (
                <Card className="border-info/30 bg-info/8">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">
                      Receita PDV (Produtos/Serviços)
                    </p>
                    <p className="text-xl font-bold text-info">
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
                        ? "text-primary"
                        : "text-destructive"
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
                                        ? "bg-success/12 text-success"
                                        : "bg-destructive/12 text-destructive"
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
                                  className={`px-4 py-2 text-right font-semibold ${isIncome ? "text-success" : "text-destructive"}`}
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
                        <span className="inline-block w-2 h-2 rounded-full bg-info" />
                        Vendas PDV (somente leitura)
                      </p>
                      <div className="rounded-lg border border-info/20 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-info/8">
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
                                className="border-b last:border-0 hover:bg-info/6"
                              >
                                <td className="px-4 py-2 text-muted-foreground">
                                  {formatDate(entry.dueDate)}
                                </td>
                                <td className="px-4 py-2">
                                  {entry.description}
                                </td>
                                <td className="px-4 py-2 text-right font-semibold text-success">
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
                    <p className="text-xs text-muted-foreground bg-success/10 border border-success/20 rounded px-3 py-2">
                      Consultas são lançadas como <strong>receita pura</strong>{" "}
                      — sem custo associado.
                    </p>
                  )}
                  {financeForm.petFinanceType === "exam" && (
                    <p className="text-xs text-muted-foreground bg-info/8 border border-info/20 rounded px-3 py-2">
                      O valor <strong>cobrado do cliente</strong> entra como
                      receita. O valor <strong>pago ao laboratório</strong>{" "}
                      entra como custo. Ambos são opcionais.
                    </p>
                  )}
                  {financeForm.petFinanceType === "medication" && (
                    <p className="text-xs text-muted-foreground bg-warning/10 border border-warning/20 rounded px-3 py-2">
                      O valor <strong>cobrado do cliente</strong> entra como
                      receita. O <strong>custo do medicamento</strong> entra
                      como despesa. Ambos são opcionais.
                    </p>
                  )}
                  {financeForm.petFinanceType !== "consultation" &&
                    financeForm.petFinanceType !== "exam" &&
                    financeForm.petFinanceType !== "medication" && (
                      <p className="text-xs text-muted-foreground bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
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
      </VerticalTabs>
    </div>
  );
}
