import type { AccountType } from "./index";
import type { SubscriptionPlan, SubscriptionStatus } from "./subscription";

export interface AdminSubscriptionDetails {
  id: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  amount: number;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
}

export type AdminSubscriptionAction = "activate" | "extend_trial" | "deactivate";

export interface AdminClinicAccount {
  id: string;
  clinicName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  accountType: AccountType;
  plan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  monthlyRevenue: number;
  usersCount: number;
  clientsCount: number;
  petsCount: number;
  createdAt: string;
  lastActivityAt: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  subscription?: AdminSubscriptionDetails | null;
}

export interface AdminOverviewTotals {
  totalAccounts: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  attentionSubscriptions: number;
  totalClients: number;
  totalPets: number;
}

export interface AdminOverviewInsights {
  expiringTrials: number;
  inactiveAccounts: number;
  highUsageAccounts: number;
  monthlyRecurringRevenue: number;
}

export interface AdminOverview {
  totals: AdminOverviewTotals;
  insights: AdminOverviewInsights;
  accounts: AdminClinicAccount[];
}

export interface AdminAccountClient {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  petsCount: number;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminAccountUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  accountType: string;
  active: boolean;
  isPlatformAdmin: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminAccountPet {
  id: string;
  name: string;
  clientName: string;
  species: string;
  breed: string;
  status: string;
  examEventsCount: number;
  hasExamUsage: boolean;
  lastExamAt: string | null;
  updatedAt: string | null;
}

export interface AdminAccountDetailSummary {
  activeUsersCount: number;
  petsWithExamUsageCount: number;
  totalExamEventsCount: number;
}

export interface AdminAccountDetail {
  account: AdminClinicAccount;
  summary: AdminAccountDetailSummary;
  users: AdminAccountUser[];
  clients: AdminAccountClient[];
  pets: AdminAccountPet[];
}
