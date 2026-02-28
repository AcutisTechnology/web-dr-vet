export type ClinicType = "clinic" | "hospital" | "autonomous";
export type UserRole = "vet" | "attendant" | "financial" | "admin";

export interface AdditionalUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface RegFormData {
  clinicType: ClinicType | "";
  clinicName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerConfirmPassword: string;
  phone: string;
  city: string;
  state: string;
  hasAdditionalUsers: boolean | null;
  additionalUsers: AdditionalUser[];
}

export const ROLE_LABELS: Record<UserRole, string> = {
  vet: "Veterinário(a)",
  attendant: "Atendente / Recepcionista",
  financial: "Financeiro",
  admin: "Administrador",
};

export const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export const INITIAL_FORM: RegFormData = {
  clinicType: "",
  clinicName: "",
  ownerName: "",
  ownerEmail: "",
  ownerPassword: "",
  ownerConfirmPassword: "",
  phone: "",
  city: "",
  state: "",
  hasAdditionalUsers: null,
  additionalUsers: [],
};
