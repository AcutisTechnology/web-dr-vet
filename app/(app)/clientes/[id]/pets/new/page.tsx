"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { petsDb } from "@/mocks/db";
import type { Pet, PetAnamnesis } from "@/types";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const emptyAnamnesis: PetAnamnesis = {
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

function SRow({
  label,
  opts,
  value,
  onChange,
}: {
  label: string;
  opts: { value: string; label: string }[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b last:border-0">
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

export default function NewPetPage() {
  const { id: clientId } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

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
  const [anamnesis, setAnamnesis] = useState<PetAnamnesis>({
    ...emptyAnamnesis,
  });
  const sa2 = (field: keyof PetAnamnesis) => (v: string) =>
    setAnamnesis((a) => ({ ...a, [field]: v }));

  const sf = (field: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));
  const sa = (
    field: keyof PetAnamnesis,
    value: string | boolean | number | undefined,
  ) => setAnamnesis((a) => ({ ...a, [field]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Nome do pet é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    await petsDb.create({
      clientId,
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
      status: "active",
      photos: [],
      anamnesis: {
        ...anamnesis,
        dewormingLastDate: anamnesis.dewormingLastDate || undefined,
        feedingsPerDay: anamnesis.feedingsPerDay || undefined,
      },
    });
    toast({ title: "Pet cadastrado com sucesso!" });
    router.push(`/clientes/${clientId}`);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/clientes/${clientId}`}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Novo Pet</h1>
          <p className="text-sm text-muted-foreground">
            Preencha os dados básicos e a anamnese
          </p>
        </div>
      </div>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="dados">Identificação</TabsTrigger>
          <TabsTrigger value="sintomas">Sintomas</TabsTrigger>
          <TabsTrigger value="ambiente">Ambiente e Rotina</TabsTrigger>
          <TabsTrigger value="preventivos">Preventivos</TabsTrigger>
          <TabsTrigger value="historico">Histórico Médico</TabsTrigger>
          <TabsTrigger value="comportamento">Comportamento</TabsTrigger>
        </TabsList>

        {/* ── DADOS BÁSICOS ── */}
        <TabsContent value="dados">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identificação</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Nome *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => sf("name", e.target.value)}
                  placeholder="Nome do pet"
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
                  placeholder="Ex: Labrador, SRD..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sexo</Label>
                <Select value={form.sex} onValueChange={(v) => sf("sex", v)}>
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
                <Label>Data de Nascimento</Label>
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
                  placeholder="Ex: caramelo, preto e branco..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.weight}
                  onChange={(e) => sf("weight", e.target.value)}
                  placeholder="Ex: 12.5"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Microchip</Label>
                <Input
                  value={form.microchip}
                  onChange={(e) => sf("microchip", e.target.value)}
                  placeholder="Número do microchip"
                />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <Switch
                  checked={form.neutered}
                  onCheckedChange={(v) => sf("neutered", v)}
                  id="neutered-new"
                />
                <Label htmlFor="neutered-new">Castrado(a)</Label>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Observações gerais</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => sf("notes", e.target.value)}
                  rows={2}
                  placeholder="Notas rápidas sobre o pet..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SINTOMAS ── */}
        <TabsContent value="sintomas">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sintomas</CardTitle>
              <CardDescription>
                Marque o que o tutor relata ou o que foi observado na triagem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Digestivo
                  </p>
                  <SRow
                    label="Vômito"
                    opts={SIM_NAO}
                    value={anamnesis.vomiting}
                    onChange={sa2("vomiting")}
                  />
                  <SRow
                    label="Diarreia"
                    opts={SIM_NAO}
                    value={anamnesis.diarrhea}
                    onChange={sa2("diarrhea")}
                  />
                  <SRow
                    label="Apetite (está comendo?)"
                    opts={INGESTAO}
                    value={anamnesis.eating}
                    onChange={sa2("eating")}
                  />
                  <SRow
                    label="Ingestão de água"
                    opts={INGESTAO}
                    value={anamnesis.drinking}
                    onChange={sa2("drinking")}
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
                    value={anamnesis.urination}
                    onChange={sa2("urination")}
                  />
                  <SRow
                    label="Fezes (está defecando?)"
                    opts={INGESTAO}
                    value={anamnesis.defecation}
                    onChange={sa2("defecation")}
                  />
                  <SRow
                    label="Perda de peso"
                    opts={INTENS}
                    value={anamnesis.weightLoss}
                    onChange={sa2("weightLoss")}
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Respiratório / Outros
                  </p>
                  <SRow
                    label="Tosse"
                    opts={FREQ}
                    value={anamnesis.coughing}
                    onChange={sa2("coughing")}
                  />
                  <SRow
                    label="Espirro"
                    opts={FREQ}
                    value={anamnesis.sneezing}
                    onChange={sa2("sneezing")}
                  />
                  <SRow
                    label="Dificuldade respiratória"
                    opts={INTENS}
                    value={anamnesis.dyspnea}
                    onChange={sa2("dyspnea")}
                  />
                  <SRow
                    label="Secreção nasal"
                    opts={SECRECAO}
                    value={anamnesis.nasalDischarge}
                    onChange={sa2("nasalDischarge")}
                  />
                  <SRow
                    label="Secreção ocular"
                    opts={SECRECAO}
                    value={anamnesis.ocularDischarge}
                    onChange={sa2("ocularDischarge")}
                  />
                  <SRow
                    label="Coceira / Prurido"
                    opts={INTENS}
                    value={anamnesis.pruritus}
                    onChange={sa2("pruritus")}
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
                    value={anamnesis.skinLesions}
                    onChange={sa2("skinLesions")}
                  />
                  <SRow
                    label="Claudicação / Manqueira"
                    opts={INTENS}
                    value={anamnesis.lameness}
                    onChange={sa2("lameness")}
                  />
                  <SRow
                    label="Convulsão / Crise epiléptica"
                    opts={[
                      { value: "nao", label: "Não" },
                      { value: "historico", label: "Histórico anterior" },
                      { value: "recente", label: "Episódio recente" },
                    ]}
                    value={anamnesis.seizures}
                    onChange={sa2("seizures")}
                  />
                  <SRow
                    label="Cansaço / Letargia"
                    opts={INTENS}
                    value={anamnesis.fatigue}
                    onChange={sa2("fatigue")}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                <Label>Observações complementares da queixa</Label>
                <Textarea
                  value={anamnesis.complaintsNotes ?? ""}
                  onChange={(e) => sa("complaintsNotes", e.target.value)}
                  rows={3}
                  placeholder="Descreva detalhes adicionais: início dos sintomas, evolução, situações que pioram ou melhoram..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AMBIENTE E ROTINA ── */}
        <TabsContent value="ambiente">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ambiente e Rotina</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ambiente</Label>
                <Select
                  value={anamnesis.environment || "__none__"}
                  onValueChange={(v) =>
                    sa("environment", v === "__none__" ? "" : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Não informado</SelectItem>
                    <SelectItem value="domiciliar">
                      Domiciliar (interior)
                    </SelectItem>
                    <SelectItem value="quintal">
                      Quintal / Área externa
                    </SelectItem>
                    <SelectItem value="misto">Misto (dentro e fora)</SelectItem>
                    <SelectItem value="rural">Rural / Fazenda</SelectItem>
                    <SelectItem value="canil">Canil / Gatil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de moradia</Label>
                <Select
                  value={anamnesis.housingType || "__none__"}
                  onValueChange={(v) =>
                    sa("housingType", v === "__none__" ? "" : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Não informado</SelectItem>
                    <SelectItem value="apartamento">Apartamento</SelectItem>
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
                  value={anamnesis.walkFrequency ?? ""}
                  onChange={(e) => sa("walkFrequency", e.target.value)}
                  placeholder="Ex: 2x ao dia, raramente..."
                />
              </div>
              <div className="col-span-2 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={!!anamnesis.contactWithOtherAnimals}
                    onCheckedChange={(v) => sa("contactWithOtherAnimals", v)}
                    id="other-animals"
                  />
                  <Label htmlFor="other-animals">
                    Contato com outros animais domésticos
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={!!anamnesis.contactWithWildAnimals}
                    onCheckedChange={(v) => sa("contactWithWildAnimals", v)}
                    id="wild-animals"
                  />
                  <Label htmlFor="wild-animals">
                    Contato com animais silvestres
                  </Label>
                </div>
              </div>
              <div className="col-span-2 pt-2 border-t">
                <p className="text-sm font-medium mb-3">Alimentação</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Tipo de alimentação</Label>
                    <Select
                      value={anamnesis.foodType || "__none__"}
                      onValueChange={(v) =>
                        sa("foodType", v === "__none__" ? "" : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Não informado</SelectItem>
                        <SelectItem value="racao_seca">Ração seca</SelectItem>
                        <SelectItem value="racao_umida">Ração úmida</SelectItem>
                        <SelectItem value="natural">
                          Alimentação natural (BARF)
                        </SelectItem>
                        <SelectItem value="misto">
                          Misto (ração + natural)
                        </SelectItem>
                        <SelectItem value="caseira">Comida caseira</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Marca / Produto</Label>
                    <Input
                      value={anamnesis.foodBrand ?? ""}
                      onChange={(e) => sa("foodBrand", e.target.value)}
                      placeholder="Ex: Royal Canin, Premier..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Refeições por dia</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={anamnesis.feedingsPerDay ?? ""}
                      onChange={(e) =>
                        sa(
                          "feedingsPerDay",
                          e.target.value ? parseInt(e.target.value) : undefined,
                        )
                      }
                      placeholder="Ex: 2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fonte de água</Label>
                    <Select
                      value={anamnesis.waterSource || "__none__"}
                      onValueChange={(v) =>
                        sa("waterSource", v === "__none__" ? "" : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Não informado</SelectItem>
                        <SelectItem value="filtrada">Filtrada</SelectItem>
                        <SelectItem value="torneira">Torneira</SelectItem>
                        <SelectItem value="mineral">Mineral</SelectItem>
                        <SelectItem value="fonte">
                          Fonte / bebedouro automático
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PREVENTIVOS ── */}
        <TabsContent value="preventivos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Preventivos e Profilaxia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex items-center gap-3">
                  <Switch
                    checked={!!anamnesis.vaccinationUpToDate}
                    onCheckedChange={(v) => sa("vaccinationUpToDate", v)}
                    id="vac-ok"
                  />
                  <Label htmlFor="vac-ok">Vacinação em dia</Label>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Protocolo vacinal</Label>
                  <Textarea
                    value={anamnesis.vaccinationProtocol ?? ""}
                    onChange={(e) => sa("vaccinationProtocol", e.target.value)}
                    rows={2}
                    placeholder="Ex: V10, Anti-rábica, Leishmaniose... datas de aplicação"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={!!anamnesis.dewormingUpToDate}
                    onCheckedChange={(v) => sa("dewormingUpToDate", v)}
                    id="dew-ok"
                  />
                  <Label htmlFor="dew-ok">Vermifugação em dia</Label>
                </div>
                <div className="space-y-1.5">
                  <Label>Última vermifugação</Label>
                  <Input
                    type="date"
                    value={anamnesis.dewormingLastDate ?? ""}
                    onChange={(e) => sa("dewormingLastDate", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Controle de ectoparasitas</Label>
                  <Input
                    value={anamnesis.ectoparasiteControl ?? ""}
                    onChange={(e) => sa("ectoparasiteControl", e.target.value)}
                    placeholder="Ex: coleira Seresto, Bravecto..."
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={!!anamnesis.heartwormPrevention}
                    onCheckedChange={(v) => sa("heartwormPrevention", v)}
                    id="heart-ok"
                  />
                  <Label htmlFor="heart-ok">
                    Prevenção de filária / heartworm
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── HISTÓRICO MÉDICO ── */}
        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico Médico</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Doenças pré-existentes / anteriores</Label>
                <Textarea
                  value={anamnesis.previousDiseases ?? ""}
                  onChange={(e) => sa("previousDiseases", e.target.value)}
                  rows={3}
                  placeholder="Liste doenças diagnosticadas anteriormente..."
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Cirurgias realizadas</Label>
                <Textarea
                  value={anamnesis.previousSurgeries ?? ""}
                  onChange={(e) => sa("previousSurgeries", e.target.value)}
                  rows={2}
                  placeholder="Ex: castração (2022), exérese de nódulo..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Alergias conhecidas</Label>
                <Textarea
                  value={anamnesis.knownAllergies ?? ""}
                  onChange={(e) => sa("knownAllergies", e.target.value)}
                  rows={2}
                  placeholder="Alergias a medicamentos, alimentos, ambiente..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Condições crônicas</Label>
                <Textarea
                  value={anamnesis.chronicConditions ?? ""}
                  onChange={(e) => sa("chronicConditions", e.target.value)}
                  rows={2}
                  placeholder="Ex: diabetes, epilepsia, hipotireoidismo..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Medicações em uso contínuo</Label>
                <Textarea
                  value={anamnesis.currentMedications ?? ""}
                  onChange={(e) => sa("currentMedications", e.target.value)}
                  rows={2}
                  placeholder="Medicamentos de uso contínuo atual..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo sanguíneo</Label>
                <Input
                  value={anamnesis.bloodType ?? ""}
                  onChange={(e) => sa("bloodType", e.target.value)}
                  placeholder="Ex: DEA 1.1 positivo"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Histórico reprodutivo</Label>
                <Textarea
                  value={anamnesis.reproductiveHistory ?? ""}
                  onChange={(e) => sa("reproductiveHistory", e.target.value)}
                  rows={2}
                  placeholder="Ciclos de cio, gestações, partos, pseudociese..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── COMPORTAMENTO ── */}
        <TabsContent value="comportamento">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Comportamento e Observações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Temperamento</Label>
                <Select
                  value={anamnesis.temperament || "__none__"}
                  onValueChange={(v) =>
                    sa("temperament", v === "__none__" ? "" : v)
                  }
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Não informado</SelectItem>
                    <SelectItem value="docil">Dócil / Calmo</SelectItem>
                    <SelectItem value="agitado">
                      Agitado / Hiperativo
                    </SelectItem>
                    <SelectItem value="agressivo">Agressivo</SelectItem>
                    <SelectItem value="medroso">Medroso / Ansioso</SelectItem>
                    <SelectItem value="brincalhao">Brincalhão</SelectItem>
                    <SelectItem value="independente">Independente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Notas de comportamento</Label>
                <Textarea
                  value={anamnesis.behaviorNotes ?? ""}
                  onChange={(e) => sa("behaviorNotes", e.target.value)}
                  rows={3}
                  placeholder="Comportamentos específicos, medos, reações ao veterinário..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Observações clínicas gerais</Label>
                <Textarea
                  value={anamnesis.clinicalObservations ?? ""}
                  onChange={(e) => sa("clinicalObservations", e.target.value)}
                  rows={4}
                  placeholder="Observações relevantes para o atendimento clínico..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-2">
        <Link href={`/clientes/${clientId}`}>
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar Pet"}
        </Button>
      </div>
    </div>
  );
}
