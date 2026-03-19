"use client";
import { useState } from "react";
import {
  Plus,
  Search,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Edit,
  Download,
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { stockService } from "@/services/stock.service";
import { adaptApiProductToProduct } from "@/adapters/product.adapter";
import { adaptApiStockMoveToStockMove } from "@/adapters/stock.adapter";
import type { Product, StockMove } from "@/types";
import { formatCurrency, formatDate, exportToCSV } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const categories = [
  "food",
  "medicine",
  "vaccine",
  "hygiene",
  "accessory",
  "other",
];
const categoryLabels: Record<string, string> = {
  food: "Alimentação",
  medicine: "Medicamento",
  vaccine: "Vacina",
  hygiene: "Higiene",
  accessory: "Acessório",
  other: "Outro",
};

export default function EstoquePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "medicine" as Product["category"],
    unit: "un",
    costPrice: "",
    salePrice: "",
    stock: "",
    minStock: "",
    supplier: "",
    expirationDate: "",
  });
  const [moveForm, setMoveForm] = useState({
    type: "in" as StockMove["type"],
    quantity: "",
    reason: "",
    unitCost: "",
  });

  const { data: apiProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: () => productService.list(),
  });

  const { data: apiMoves = [], isLoading: loadingMoves } = useQuery({
    queryKey: ["stock-moves"],
    queryFn: () => stockService.listMoves(),
  });

  const products = apiProducts
    .map(adaptApiProductToProduct)
    .sort((a, b) => a.name.localeCompare(b.name));
  const moves = apiMoves
    .map(adaptApiStockMoveToStockMove)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  const loading = loadingProducts || loadingMoves;

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const lowStock = products.filter((p) => p.active && p.stock <= p.minStock);

  const openNew = () => {
    setEditingProduct(null);
    setForm({
      name: "",
      sku: "",
      category: "medicine",
      unit: "un",
      costPrice: "",
      salePrice: "",
      stock: "",
      minStock: "",
      supplier: "",
      expirationDate: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      sku: p.sku ?? "",
      category: p.category,
      unit: p.unit,
      costPrice: String(p.costPrice),
      salePrice: String(p.salePrice),
      stock: String(p.stock),
      minStock: String(p.minStock),
      supplier: p.supplier ?? "",
      expirationDate: p.expirationDate ?? "",
    });
    setDialogOpen(true);
  };

  const createProductMutation = useMutation({
    mutationFn: productService.create,
    onSuccess: () => {
      toast({ title: "Produto cadastrado" });
      qc.invalidateQueries({ queryKey: ["products"] });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro ao cadastrar produto", variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      productService.update(id, payload),
    onSuccess: () => {
      toast({ title: "Produto atualizado" });
      qc.invalidateQueries({ queryKey: ["products"] });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro ao atualizar produto", variant: "destructive" });
    },
  });

  const handleSave = async () => {
    if (!form.name) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    const payload = {
      name: form.name,
      category: form.category,
      unit: form.unit,
      cost_price: parseFloat(form.costPrice) || 0,
      sale_price: parseFloat(form.salePrice) || 0,
      stock: parseInt(form.stock) || 0,
      min_stock: parseInt(form.minStock) || 0,
      barcode: form.sku || undefined,
      notes: form.supplier || undefined,
      active: true,
    };
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, payload });
    } else {
      createProductMutation.mutate(payload);
    }
  };

  const openMove = (p: Product) => {
    setSelectedProduct(p);
    setMoveForm({ type: "in", quantity: "", reason: "", unitCost: "" });
    setMoveDialogOpen(true);
  };

  const createMoveMutation = useMutation({
    mutationFn: stockService.createMove,
    onSuccess: () => {
      toast({ title: "Movimentação registrada" });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock-moves"] });
      setMoveDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro ao registrar movimentação",
        variant: "destructive",
      });
    },
  });

  const handleMove = async () => {
    if (!selectedProduct || !moveForm.quantity) {
      toast({ title: "Quantidade é obrigatória", variant: "destructive" });
      return;
    }
    const qty = parseInt(moveForm.quantity);
    createMoveMutation.mutate({
      product_id: selectedProduct.id,
      type: moveForm.type,
      quantity: qty,
      reason: moveForm.reason || undefined,
    });
  };

  const handleExport = () => {
    exportToCSV(
      products.map((p) => ({
        Nome: p.name,
        SKU: p.sku ?? "",
        Categoria: categoryLabels[p.category],
        Estoque: p.stock,
        Mínimo: p.minStock,
        "Preço Custo": p.costPrice,
        "Preço Venda": p.salePrice,
        Fornecedor: p.supplier ?? "",
        Validade: p.expirationDate ?? "",
      })),
      "estoque",
    );
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-primary [font-family:var(--font-heading)]">Estoque</h1>
          <p className="text-muted-foreground text-sm">
            {products.filter((p) => p.active).length} produtos ativos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4" /> Exportar
          </Button>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4" /> Novo Produto
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {lowStock.length > 0 && (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[color:var(--warning)]" />
              <p className="text-sm font-medium text-[color:var(--warning)]">
                {lowStock.length} produto(s) com estoque baixo
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStock.map((p) => (
                <Badge key={p.id} variant="warning">
                  {p.name}: {p.stock}/{p.minStock}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="moves">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-3 mt-3">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto ou SKU..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {categoryLabels[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Mín.</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Venda</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-8"
                    >
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((p) => {
                  const isLow = p.stock <= p.minStock;
                  const isOut = p.stock === 0;
                  return (
                    <TableRow
                      key={p.id}
                      className={!p.active ? "opacity-50" : ""}
                    >
                      <TableCell>
                        <p className="font-medium">{p.name}</p>
                        {p.sku && (
                          <p className="text-xs text-muted-foreground">
                            {p.sku}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categoryLabels[p.category]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-medium ${isOut ? "text-destructive" : isLow ? "text-[color:var(--warning)]" : "text-success"}`}
                        >
                          {p.stock} {p.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {p.minStock}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(p.costPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(p.salePrice)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.expirationDate ? formatDate(p.expirationDate) : "–"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openMove(p)}
                            title="Movimentar"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(p)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="moves" className="mt-3">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {moves.slice(0, 50).map((m) => {
                  const product = products.find((p) => p.id === m.productId);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(m.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {product?.name ?? "–"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            m.type === "in"
                              ? "success"
                              : m.type === "loss"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {m.type === "in"
                            ? "Entrada"
                            : m.type === "out"
                              ? "Saída"
                              : m.type === "loss"
                                ? "Perda"
                                : "Ajuste"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span
                          className={
                            m.type === "in" ? "text-success" : "text-destructive"
                          }
                        >
                          {m.type === "in" ? "+" : "-"}
                          {m.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {m.reason}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nome *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input
                  value={form.sku}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sku: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      category: v as Product["category"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {categoryLabels[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Unidade</Label>
                <Input
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                  placeholder="un, cx, dose..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fornecedor</Label>
                <Input
                  value={form.supplier}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, supplier: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Preço de Custo</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.costPrice}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, costPrice: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Preço de Venda</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.salePrice}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, salePrice: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Estoque Atual</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stock: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Estoque Mínimo</Label>
                <Input
                  type="number"
                  value={form.minStock}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, minStock: e.target.value }))
                  }
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Validade</Label>
                <Input
                  type="date"
                  value={form.expirationDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, expirationDate: e.target.value }))
                  }
                />
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

      {/* Move Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Movimentar Estoque – {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={moveForm.type}
                onValueChange={(v) =>
                  setMoveForm((f) => ({ ...f, type: v as StockMove["type"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Entrada</SelectItem>
                  <SelectItem value="out">Saída</SelectItem>
                  <SelectItem value="loss">Perda/Avaria</SelectItem>
                  <SelectItem value="adjustment">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                min="1"
                value={moveForm.quantity}
                onChange={(e) =>
                  setMoveForm((f) => ({ ...f, quantity: e.target.value }))
                }
              />
            </div>
            {moveForm.type === "in" && (
              <div className="space-y-1.5">
                <Label>Custo unitário</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={moveForm.unitCost}
                  onChange={(e) =>
                    setMoveForm((f) => ({ ...f, unitCost: e.target.value }))
                  }
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Input
                value={moveForm.reason}
                onChange={(e) =>
                  setMoveForm((f) => ({ ...f, reason: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMove}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
