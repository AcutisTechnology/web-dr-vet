export type SubscriptionStatus =
  | "trial"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";
export type SubscriptionPlan = "monthly" | "quarterly" | "annual";
export type TransactionStatus = "pending" | "paid" | "failed" | "expired";
export type PaymentMethod = "pix" | "card" | "boleto";

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  amount: number;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  is_on_trial: boolean;
  is_active: boolean;
  has_expired_trial: boolean;
  transactions: BillingTransaction[];
}

export interface BillingTransaction {
  id: string;
  amount: number;
  status: TransactionStatus;
  payment_method: PaymentMethod | null;
  payment_url: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface CreateSubscriptionPayload {
  plan?: SubscriptionPlan; // Optional since we only have one plan now
}

export interface CreatePaymentResponse {
  transaction_id: string;
  payment_url: string;
  amount: number;
}
