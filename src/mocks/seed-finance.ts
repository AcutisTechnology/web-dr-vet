import type { FinanceEntry, FinanceCategory, FinanceAccount, Invoice, MessageTemplate, MessageLog, WhatsAppConfig } from "@/types";

const now = new Date();
const d = (offsetDays: number) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() + offsetDays);
  return dt.toISOString();
};

export const seedFinanceCategories: FinanceCategory[] = [
  { id: "fc1", name: "Consultas e Serviços", type: "income", color: "#22c55e" },
  { id: "fc2", name: "Vendas de Produtos", type: "income", color: "#16a34a" },
  { id: "fc3", name: "Internação", type: "income", color: "#15803d" },
  { id: "fc4", name: "Pacotes", type: "income", color: "#166534" },
  { id: "fc5", name: "Salários", type: "expense", color: "#ef4444" },
  { id: "fc6", name: "Aluguel", type: "expense", color: "#dc2626" },
  { id: "fc7", name: "Compra de Produtos", type: "expense", color: "#b91c1c" },
  { id: "fc8", name: "Energia/Água", type: "expense", color: "#f97316" },
  { id: "fc9", name: "Manutenção", type: "expense", color: "#ea580c" },
  { id: "fc10", name: "Outros", type: "expense", color: "#6b7280" },
];

export const seedFinanceAccounts: FinanceAccount[] = [
  { id: "fa1", name: "Conta Corrente Bradesco", type: "checking", balance: 15420.50, active: true },
  { id: "fa2", name: "Caixa Físico", type: "cash", balance: 850.00, active: true },
  { id: "fa3", name: "Cartão Empresarial", type: "credit_card", balance: -2300.00, active: true },
];

export const seedFinanceEntries: FinanceEntry[] = [
  { id: "fe1", type: "income", description: "Consultas - Maria Silva", amount: 239.80, dueDate: d(-5), paidDate: d(-5), status: "paid", categoryId: "fc1", accountId: "fa1", paymentMethod: "credit_card", referenceId: "s1", recurring: false, createdAt: d(-5), updatedAt: d(-5) },
  { id: "fe2", type: "income", description: "Vendas - João Pereira", amount: 179.80, dueDate: d(-3), paidDate: d(-3), status: "paid", categoryId: "fc2", accountId: "fa1", paymentMethod: "pix", referenceId: "s2", recurring: false, createdAt: d(-3), updatedAt: d(-3) },
  { id: "fe3", type: "income", description: "Vacinação - Carla Rodrigues", amount: 90.00, dueDate: d(-1), paidDate: d(-1), status: "paid", categoryId: "fc1", accountId: "fa2", paymentMethod: "cash", referenceId: "s3", recurring: false, createdAt: d(-1), updatedAt: d(-1) },
  { id: "fe4", type: "income", description: "Vendas PDV", amount: 69.90, dueDate: d(0), paidDate: d(0), status: "paid", categoryId: "fc2", accountId: "fa2", paymentMethod: "debit_card", referenceId: "s4", recurring: false, createdAt: d(0), updatedAt: d(0) },
  { id: "fe5", type: "income", description: "Consulta - Lucia Ferreira", amount: 120.00, dueDate: d(-7), paidDate: d(-7), status: "paid", categoryId: "fc1", accountId: "fa1", paymentMethod: "pix", referenceId: "s5", recurring: false, createdAt: d(-7), updatedAt: d(-7) },
  { id: "fe6", type: "income", description: "Internação Rex - diária", amount: 240.00, dueDate: d(0), status: "pending", categoryId: "fc3", accountId: "fa1", recurring: false, createdAt: d(-3), updatedAt: d(-3) },
  { id: "fe7", type: "expense", description: "Aluguel Clínica", amount: 3500.00, dueDate: d(5), status: "pending", categoryId: "fc6", accountId: "fa1", recurring: true, recurringInterval: "monthly", createdAt: d(-25), updatedAt: d(-25) },
  { id: "fe8", type: "expense", description: "Salário Dr. Carlos", amount: 8000.00, dueDate: d(3), status: "pending", categoryId: "fc5", accountId: "fa1", recurring: true, recurringInterval: "monthly", createdAt: d(-25), updatedAt: d(-25) },
  { id: "fe9", type: "expense", description: "Salário Dra. Ana", amount: 7500.00, dueDate: d(3), status: "pending", categoryId: "fc5", accountId: "fa1", recurring: true, recurringInterval: "monthly", createdAt: d(-25), updatedAt: d(-25) },
  { id: "fe10", type: "expense", description: "Compra Ração PetFood", amount: 1200.00, dueDate: d(-10), paidDate: d(-10), status: "paid", categoryId: "fc7", accountId: "fa1", paymentMethod: "bank_slip", recurring: false, createdAt: d(-10), updatedAt: d(-10) },
  { id: "fe11", type: "expense", description: "Energia Elétrica", amount: 680.00, dueDate: d(-2), paidDate: d(-2), status: "paid", categoryId: "fc8", accountId: "fa1", paymentMethod: "bank_slip", recurring: true, recurringInterval: "monthly", createdAt: d(-2), updatedAt: d(-2) },
  { id: "fe12", type: "expense", description: "Manutenção equipamentos", amount: 350.00, dueDate: d(-15), paidDate: d(-15), status: "paid", categoryId: "fc9", accountId: "fa2", paymentMethod: "cash", recurring: false, createdAt: d(-15), updatedAt: d(-15) },
  { id: "fe13", type: "expense", description: "Compra vacinas Zoetis", amount: 860.00, dueDate: d(-8), paidDate: d(-8), status: "paid", categoryId: "fc7", accountId: "fa1", paymentMethod: "pix", recurring: false, createdAt: d(-8), updatedAt: d(-8) },
  { id: "fe14", type: "income", description: "Pacote Banho - Maria Silva", amount: 270.00, dueDate: d(-30), paidDate: d(-30), status: "paid", categoryId: "fc4", accountId: "fa1", paymentMethod: "credit_card", recurring: false, createdAt: d(-30), updatedAt: d(-30) },
  { id: "fe15", type: "expense", description: "Água/Saneamento", amount: 180.00, dueDate: d(8), status: "pending", categoryId: "fc8", accountId: "fa1", recurring: true, recurringInterval: "monthly", createdAt: d(-20), updatedAt: d(-20) },
];

export const seedInvoices: Invoice[] = [
  { id: "inv1", type: "nfce", number: "000001", saleId: "s1", clientId: "c1", status: "issued", amount: 239.80, issueDate: d(-5), createdAt: d(-5) },
  { id: "inv2", type: "nfce", number: "000002", saleId: "s2", clientId: "c2", status: "issued", amount: 179.80, issueDate: d(-3), createdAt: d(-3) },
  { id: "inv3", type: "nfce", number: "000003", saleId: "s3", clientId: "c3", status: "issued", amount: 90.00, issueDate: d(-1), createdAt: d(-1) },
  { id: "inv4", type: "nfce", number: "000004", saleId: "s4", status: "issued", amount: 69.90, issueDate: d(0), createdAt: d(0) },
  { id: "inv5", type: "nfse", number: "000001", clientId: "c1", status: "issued", amount: 120.00, issueDate: d(-7), createdAt: d(-7) },
  { id: "inv6", type: "nfe", number: "000001", status: "draft", amount: 860.00, createdAt: d(-8) },
  { id: "inv7", type: "nfce", status: "cancelled", amount: 50.00, issueDate: d(-20), cancelDate: d(-19), createdAt: d(-20) },
];

export const seedMessageTemplates: MessageTemplate[] = [
  { id: "mt1", name: "Boas-vindas", type: "welcome", content: "Olá {{nome}}! Seja bem-vindo(a) à VetDom! Estamos felizes em ter você e {{pet}} como nossos clientes. Qualquer dúvida, estamos à disposição!", active: true, createdAt: d(-100), updatedAt: d(-100) },
  { id: "mt2", name: "Confirmação de Agendamento", type: "appointment_confirmation", content: "Olá {{nome}}! Confirmamos o agendamento de {{servico}} para {{pet}} no dia {{data}} às {{hora}}. Em caso de dúvidas, entre em contato.", active: true, createdAt: d(-100), updatedAt: d(-100) },
  { id: "mt3", name: "Lembrete de Consulta", type: "appointment_reminder", content: "Olá {{nome}}! Lembramos que amanhã, {{data}} às {{hora}}, está agendado {{servico}} para {{pet}}. Confirme sua presença respondendo SIM.", active: true, triggerDaysBefore: 1, createdAt: d(-100), updatedAt: d(-100) },
  { id: "mt4", name: "Lembrete de Vacina", type: "vaccine_reminder", content: "Olá {{nome}}! A vacina {{vacina}} de {{pet}} está vencendo em {{data}}. Agende agora pelo nosso sistema!", active: true, triggerDaysBefore: 7, createdAt: d(-100), updatedAt: d(-100) },
  { id: "mt5", name: "Resultado de Exame", type: "exam_result", content: "Olá {{nome}}! O resultado do exame de {{pet}} já está disponível. Entre em contato para mais informações.", active: true, createdAt: d(-100), updatedAt: d(-100) },
  { id: "mt6", name: "Aniversário do Pet", type: "birthday", content: "Feliz aniversário para {{pet}}! 🎂🐾 A VetDom deseja muita saúde e felicidade ao seu companheiro especial!", active: true, scheduledTime: "09:00", createdAt: d(-100), updatedAt: d(-100) },
  { id: "mt7", name: "Agenda Diária", type: "daily_agenda", content: "Bom dia, {{nome}}! Sua agenda de hoje: {{agenda}}. Tenha um ótimo dia!", active: false, scheduledTime: "07:30", createdAt: d(-100), updatedAt: d(-100) },
];

export const seedMessageLogs: MessageLog[] = [
  { id: "ml1", templateId: "mt2", clientId: "c1", petId: "p1", phone: "(11) 98765-4321", content: "Olá Maria! Confirmamos o agendamento de Consulta para Bolinha no dia 20/02 às 09:00.", status: "read", sentAt: d(-3), createdAt: d(-3) },
  { id: "ml2", templateId: "mt3", clientId: "c2", petId: "p3", phone: "(11) 91234-5678", content: "Olá João! Lembramos que amanhã, 20/02 às 10:00, está agendado Consulta para Rex.", status: "delivered", sentAt: d(-1), createdAt: d(-1) },
  { id: "ml3", templateId: "mt4", clientId: "c1", petId: "p1", phone: "(11) 98765-4321", content: "Olá Maria! A vacina V10 de Bolinha está vencendo em 27/02. Agende agora!", status: "sent", sentAt: d(0), createdAt: d(0) },
  { id: "ml4", templateId: "mt6", clientId: "c3", petId: "p4", phone: "(11) 99876-5432", content: "Feliz aniversário para Luna! 🎂🐾 A VetDom deseja muita saúde!", status: "read", sentAt: d(-5), createdAt: d(-5) },
  { id: "ml5", templateId: "mt5", clientId: "c1", petId: "p1", phone: "(11) 98765-4321", content: "Olá Maria! O resultado do exame de Bolinha já está disponível.", status: "failed", sentAt: d(-15), createdAt: d(-15) },
  { id: "ml6", templateId: "mt2", clientId: "c5", petId: "p6", phone: "(11) 96543-2109", content: "Olá Lucia! Confirmamos o agendamento de Vacinação para Thor no dia 21/02 às 09:30.", status: "delivered", sentAt: d(-2), createdAt: d(-2) },
];

export const seedWhatsAppConfig: WhatsAppConfig = {
  connected: true,
  phone: "(11) 3456-7890",
  credits: 342,
  lastSync: new Date().toISOString(),
};
