import { sleep, generateId } from "@/lib/utils";
import { seedUsers } from "./seed-users";
import { seedClients, seedPets, seedMedicalEvents } from "./seed-clients";
import {
  seedAppointments,
  seedShifts,
  seedBoxes,
  seedHospitalizations,
} from "./seed-appointments";
import {
  seedProducts,
  seedStockMoves,
  seedServices,
  seedSales,
  seedPackages,
  seedPackageContracts,
} from "./seed-commerce";
import {
  seedFinanceCategories,
  seedFinanceAccounts,
  seedFinanceEntries,
  seedInvoices,
  seedMessageTemplates,
  seedMessageLogs,
  seedWhatsAppConfig,
} from "./seed-finance";
import type {
  User,
  Client,
  Pet,
  MedicalEvent,
  Appointment,
  Shift,
  Box,
  Hospitalization,
  Product,
  StockMove,
  Service,
  Sale,
  Package,
  PackageContract,
  FinanceEntry,
  FinanceCategory,
  FinanceAccount,
  Invoice,
  MessageTemplate,
  MessageLog,
  WhatsAppConfig,
  Consultation,
} from "@/types";

const LATENCY = 300;

// ─── In-memory store ──────────────────────────────────────────────────────────
type ArrayStore = {
  users: User[];
  clients: Client[];
  pets: Pet[];
  medicalEvents: MedicalEvent[];
  appointments: Appointment[];
  shifts: Shift[];
  boxes: Box[];
  hospitalizations: Hospitalization[];
  products: Product[];
  stockMoves: StockMove[];
  services: Service[];
  sales: Sale[];
  packages: Package[];
  packageContracts: PackageContract[];
  financeCategories: FinanceCategory[];
  financeAccounts: FinanceAccount[];
  financeEntries: FinanceEntry[];
  invoices: Invoice[];
  messageTemplates: MessageTemplate[];
  messageLogs: MessageLog[];
  consultations: Consultation[];
};

const store: ArrayStore = {
  users: [...seedUsers],
  clients: [...seedClients],
  pets: [...seedPets],
  medicalEvents: [...seedMedicalEvents],
  appointments: [...seedAppointments],
  shifts: [...seedShifts],
  boxes: [...seedBoxes],
  hospitalizations: [...seedHospitalizations],
  products: [...seedProducts],
  stockMoves: [...seedStockMoves],
  services: [...seedServices],
  sales: [...seedSales],
  packages: [...seedPackages],
  packageContracts: [...seedPackageContracts],
  financeCategories: [...seedFinanceCategories],
  financeAccounts: [...seedFinanceAccounts],
  financeEntries: [...seedFinanceEntries],
  invoices: [...seedInvoices],
  messageTemplates: [...seedMessageTemplates],
  messageLogs: [...seedMessageLogs],
  consultations: [],
};

let whatsAppConfigStore: WhatsAppConfig = { ...seedWhatsAppConfig };

// ─── Generic CRUD factory ─────────────────────────────────────────────────────
function makeCrud<
  T extends { id: string; createdAt?: string; updatedAt?: string },
>(key: keyof ArrayStore) {
  const col = () => store[key] as unknown as T[];

  return {
    async findAll(): Promise<T[]> {
      await sleep(LATENCY);
      return [...col()];
    },
    async findById(id: string): Promise<T | undefined> {
      await sleep(LATENCY);
      return col().find((x) => x.id === id);
    },
    async findWhere(predicate: (item: T) => boolean): Promise<T[]> {
      await sleep(LATENCY);
      return col().filter(predicate);
    },
    async create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
      await sleep(LATENCY);
      const now = new Date().toISOString();
      const item = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      } as T;
      (store[key] as unknown as T[]).push(item);
      return item;
    },
    async update(id: string, data: Partial<T>): Promise<T | undefined> {
      await sleep(LATENCY);
      const idx = col().findIndex((x) => x.id === id);
      if (idx === -1) return undefined;
      const updated = {
        ...col()[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      } as T;
      (store[key] as unknown as T[])[idx] = updated;
      return updated;
    },
    async delete(id: string): Promise<boolean> {
      await sleep(LATENCY);
      const idx = col().findIndex((x) => x.id === id);
      if (idx === -1) return false;
      (store[key] as unknown as T[]).splice(idx, 1);
      return true;
    },
  };
}

// ─── Exported services ────────────────────────────────────────────────────────
export const usersDb = makeCrud<User>("users");
export const clientsDb = makeCrud<Client>("clients");
export const petsDb = makeCrud<Pet>("pets");
export const medicalEventsDb = makeCrud<MedicalEvent>("medicalEvents");
export const appointmentsDb = makeCrud<Appointment>("appointments");
export const shiftsDb = makeCrud<Shift>("shifts");
export const boxesDb = makeCrud<Box>("boxes");
export const hospitalizationsDb = makeCrud<Hospitalization>("hospitalizations");
export const productsDb = makeCrud<Product>("products");
export const stockMovesDb = makeCrud<StockMove>("stockMoves");
export const servicesDb = makeCrud<Service>("services");
export const salesDb = makeCrud<Sale>("sales");
export const packagesDb = makeCrud<Package>("packages");
export const packageContractsDb = makeCrud<PackageContract>("packageContracts");
export const financeCategoriesDb =
  makeCrud<FinanceCategory>("financeCategories");
export const financeAccountsDb = makeCrud<FinanceAccount>("financeAccounts");
export const financeEntriesDb = makeCrud<FinanceEntry>("financeEntries");
export const invoicesDb = makeCrud<Invoice>("invoices");
export const messageTemplatesDb = makeCrud<MessageTemplate>("messageTemplates");
export const messageLogsDb = makeCrud<MessageLog>("messageLogs");
export const consultationsDb = makeCrud<Consultation>("consultations");

export const whatsAppConfigDb = {
  async get(): Promise<WhatsAppConfig> {
    await sleep(LATENCY);
    return { ...whatsAppConfigStore };
  },
  async update(data: Partial<WhatsAppConfig>): Promise<WhatsAppConfig> {
    await sleep(LATENCY);
    whatsAppConfigStore = { ...whatsAppConfigStore, ...data };
    return { ...whatsAppConfigStore };
  },
};

// ─── Invoice counter (for plan limits) ───────────────────────────────────────
export const MONTHLY_INVOICE_LIMIT = 80;
export function getMonthlyInvoiceCount(type: "nfce" | "nfe" | "nfse"): number {
  const now = new Date();
  return store.invoices.filter((inv) => {
    if (inv.type !== type) return false;
    if (!inv.issueDate) return false;
    const d = new Date(inv.issueDate);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;
}
