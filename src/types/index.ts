// ─── User / Auth ─────────────────────────────────────────────────────────────
export type UserRole = "admin" | "vet" | "attendant" | "financial";

export type AccountType =
  | "clinic_owner" // Dono/gestor da clínica (contratante)
  | "clinic_user" // Usuário vinculado a uma clínica
  | "autonomous"; // Veterinário autônomo (sem clínica)

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accountType: AccountType;
  clinicId?: string; // Referência à clínica (se clinic_owner ou clinic_user)
  clinicName?: string; // Nome da clínica (desnormalizado para exibição)
  avatar?: string;
  active: boolean;
  createdAt: string;
}

// ─── Clinic / Registration ────────────────────────────────────────────────────
export type ClinicType = "clinic" | "hospital" | "autonomous";

export interface ClinicUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface ClinicRegistration {
  id: string;
  clinicName: string;
  clinicType: ClinicType;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  phone: string;
  city: string;
  state: string;
  additionalUsers: ClinicUser[];
  createdAt: string;
}

// ─── Client ──────────────────────────────────────────────────────────────────
export interface Client {
  id: string;
  name: string;
  cpf?: string;
  email?: string;
  phone: string;
  address?: Address;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
}

// ─── Pet ─────────────────────────────────────────────────────────────────────
export type PetSpecies =
  | "dog"
  | "cat"
  | "bird"
  | "rabbit"
  | "reptile"
  | "other";
export type PetSex = "male" | "female";
export type PetStatus = "active" | "deceased";

export interface PetAnamnesis {
  // Queixa atual / sinais clínicos
  vomiting?: string; // nao, sim_agudo, sim_cronico, ocasional
  diarrhea?: string; // nao, sim_agudo, sim_cronico, ocasional
  eating?: string; // normal, aumentado, diminuido, nao_come
  drinking?: string; // normal, aumentado, diminuido, nao_bebe
  urination?: string; // normal, aumentado, diminuido, ausente, doloroso
  defecation?: string; // normal, aumentado, diminuido, ausente
  coughing?: string; // nao, ocasional, frequente, constante
  sneezing?: string; // nao, ocasional, frequente, constante
  dyspnea?: string; // nao, leve, moderada, grave
  nasalDischarge?: string; // nao, seroso, mucoso, purulento
  ocularDischarge?: string; // nao, seroso, mucoso, purulento
  pruritus?: string; // nao, leve, moderado, intenso
  skinLesions?: string; // nao, sim_localizado, sim_generalizado
  lameness?: string; // nao, leve, moderada, grave
  seizures?: string; // nao, historico, recente
  weightLoss?: string; // nao, leve, moderada, grave
  fatigue?: string; // nao, leve, moderada, grave
  complaintsNotes?: string; // texto livre complementar
  // Sistema neurológico
  ataxia?: string; // nao, leve, moderado, intenso
  tremors?: string; // nao, ocasional, frequente, constante
  mentalStatus?: string; // normal, deprimido, estuporoso, comatoso
  vestibularSigns?: string; // nao, sim
  // Olhos
  eyeDischarge?: string; // nao, seroso, mucoso, purulento, sanguinolento
  eyeRedness?: string; // nao, leve, moderado, intenso
  eyeOpacity?: string; // nao, sim_unilateral, sim_bilateral
  eyePain?: string; // nao, sim
  // Ouvido
  earDischarge?: string; // nao, seroso, marrom, purulento, sanguinolento
  earOdor?: string; // nao, leve, intenso
  earScratch?: string; // nao, ocasional, frequente, constante
  earAffected?: string; // nao, esquerdo, direito, bilateral
  // Ambiente e rotina
  environment?: string;
  housingType?: string;
  contactWithOtherAnimals?: boolean;
  contactWithWildAnimals?: boolean;
  walkFrequency?: string;
  // Alimentação
  foodType?: string;
  foodBrand?: string;
  feedingsPerDay?: number;
  waterSource?: string;
  // Preventivos
  vaccinationUpToDate?: boolean;
  vaccinationProtocol?: string;
  dewormingUpToDate?: boolean;
  dewormingLastDate?: string;
  ectoparasiteControl?: string;
  heartwormPrevention?: boolean;
  // Histórico médico
  previousDiseases?: string;
  previousSurgeries?: string;
  knownAllergies?: string;
  bloodType?: string;
  chronicConditions?: string;
  currentMedications?: string;
  reproductiveHistory?: string;
  // Comportamento
  temperament?: string;
  behaviorNotes?: string;
  // Observações clínicas gerais
  clinicalObservations?: string;
}

export interface Pet {
  id: string;
  clientId: string;
  name: string;
  species: PetSpecies;
  breed: string;
  sex: PetSex;
  birthDate?: string;
  color?: string;
  microchip?: string;
  neutered: boolean;
  status: PetStatus;
  weight?: number;
  notes?: string;
  anamnesis?: PetAnamnesis;
  photos: MediaFile[];
  createdAt: string;
  updatedAt: string;
}

export interface MediaFile {
  id: string;
  name: string;
  type: "image" | "video" | "document";
  url: string;
  size: number;
  uploadedAt: string;
}

// ─── Medical Events ───────────────────────────────────────────────────────────
export type MedicalEventType =
  | "consultation"
  | "vaccine"
  | "exam"
  | "prescription"
  | "observation"
  | "weight"
  | "surgery"
  | "return";

export interface MedicalEvent {
  id: string;
  petId: string;
  type: MedicalEventType;
  date: string;
  title: string;
  description?: string;
  vetId?: string;
  attachments?: MediaFile[];
  // vaccine specific
  vaccineProtocol?: string;
  vaccineNextDate?: string;
  vaccineStatus?: "active" | "paused" | "completed";
  // exam specific
  examResult?: string;
  // prescription specific
  prescriptionItems?: PrescriptionItem[];
  // weight specific
  weightKg?: number;
  // pathologies
  pathologies?: string[];
  createdAt: string;
}

export interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

// ─── Appointment ─────────────────────────────────────────────────────────────
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Appointment {
  id: string;
  petId: string;
  clientId: string;
  vetId?: string;
  serviceType: string;
  status: AppointmentStatus;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  notes?: string;
  recurring: boolean;
  recurringInterval?: "weekly" | "biweekly" | "monthly";
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Schedule Config ─────────────────────────────────────────────────────────
export interface ScheduleConfig {
  workingDays: number[]; // 0=Sun, 1=Mon...
  startTime: string; // "08:00"
  endTime: string; // "18:00"
  slotInterval: number; // minutes
  lunchStart?: string;
  lunchEnd?: string;
}

// ─── Staff Shift ──────────────────────────────────────────────────────────────
export interface Shift {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

// ─── Hospitalization ─────────────────────────────────────────────────────────
export type HospitalizationStatus =
  | "active"
  | "discharged"
  | "cancelled"
  | "deceased";

export interface Hospitalization {
  id: string;
  petId: string;
  clientId: string;
  vetId?: string;
  status: HospitalizationStatus;
  admissionDate: string;
  dischargeDate?: string;
  boxId?: string;
  reason: string;
  notes?: string;
  prescriptions: HospPrescription[];
  checklistItems: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MedAdministration {
  id: string;
  scheduledTime: string; // ISO – when it should be given
  administeredAt?: string; // ISO – when it was actually given
  administeredBy?: string; // user name or id
  notes?: string;
  status: "pending" | "done" | "late" | "skipped";
}

export interface HospPrescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  route?: string; // via de administração
  startDate: string;
  endDate?: string;
  active: boolean;
  notes?: string;
  administrations: MedAdministration[];
}

export interface ChecklistItem {
  id: string;
  prescriptionId?: string;
  description: string;
  scheduledTime: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

export interface Box {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

// ─── Product / Stock ─────────────────────────────────────────────────────────
export type ProductCategory =
  | "medicine"
  | "food"
  | "accessory"
  | "hygiene"
  | "vaccine"
  | "other";

export interface Product {
  id: string;
  name: string;
  sku?: string;
  category: ProductCategory;
  description?: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  expirationDate?: string;
  supplier?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StockMoveType = "in" | "out" | "adjustment" | "loss";

export interface StockMove {
  id: string;
  productId: string;
  type: StockMoveType;
  quantity: number;
  unitCost?: number;
  reason?: string;
  referenceId?: string; // sale or purchase id
  userId: string;
  createdAt: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────
export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration?: number; // minutes
  description?: string;
  active: boolean;
}

// ─── Sale / PDV ──────────────────────────────────────────────────────────────
export type SaleStatus = "open" | "completed" | "cancelled" | "refunded";
export type PaymentMethod =
  | "cash"
  | "credit_card"
  | "debit_card"
  | "pix"
  | "bank_slip"
  | "other";

export interface Sale {
  id: string;
  clientId?: string;
  petId?: string;
  status: SaleStatus;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  payments: Payment[];
  notes?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  type: "product" | "service" | "package";
  referenceId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Payment {
  id: string;
  method: PaymentMethod;
  amount: number;
  installments?: number;
  notes?: string;
}

// ─── Package ─────────────────────────────────────────────────────────────────
export interface Package {
  id: string;
  name: string;
  serviceId: string;
  totalSessions: number;
  price: number;
  validityDays: number;
  active: boolean;
  createdAt: string;
}

export interface PackageContract {
  id: string;
  packageId: string;
  clientId: string;
  petId?: string;
  purchasedAt: string;
  expiresAt: string;
  sessionsUsed: number;
  totalSessions: number;
  status: "active" | "expired" | "completed";
}

// ─── Finance ─────────────────────────────────────────────────────────────────
export type FinanceEntryType = "income" | "expense";
export type FinanceEntryStatus = "pending" | "paid" | "overdue" | "cancelled";

export interface FinanceEntry {
  id: string;
  type: FinanceEntryType;
  description: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: FinanceEntryStatus;
  categoryId: string;
  accountId?: string;
  paymentMethod?: PaymentMethod;
  referenceId?: string; // sale id
  petId?: string; // linked pet (for pet-level financial records)
  petFinanceType?:
    | "consultation"
    | "medication"
    | "medication_charge"
    | "medication_cost"
    | "material"
    | "fuel"
    | "exam_charge"
    | "exam_lab"; // category within pet finance
  fromSale?: boolean; // true = originated from PDV, read-only in pet finance
  notes?: string;
  recurring: boolean;
  recurringInterval?: "weekly" | "monthly" | "yearly";
  createdAt: string;
  updatedAt: string;
}

export interface FinanceCategory {
  id: string;
  name: string;
  type: FinanceEntryType;
  color?: string;
}

export interface FinanceAccount {
  id: string;
  name: string;
  type: "checking" | "savings" | "cash" | "credit_card";
  balance: number;
  active: boolean;
}

// ─── Invoice / Fiscal ────────────────────────────────────────────────────────
export type InvoiceType = "nfce" | "nfe" | "nfse";
export type InvoiceStatus = "draft" | "issued" | "cancelled" | "rejected";

export interface Invoice {
  id: string;
  type: InvoiceType;
  number?: string;
  saleId?: string;
  clientId?: string;
  status: InvoiceStatus;
  amount: number;
  issueDate?: string;
  cancelDate?: string;
  xmlUrl?: string;
  pdfUrl?: string;
  notes?: string;
  createdAt: string;
}

// ─── Consultation / Atendimento ──────────────────────────────────────────────
export type ConsultationStatus = "in_progress" | "completed" | "cancelled";

export interface ConsultationMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string; // oral, IM, IV, SC, tópico...
  notes?: string;
}

export interface ConsultationExam {
  id: string;
  name: string;
  type: "laboratorial" | "imagem" | "outro";
  urgent: boolean;
  notes?: string;
  result?: string;
  resultDate?: string;
}

export interface VitalSigns {
  weight?: number; // kg
  temperature?: number; // °C
  heartRate?: number; // bpm
  respiratoryRate?: number; // rpm
  bloodPressure?: string; // "120/80"
  spo2?: number; // %
  tpc?: string; // tempo de preenchimento capilar
  mucosa?: string;
  hydration?: string;
  lymphNodes?: string;
  pain?: number; // 0-10
}

export interface Consultation {
  id: string;
  appointmentId?: string;
  petId: string;
  clientId: string;
  vetId: string;
  status: ConsultationStatus;
  date: string;
  // Anamnese
  chiefComplaint: string; // queixa principal
  anamnesis?: string; // histórico / anamnese
  currentMedications?: string; // medicações em uso
  allergies?: string;
  feedingInfo?: string;
  // Exame físico
  vitalSigns?: VitalSigns;
  physicalExam?: string; // achados do exame físico geral
  systemsReview?: string; // revisão por sistemas
  // Diagnóstico
  suspectedDiagnosis?: string;
  confirmedDiagnosis?: string;
  differentialDiagnosis?: string;
  prognosis?: "good" | "fair" | "guarded" | "poor";
  // Conduta
  medications: ConsultationMedication[];
  requestedExams: ConsultationExam[];
  procedures?: string; // procedimentos realizados
  treatmentPlan?: string;
  returnDate?: string;
  // Observações
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Messages / WhatsApp ─────────────────────────────────────────────────────
export type MessageTemplateType =
  | "welcome"
  | "appointment_confirmation"
  | "appointment_reminder"
  | "vaccine_reminder"
  | "exam_result"
  | "birthday"
  | "daily_agenda"
  | "custom";

export interface MessageTemplate {
  id: string;
  name: string;
  type: MessageTemplateType;
  content: string;
  active: boolean;
  scheduledTime?: string; // "HH:mm" for daily
  triggerDaysBefore?: number;
  createdAt: string;
  updatedAt: string;
}

export type MessageStatus =
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "scheduled";

export interface MessageLog {
  id: string;
  templateId?: string;
  clientId?: string;
  petId?: string;
  phone: string;
  content: string;
  status: MessageStatus;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

export interface WhatsAppConfig {
  connected: boolean;
  phone?: string;
  credits: number;
  lastSync?: string;
}
