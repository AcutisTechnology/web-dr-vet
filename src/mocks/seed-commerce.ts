import type { Product, StockMove, Service, Sale, Package, PackageContract } from "@/types";

const now = new Date();
const d = (offsetDays: number) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() + offsetDays);
  return dt.toISOString();
};

export const seedProducts: Product[] = [
  { id: "pr1", name: "Ração Premium Adulto 15kg", sku: "RAC001", category: "food", unit: "un", costPrice: 120, salePrice: 189.90, stock: 25, minStock: 5, supplier: "PetFood Dist.", active: true, createdAt: d(-200), updatedAt: d(-5) },
  { id: "pr2", name: "Ração Filhote 3kg", sku: "RAC002", category: "food", unit: "un", costPrice: 45, salePrice: 69.90, stock: 3, minStock: 5, supplier: "PetFood Dist.", active: true, createdAt: d(-200), updatedAt: d(-2) },
  { id: "pr3", name: "Shampoo Neutro 500ml", sku: "SHM001", category: "hygiene", unit: "un", costPrice: 12, salePrice: 24.90, stock: 18, minStock: 5, active: true, createdAt: d(-150), updatedAt: d(-10) },
  { id: "pr4", name: "Antipulgas Frontline Plus", sku: "ANT001", category: "medicine", unit: "un", costPrice: 35, salePrice: 59.90, stock: 2, minStock: 10, expirationDate: "2026-06-30", supplier: "Merial", active: true, createdAt: d(-100), updatedAt: d(-1) },
  { id: "pr5", name: "Vacina V10", sku: "VAC001", category: "vaccine", unit: "dose", costPrice: 28, salePrice: 55.00, stock: 12, minStock: 5, expirationDate: "2025-12-31", supplier: "Zoetis", active: true, createdAt: d(-100), updatedAt: d(-3) },
  { id: "pr6", name: "Vacina Antirrábica", sku: "VAC002", category: "vaccine", unit: "dose", costPrice: 15, salePrice: 35.00, stock: 8, minStock: 5, expirationDate: "2025-10-15", supplier: "Zoetis", active: true, createdAt: d(-100), updatedAt: d(-3) },
  { id: "pr7", name: "Coleira Antipulgas M", sku: "COL001", category: "accessory", unit: "un", costPrice: 22, salePrice: 45.00, stock: 7, minStock: 3, active: true, createdAt: d(-80), updatedAt: d(-15) },
  { id: "pr8", name: "Tramadol 50mg (cx 30cp)", sku: "MED001", category: "medicine", unit: "cx", costPrice: 18, salePrice: 38.00, stock: 4, minStock: 5, expirationDate: "2026-03-31", supplier: "Farmácia Vet", active: true, createdAt: d(-60), updatedAt: d(-2) },
  { id: "pr9", name: "Dipirona Veterinária 500mg", sku: "MED002", category: "medicine", unit: "cx", costPrice: 8, salePrice: 18.00, stock: 15, minStock: 5, expirationDate: "2026-08-31", active: true, createdAt: d(-60), updatedAt: d(-5) },
  { id: "pr10", name: "Cama Pet G", sku: "ACC001", category: "accessory", unit: "un", costPrice: 65, salePrice: 129.90, stock: 3, minStock: 2, active: true, createdAt: d(-120), updatedAt: d(-20) },
  { id: "pr11", name: "Areia Higiênica 4kg", sku: "HIG001", category: "hygiene", unit: "un", costPrice: 18, salePrice: 32.90, stock: 20, minStock: 8, active: true, createdAt: d(-90), updatedAt: d(-7) },
  { id: "pr12", name: "Brinquedo Mordedor", sku: "BRQ001", category: "accessory", unit: "un", costPrice: 10, salePrice: 22.90, stock: 1, minStock: 3, active: true, createdAt: d(-60), updatedAt: d(-3) },
];

export const seedStockMoves: StockMove[] = [
  { id: "sm1", productId: "pr1", type: "in", quantity: 10, unitCost: 120, reason: "Compra fornecedor", userId: "u4", createdAt: d(-10) },
  { id: "sm2", productId: "pr4", type: "out", quantity: 3, reason: "Venda", referenceId: "s1", userId: "u3", createdAt: d(-5) },
  { id: "sm3", productId: "pr2", type: "out", quantity: 2, reason: "Venda", referenceId: "s2", userId: "u3", createdAt: d(-3) },
  { id: "sm4", productId: "pr8", type: "out", quantity: 1, reason: "Internação", referenceId: "h1", userId: "u1", createdAt: d(-3) },
  { id: "sm5", productId: "pr5", type: "out", quantity: 2, reason: "Vacinação", userId: "u2", createdAt: d(-2) },
  { id: "sm6", productId: "pr3", type: "in", quantity: 20, unitCost: 12, reason: "Compra fornecedor", userId: "u4", createdAt: d(-15) },
  { id: "sm7", productId: "pr9", type: "in", quantity: 10, unitCost: 8, reason: "Compra fornecedor", userId: "u4", createdAt: d(-20) },
  { id: "sm8", productId: "pr12", type: "loss", quantity: 2, reason: "Avaria", userId: "u3", createdAt: d(-7) },
];

export const seedServices: Service[] = [
  { id: "sv1", name: "Consulta Clínica", category: "Clínica", price: 120.00, duration: 30, active: true },
  { id: "sv2", name: "Banho e Tosa Pequeno", category: "Estética", price: 60.00, duration: 90, active: true },
  { id: "sv3", name: "Banho e Tosa Médio", category: "Estética", price: 80.00, duration: 90, active: true },
  { id: "sv4", name: "Banho e Tosa Grande", category: "Estética", price: 110.00, duration: 120, active: true },
  { id: "sv5", name: "Vacinação V10", category: "Vacinas", price: 55.00, duration: 15, active: true },
  { id: "sv6", name: "Vacinação Antirrábica", category: "Vacinas", price: 35.00, duration: 15, active: true },
  { id: "sv7", name: "Hemograma", category: "Exames", price: 85.00, duration: 15, active: true },
  { id: "sv8", name: "Raio-X", category: "Exames", price: 150.00, duration: 30, active: true },
  { id: "sv9", name: "Castração Felino", category: "Cirurgia", price: 350.00, duration: 120, active: true },
  { id: "sv10", name: "Castração Canino P", category: "Cirurgia", price: 450.00, duration: 150, active: true },
  { id: "sv11", name: "Internação Diária", category: "Internação", price: 80.00, active: true },
  { id: "sv12", name: "Aplicação de Medicamento", category: "Clínica", price: 25.00, duration: 10, active: true },
];

export const seedSales: Sale[] = [
  { id: "s1", clientId: "c1", petId: "p1", status: "completed", items: [{ id: "si1", type: "service", referenceId: "sv1", name: "Consulta Clínica", quantity: 1, unitPrice: 120, discount: 0, total: 120 }, { id: "si2", type: "product", referenceId: "pr4", name: "Antipulgas Frontline Plus", quantity: 2, unitPrice: 59.90, discount: 0, total: 119.80 }], subtotal: 239.80, discount: 0, total: 239.80, payments: [{ id: "pay1", method: "credit_card", amount: 239.80, installments: 2 }], userId: "u3", createdAt: d(-5), updatedAt: d(-5) },
  { id: "s2", clientId: "c2", petId: "p3", status: "completed", items: [{ id: "si3", type: "service", referenceId: "sv2", name: "Banho e Tosa Pequeno", quantity: 1, unitPrice: 60, discount: 0, total: 60 }, { id: "si4", type: "product", referenceId: "pr2", name: "Ração Filhote 3kg", quantity: 2, unitPrice: 69.90, discount: 10, total: 129.80 }], subtotal: 189.80, discount: 10, total: 179.80, payments: [{ id: "pay2", method: "pix", amount: 179.80 }], userId: "u3", createdAt: d(-3), updatedAt: d(-3) },
  { id: "s3", clientId: "c3", petId: "p4", status: "completed", items: [{ id: "si5", type: "service", referenceId: "sv5", name: "Vacinação V10", quantity: 1, unitPrice: 55, discount: 0, total: 55 }, { id: "si6", type: "service", referenceId: "sv6", name: "Vacinação Antirrábica", quantity: 1, unitPrice: 35, discount: 0, total: 35 }], subtotal: 90, discount: 0, total: 90, payments: [{ id: "pay3", method: "cash", amount: 90 }], userId: "u3", createdAt: d(-1), updatedAt: d(-1) },
  { id: "s4", clientId: "c4", status: "completed", items: [{ id: "si7", type: "product", referenceId: "pr3", name: "Shampoo Neutro 500ml", quantity: 1, unitPrice: 24.90, discount: 0, total: 24.90 }, { id: "si8", type: "product", referenceId: "pr7", name: "Coleira Antipulgas M", quantity: 1, unitPrice: 45, discount: 0, total: 45 }], subtotal: 69.90, discount: 0, total: 69.90, payments: [{ id: "pay4", method: "debit_card", amount: 69.90 }], userId: "u3", createdAt: d(0), updatedAt: d(0) },
  { id: "s5", clientId: "c5", petId: "p6", status: "completed", items: [{ id: "si9", type: "service", referenceId: "sv1", name: "Consulta Clínica", quantity: 1, unitPrice: 120, discount: 0, total: 120 }], subtotal: 120, discount: 0, total: 120, payments: [{ id: "pay5", method: "pix", amount: 120 }], userId: "u3", createdAt: d(-7), updatedAt: d(-7) },
];

export const seedPackages: Package[] = [
  { id: "pkg1", name: "Pacote Banho 5x", serviceId: "sv2", totalSessions: 5, price: 270.00, validityDays: 90, active: true, createdAt: d(-100) },
  { id: "pkg2", name: "Pacote Consulta 3x", serviceId: "sv1", totalSessions: 3, price: 330.00, validityDays: 180, active: true, createdAt: d(-100) },
  { id: "pkg3", name: "Pacote Banho 10x", serviceId: "sv2", totalSessions: 10, price: 500.00, validityDays: 180, active: true, createdAt: d(-60) },
];

export const seedPackageContracts: PackageContract[] = [
  { id: "pc1", packageId: "pkg1", clientId: "c1", petId: "p1", purchasedAt: d(-30), expiresAt: d(60), sessionsUsed: 2, totalSessions: 5, status: "active" },
  { id: "pc2", packageId: "pkg2", clientId: "c2", purchasedAt: d(-60), expiresAt: d(120), sessionsUsed: 3, totalSessions: 3, status: "completed" },
  { id: "pc3", packageId: "pkg3", clientId: "c3", petId: "p4", purchasedAt: d(-15), expiresAt: d(165), sessionsUsed: 1, totalSessions: 10, status: "active" },
];
