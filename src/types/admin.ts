import type { AccountType } from "./index";
import type { SubscriptionPlan, SubscriptionStatus } from "./subscription";

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
