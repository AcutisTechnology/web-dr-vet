export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  account_type: string;
  clinic_id: string | null;
  phone: string | null;
  avatar: string | null;
  active: boolean;
  clinic: ApiClinic | null;
  created_at: string;
  updated_at: string;
}

export interface ApiClinic {
  id: string;
  name: string;
  type: string;
  phone: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  data: {
    user: ApiUser;
    token: string;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone: string;
  clinic_type: "clinic" | "hospital" | "autonomous";
  clinic_name?: string;
  address?: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// ─── Client ───────────────────────────────────────────────────────────────────
export interface ApiClient {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  cpf: string | null;
  active: boolean;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
  } | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Pet ──────────────────────────────────────────────────────────────────────
export interface ApiPet {
  id: string;
  name: string;
  species: string;
  breed: string;
  sex: string | null;
  neutered: boolean;
  status: string;
  birth_date: string | null;
  weight: number | null;
  color: string | null;
  microchip: string | null;
  notes: string | null;
  anamnesis: Record<string, unknown> | null;
  client?: ApiClient;
  media_files?: ApiMediaFile[];
  created_at: string;
  updated_at: string;
}

export interface ApiMediaFile {
  id: string;
  name: string;
  url: string;
  size: number;
  mime_type: string;
  created_at: string;
}

// ─── Appointment ──────────────────────────────────────────────────────────────
export interface ApiAppointment {
  id: string;
  pet_id: string;
  client_id: string;
  vet_id: string | null;
  service_type: string;
  status: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  notes: string | null;
  recurring: boolean;
  recurring_interval: string | null;
  observations: string | null;
  pet?: ApiPet;
  client?: ApiClient;
  vet?: ApiUser;
  created_at: string;
  updated_at: string;
}

export interface ApiMedicalEvent {
  id: string;
  pet_id?: string;
  type: string;
  date: string;
  description: string | null;
  vital_signs: string | null;
  medications: string | null;
  exams: string | null;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
  pet?: ApiPet;
  vet?: ApiUser;
  created_at: string;
  updated_at: string;
}

export interface StoreMedicalEventPayload {
  pet_id: string;
  type: string;
  date: string;
  description?: string;
  vital_signs?: string;
  medications?: string;
  exams?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
}

export interface StoreClientPayload {
  name: string;
  email?: string;
  phone: string;
  cpf?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
}

export interface StorePetPayload {
  client_id?: string;
  name?: string;
  species?: string;
  breed?: string;
  sex?: string;
  birth_date?: string;
  weight?: number;
  color?: string;
  microchip?: string;
  notes?: string;
  neutered?: boolean;
  status?: string;
}

export interface StoreAppointmentPayload {
  pet_id: string;
  client_id: string;
  vet_id?: string;
  service_type: string;
  status?: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  notes?: string;
  recurring?: boolean;
  recurring_interval?: "weekly" | "biweekly" | "monthly";
  observations?: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface ApiDashboardStats {
  today_appointments: {
    total: number;
    scheduled: number;
    confirmed: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    list: Array<{
      id: string;
      date: string;
      start_time: string;
      end_time: string;
      service_type: string;
      status: string;
      pet: { id: string; name: string } | null;
      client: { id: string; name: string } | null;
      vet: { id: string; name: string } | null;
    }>;
  };
  low_stock_products: {
    total: number;
    list: Array<{
      id: string;
      name: string;
      stock: number;
      min_stock: number;
      unit: string;
    }>;
  };
  today_sales: {
    total: number;
    revenue: number;
  };
  active_hospitalizations: {
    total: number;
    list: Array<{
      id: string;
      admission_date: string;
      status: string;
      pet: { id: string; name: string } | null;
      box: { id: string; name: string } | null;
    }>;
  };
  total_clients: number;
  weekly_sales: Array<{ date: string; total: number; count: number }>;
  weekly_appointments: Array<{ date: string; count: number }>;
  services_breakdown: Array<{ name: string; value: number }>;
}

export interface ApiBox {
  id: string;
  name: string;
  size: string | null;
  location: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiMedAdministration {
  id: string;
  hosp_prescription_id: string;
  scheduled_time: string;
  administered_at: string | null;
  administered_by: string | null;
  notes: string | null;
  status: "pending" | "done" | "late" | "skipped";
  created_at: string;
  updated_at: string;
}

export interface ApiChecklistItem {
  id: string;
  hospitalization_id: string;
  description: string;
  frequency: string;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiHospPrescription {
  id: string;
  hospitalization_id: string;
  medication: string;
  dosage: string;
  frequency: string;
  route: string | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  administrations?: ApiMedAdministration[];
  created_at: string;
  updated_at: string;
}

export interface ApiHospitalization {
  id: string;
  pet_id: string;
  client_id: string;
  vet_id: string | null;
  status: "active" | "discharged" | "cancelled" | "deceased";
  admission_date: string;
  discharge_date: string | null;
  box_id: string | null;
  reason: string;
  notes: string | null;
  pet?: ApiPet;
  client?: ApiClient;
  box?: ApiBox;
  vet?: ApiUser;
  prescriptions?: ApiHospPrescription[];
  checklistItems?: ApiChecklistItem[];
  created_at: string;
  updated_at: string;
}

export interface StoreHospitalizationPayload {
  pet_id: string;
  client_id?: string;
  vet_id?: string;
  box_id?: string;
  status?: string;
  admission_date?: string;
  discharge_date?: string;
  reason: string;
  notes?: string;
}

export interface ApiPaginatedResponse<T> {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
