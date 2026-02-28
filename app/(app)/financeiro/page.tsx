"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  financeEntriesDb,
  financeCategoriesDb,
  financeAccountsDb,
} from "@/mocks/db";
import type { FinanceEntry, FinanceCategory, FinanceAccount } from "@/types";
import { formatCurrency, formatDate, exportToCSV } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const statusColors: Record<
  string,
  "success" | "warning" | "destructive" | "secondary"
> = {
  paid: "success",
  pending: "warning",
  overdue: "destructive",
  cancelled: "secondary",
};
const statusLabels: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente",
  overdue: "Vencido",
  cancelled: "Cancelado",
};
const paymentMethodLabels: Record<string, string> = {
  cash: "Dinheiro",
  credit_card: "Crédito",
  debit_card: "Débito",
  pix: "PIX",
  bank_slip: "Boleto",
  bank_transfer: "Transferência",
};

export default function FinanceiroPage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);
  const [form, setForm] = useState({
    type: "income" as "income" | "expense",
    description: "",
    amount: "",
    dueDate: new Date().toISOString().split("T")[0],
    categoryId: "",
    accountId: "",
    paymentMethod: "",
    recurring: false,
    recurringInterval: "monthly" as "weekly" | "monthly" | "yearly",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [ents, cats, accs] = await Promise.all([
      financeEntriesDb.findAll(),
      financeCategoriesDb.findAll(),
      financeAccountsDb.findAll(),
    ]);
    setEntries(
      ents.sort(
        (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
      ),
    );
    setCategories(cats);
    setAccounts(accs);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = entries.filter((e) => {
    const matchType = typeFilter === "all" || e.type === typeFilter;
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchType && matchStatus;
  });

  const totalIncome = entries
    .filter((e) => e.type === "income" && e.status === "paid")
    .reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries
    .filter((e) => e.type === "expense" && e.status === "paid")
    .reduce((s, e) => s + e.amount, 0);
  const pendingIncome = entries
    .filter((e) => e.type === "income" && e.status === "pending")
    .reduce((s, e) => s + e.amount, 0);
  const pendingExpense = entries
    .filter((e) => e.type === "expense" && e.status === "pending")
    .reduce((s, e) => s + e.amount, 0);

  const chartData = [
    { name: "Recebido", value: totalIncome, fill: "#22c55e" },
    { name: "Pago", value: totalExpense, fill: "#ef4444" },
    { name: "A Receber", value: pendingIncome, fill: "#86efac" },
    { name: "A Pagar", value: pendingExpense, fill: "#fca5a5" },
  ];

  const openNew = () => {
    setEditingEntry(null);
    setForm({
      type: "income",
      description: "",
      amount: "",
      dueDate: new Date().toISOString().split("T")[0],
      categoryId: "",
      accountId: "",
      paymentMethod: "",
      recurring: false,
      recurringInterval: "monthly",
    });
    setDialogOpen(true);
  };

  const openEdit = (e: FinanceEntry) => {
    setEditingEntry(e);
    setForm({
      type: e.type,
      description: e.description,
      amount: String(e.amount),
      dueDate: e.dueDate.split("T")[0],
      categoryId: e.categoryId ?? "",
      accountId: e.accountId ?? "",
      paymentMethod: e.paymentMethod ?? "",
      recurring: e.recurring,
      recurringInterval: (e.recurringInterval ?? "monthly") as
        | "weekly"
        | "monthly"
        | "yearly",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.description || !form.amount) {
      toast({
        title: "Descrição e valor são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    const payload = {
      type: form.type,
      description: form.description,
      amount: parseFloat(form.amount),
      dueDate: new Date(form.dueDate + "T12:00:00").toISOString(),
      status: "pending" as const,
      categoryId: form.categoryId,
      accountId: form.accountId || undefined,
      paymentMethod:
        (form.paymentMethod as FinanceEntry["paymentMethod"]) || undefined,
      recurring: form.recurring,
      recurringInterval: form.recurring ? form.recurringInterval : undefined,
    };
    if (editingEntry) {
      await financeEntriesDb.update(
        editingEntry.id,
        payload as Partial<FinanceEntry>,
      );
      toast({ title: "Lançamento atualizado" });
    } else {
      await financeEntriesDb.create({
        ...payload,
        categoryId: payload.categoryId,
      });
      toast({ title: "Lançamento criado" });
    }
    setDialogOpen(false);
    load();
  };

  const handleMarkPaid = async (entry: FinanceEntry) => {
    await financeEntriesDb.update(entry.id, {
      status: "paid",
      paidDate: new Date().toISOString(),
    });
    toast({ title: "Marcado como pago" });
    load();
  };

  const handleExport = () => {
    exportToCSV(
      filtered.map((e) => ({
        Data: formatDate(e.dueDate),
        Tipo: e.type === "income" ? "Receita" : "Despesa",
        Descrição: e.description,
        Valor: e.amount,
        Status: statusLabels[e.status],
        "Forma Pagamento": e.paymentMethod
          ? paymentMethodLabels[e.paymentMethod]
          : "",
      })),
      "financeiro",
    );
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground text-sm">
            Controle de receitas e despesas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4" /> Exportar
          </Button>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4" /> Novo Lançamento
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Receitas Recebidas",
            value: totalIncome,
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Despesas Pagas",
            value: totalExpense,
            icon: TrendingDown,
            color: "text-red-600",
            bg: "bg-red-50",
          },
          {
            label: "A Receber",
            value: pendingIncome,
            icon: DollarSign,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "A Pagar",
            value: pendingExpense,
            icon: DollarSign,
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className={`text-xl font-bold ${k.color}`}>
                    {formatCurrency(k.value)}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${k.bg}`}>
                  <k.icon className={`w-5 h-5 ${k.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="value" name="Valor" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Accounts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {accounts.map((acc) => (
          <Card key={acc.id}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{acc.name}</p>
              <p
                className={`text-xl font-bold ${acc.balance >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(acc.balance)}
              </p>
              <Badge variant="outline" className="text-xs mt-1">
                {acc.type === "checking"
                  ? "Conta Corrente"
                  : acc.type === "cash"
                    ? "Caixa"
                    : "Cartão"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Entries table */}
      <div className="space-y-3">
        <div className="flex gap-3 flex-wrap">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="overdue">Vencido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Forma Pgto</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    Nenhum lançamento encontrado
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm">
                    {formatDate(entry.dueDate)}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{entry.description}</p>
                    {entry.recurring && (
                      <Badge variant="outline" className="text-xs">
                        Recorrente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        entry.type === "income" ? "success" : "destructive"
                      }
                    >
                      {entry.type === "income" ? "Receita" : "Despesa"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-bold ${entry.type === "income" ? "text-green-600" : "text-red-600"}`}
                  >
                    {entry.type === "expense" ? "-" : ""}
                    {formatCurrency(entry.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[entry.status]}>
                      {statusLabels[entry.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.paymentMethod
                      ? paymentMethodLabels[entry.paymentMethod]
                      : "–"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {entry.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => handleMarkPaid(entry)}
                        >
                          Pagar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => openEdit(entry)}
                      >
                        Editar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Editar Lançamento" : "Novo Lançamento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, type: v as "income" | "expense" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Vencimento</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Descrição *</Label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Valor *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Forma de Pagamento</Label>
                <Select
                  value={form.paymentMethod}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, paymentMethod: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(paymentMethodLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, categoryId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => c.type === form.type)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Conta</Label>
                <Select
                  value={form.accountId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, accountId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <Switch
                  checked={form.recurring}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, recurring: v }))
                  }
                  id="recurring"
                />
                <Label htmlFor="recurring">Lançamento recorrente</Label>
                {form.recurring && (
                  <Select
                    value={form.recurringInterval}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        recurringInterval: v as "weekly" | "monthly" | "yearly",
                      }))
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
