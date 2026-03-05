import type { ApiFinanceEntry } from "@/services/finance.service";
import type { FinanceEntry, PaymentMethod } from "@/types";

export function adaptApiFinanceEntryToFinanceEntry(
  apiEntry: ApiFinanceEntry,
): FinanceEntry {
  return {
    id: apiEntry.id,
    type: apiEntry.type,
    description: apiEntry.description,
    amount:
      typeof apiEntry.amount === "string"
        ? parseFloat(apiEntry.amount)
        : apiEntry.amount,
    dueDate: apiEntry.due_date,
    paidDate: apiEntry.paid_date ?? undefined,
    status: apiEntry.status,
    categoryId: apiEntry.category_id,
    accountId: apiEntry.account_id,
    paymentMethod: apiEntry.payment_method as PaymentMethod | undefined,
    petId: apiEntry.pet_id ?? undefined,
    petFinanceType: apiEntry.pet_finance_type as any,
    fromSale: apiEntry.from_sale ?? false,
    notes: apiEntry.notes ?? undefined,
    recurring:
      typeof apiEntry.recurring === "string"
        ? apiEntry.recurring === "true" || apiEntry.recurring === "1"
        : !!apiEntry.recurring,
    createdAt: apiEntry.created_at,
    updatedAt: apiEntry.updated_at,
  };
}
