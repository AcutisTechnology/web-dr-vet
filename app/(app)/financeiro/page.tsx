"use client";
import { useState } from "react";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Pencil,
  Trash2,
  Tag,
  Landmark,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  financeService,
  type ApiFinanceEntry,
  type ApiFinanceCategory,
  type ApiFinanceAccount,
  type StoreFinanceEntryPayload,
} from "@/services/finance.service";
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
  const qc = useQueryClient();

  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ApiFinanceEntry | null>(
    null,
  );

  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catForm, setCatForm] = useState({
    name: "",
    type: "income" as "income" | "expense",
  });
  const [accDialogOpen, setAccDialogOpen] = useState(false);
  const [accForm, setAccForm] = useState({
    name: "",
    type: "checking" as string,
    balance: "",
  });

  const [form, setForm] = useState({
    type: "income" as "income" | "expense",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    categoryId: "",
    accountId: "",
    paymentMethod: "",
    status: "pending" as string,
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["finance-entries"],
    queryFn: () => financeService.listEntries(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["finance-categories"],
    queryFn: () => financeService.listCategories(),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["finance-accounts"],
    queryFn: () => financeService.listAccounts(),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["finance-entries"] });
  const invalidateCats = () =>
    qc.invalidateQueries({ queryKey: ["finance-categories"] });
  const invalidateAccs = () =>
    qc.invalidateQueries({ queryKey: ["finance-accounts"] });

  const createMutation = useMutation({
    mutationFn: (payload: StoreFinanceEntryPayload) =>
      financeService.createEntry(payload),
    onSuccess: () => {
      toast({ title: "Lançamento criado" });
      setDialogOpen(false);
      invalidate();
    },
    onError: () =>
      toast({ title: "Erro ao criar lançamento", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<StoreFinanceEntryPayload>;
    }) => financeService.updateEntry(id, payload),
    onSuccess: () => {
      toast({ title: "Lançamento atualizado" });
      setDialogOpen(false);
      invalidate();
    },
    onError: () =>
      toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => financeService.markPaid(id),
    onSuccess: () => {
      toast({ title: "Marcado como pago" });
      invalidate();
    },
    onError: () =>
      toast({ title: "Erro ao marcar como pago", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeService.deleteEntry(id),
    onSuccess: () => {
      toast({ title: "Lançamento excluído" });
      invalidate();
    },
    onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
  });

  const createCatMutation = useMutation({
    mutationFn: (payload: { name: string; type: string }) =>
      financeService.createCategory(payload),
    onSuccess: (cat: ApiFinanceCategory) => {
      toast({ title: "Categoria criada" });
      setCatDialogOpen(false);
      setCatForm({ name: "", type: "income" });
      invalidateCats();
      setForm((f) => ({ ...f, categoryId: cat.id }));
    },
    onError: () =>
      toast({ title: "Erro ao criar categoria", variant: "destructive" }),
  });

  const createAccMutation = useMutation({
    mutationFn: (payload: { name: string; type: string; balance?: number }) =>
      financeService.createAccount(payload),
    onSuccess: (acc: ApiFinanceAccount) => {
      toast({ title: "Conta criada" });
      setAccDialogOpen(false);
      setAccForm({ name: "", type: "checking", balance: "" });
      invalidateAccs();
      setForm((f) => ({ ...f, accountId: acc.id }));
    },
    onError: () =>
      toast({ title: "Erro ao criar conta", variant: "destructive" }),
  });

  const filtered = entries.filter((e) => {
    const matchType = typeFilter === "all" || e.type === typeFilter;
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchType && matchStatus;
  });

  const totalIncome = entries
    .filter((e) => e.type === "income" && e.status === "paid")
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalExpense = entries
    .filter((e) => e.type === "expense" && e.status === "paid")
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const pendingIncome = entries
    .filter((e) => e.type === "income" && e.status === "pending")
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const pendingExpense = entries
    .filter((e) => e.type === "expense" && e.status === "pending")
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const chartData = [
    { name: "Recebido", value: totalIncome, fill: "#22c55e" },
    { name: "Pago", value: totalExpense, fill: "#ef4444" },
    { name: "A Receber", value: pendingIncome, fill: "#86efac" },
    { name: "A Pagar", value: pendingExpense, fill: "#fca5a5" },
  ];

  const EMPTY_FORM = {
    type: "income" as "income" | "expense",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    categoryId: "",
    accountId: "",
    paymentMethod: "",
    status: "pending",
  };

  const openNew = () => {
    setEditingEntry(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (e: ApiFinanceEntry) => {
    setEditingEntry(e);
    setForm({
      type: e.type,
      description: e.description,
      amount: String(e.amount),
      date: e.due_date.split("T")[0],
      categoryId: e.category_id ?? "",
      accountId: e.account_id ?? "",
      paymentMethod: e.payment_method ?? "",
      status: e.status,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (
      !form.description ||
      !form.amount ||
      !form.categoryId ||
      !form.accountId
    ) {
      toast({
        title: "Descrição, valor, categoria e conta são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    const payload: StoreFinanceEntryPayload = {
      type: form.type,
      description: form.description,
      amount: parseFloat(form.amount),
      date: form.date,
      status: form.status,
      category_id: form.categoryId,
      account_id: form.accountId,
      payment_method: form.paymentMethod || undefined,
    };
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleExport = () => {
    exportToCSV(
      filtered.map((e) => ({
        Data: formatDate(e.due_date),
        Tipo: e.type === "income" ? "Receita" : "Despesa",
        Descrição: e.description,
        Valor: e.amount,
        Status: statusLabels[e.status],
        "Forma Pagamento": e.payment_method
          ? paymentMethodLabels[e.payment_method]
          : "",
        Categoria: e.category?.name ?? "",
        Conta: e.account?.name ?? "",
      })),
      "financeiro",
    );
  };

  if (isLoading)
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
                    {formatDate(entry.due_date)}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{entry.description}</p>
                    {entry.category && (
                      <p className="text-xs text-muted-foreground">
                        {entry.category.name}
                      </p>
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
                    {formatCurrency(Number(entry.amount) || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[entry.status]}>
                      {statusLabels[entry.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.payment_method
                      ? (paymentMethodLabels[entry.payment_method] ??
                        entry.payment_method)
                      : "–"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {entry.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => markPaidMutation.mutate(entry.id)}
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
                        <Pencil className="w-3 h-3 mr-1" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Excluir lançamento?"))
                            deleteMutation.mutate(entry.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
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
                <Label>Data</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
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
                <div className="flex items-center justify-between">
                  <Label>Categoria</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setCatForm((f) => ({ ...f, type: form.type }));
                      setCatDialogOpen(true);
                    }}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Nova
                  </button>
                </div>
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
                    {categories.filter((c) => c.type === form.type).length ===
                      0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        Nenhuma categoria. Clique em &quot;Nova&quot; acima.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Conta</Label>
                  <button
                    type="button"
                    onClick={() => setAccDialogOpen(true)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Nova
                  </button>
                </div>
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
                    {accounts.length === 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        Nenhuma conta. Clique em &quot;Nova&quot; acima.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Vencido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
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
      {/* Quick-add Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-4 h-4" /> Nova Categoria
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input
                value={catForm.name}
                onChange={(e) =>
                  setCatForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Ex: Consultas, Aluguel..."
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={catForm.type}
                onValueChange={(v) =>
                  setCatForm((f) => ({
                    ...f,
                    type: v as "income" | "expense",
                  }))
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!catForm.name.trim() || createCatMutation.isPending}
              onClick={() =>
                createCatMutation.mutate({
                  name: catForm.name.trim(),
                  type: catForm.type,
                })
              }
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick-add Account Dialog */}
      <Dialog open={accDialogOpen} onOpenChange={setAccDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="w-4 h-4" /> Nova Conta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input
                value={accForm.name}
                onChange={(e) =>
                  setAccForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Ex: Caixa, Banco Itaú..."
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={accForm.type}
                onValueChange={(v) => setAccForm((f) => ({ ...f, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="savings">Poupança</SelectItem>
                  <SelectItem value="cash">Caixa (Dinheiro)</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Saldo inicial</Label>
              <Input
                type="number"
                step="0.01"
                value={accForm.balance}
                onChange={(e) =>
                  setAccForm((f) => ({ ...f, balance: e.target.value }))
                }
                placeholder="0,00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!accForm.name.trim() || createAccMutation.isPending}
              onClick={() =>
                createAccMutation.mutate({
                  name: accForm.name.trim(),
                  type: accForm.type,
                  balance: accForm.balance
                    ? parseFloat(accForm.balance)
                    : undefined,
                })
              }
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
