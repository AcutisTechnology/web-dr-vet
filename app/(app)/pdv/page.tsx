"use client";
import { useState } from "react";
import {
  Plus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  Pencil,
  Package,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  catalogService,
  type ApiProduct,
  type ApiService,
  type StoreProductPayload,
  type StoreServicePayload,
} from "@/services/catalog.service";
import { clientService } from "@/services/client.service";
import { petService } from "@/services/pet.service";
import { useCartStore } from "@/stores/cart";
import { useSessionStore } from "@/stores/session";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const PRODUCT_CATEGORIES: { value: string; label: string }[] = [
  { value: "food", label: "Alimentação" },
  { value: "medicine", label: "Medicamento" },
  { value: "accessory", label: "Acessório" },
  { value: "hygiene", label: "Higiene" },
  { value: "vaccine", label: "Vacina" },
  { value: "other", label: "Outro" },
];

const EMPTY_PRODUCT = {
  name: "",
  sku: "",
  category: "other" as string,
  description: "",
  unit: "un",
  costPrice: "",
  salePrice: "",
  stock: "",
  minStock: "",
  supplier: "",
  active: true,
};

const EMPTY_SERVICE = {
  name: "",
  category: "",
  price: "",
  duration: "",
  description: "",
  active: true,
};

type PaymentMethod =
  | "cash"
  | "credit_card"
  | "debit_card"
  | "pix"
  | "bank_slip";

const paymentMethods: {
  value: PaymentMethod;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "cash", label: "Dinheiro", icon: Banknote },
  { value: "credit_card", label: "Crédito", icon: CreditCard },
  { value: "debit_card", label: "Débito", icon: CreditCard },
  { value: "pix", label: "PIX", icon: Smartphone },
  { value: "bank_slip", label: "Boleto", icon: Banknote },
];

export default function PDVPage() {
  const { toast } = useToast();
  const cart = useCartStore();
  const qc = useQueryClient();

  const [productSearch, setProductSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [installments, setInstallments] = useState("1");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [productForm, setProductForm] = useState({ ...EMPTY_PRODUCT });
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ApiService | null>(null);
  const [serviceForm, setServiceForm] = useState({ ...EMPTY_SERVICE });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientService.list(),
  });

  const { data: allPets = [] } = useQuery({
    queryKey: ["pets"],
    queryFn: () => petService.list(),
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: () => catalogService.listProducts(),
  });

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ["services"],
    queryFn: () => catalogService.listServices(),
  });

  const invalidateProducts = () =>
    qc.invalidateQueries({ queryKey: ["products"] });
  const invalidateServices = () =>
    qc.invalidateQueries({ queryKey: ["services"] });

  const createProductMutation = useMutation({
    mutationFn: (payload: StoreProductPayload) =>
      catalogService.createProduct(payload),
    onSuccess: () => {
      toast({ title: "Produto criado" });
      setProductDialogOpen(false);
      invalidateProducts();
    },
    onError: () =>
      toast({ title: "Erro ao criar produto", variant: "destructive" }),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<StoreProductPayload>;
    }) => catalogService.updateProduct(id, payload),
    onSuccess: () => {
      toast({ title: "Produto atualizado" });
      setProductDialogOpen(false);
      invalidateProducts();
    },
    onError: () =>
      toast({ title: "Erro ao atualizar produto", variant: "destructive" }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => catalogService.deleteProduct(id),
    onSuccess: () => {
      toast({ title: "Produto removido" });
      invalidateProducts();
    },
    onError: () =>
      toast({ title: "Erro ao remover produto", variant: "destructive" }),
  });

  const createServiceMutation = useMutation({
    mutationFn: (payload: StoreServicePayload) =>
      catalogService.createService(payload),
    onSuccess: () => {
      toast({ title: "Serviço criado" });
      setServiceDialogOpen(false);
      invalidateServices();
    },
    onError: () =>
      toast({ title: "Erro ao criar serviço", variant: "destructive" }),
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<StoreServicePayload>;
    }) => catalogService.updateService(id, payload),
    onSuccess: () => {
      toast({ title: "Serviço atualizado" });
      setServiceDialogOpen(false);
      invalidateServices();
    },
    onError: () =>
      toast({ title: "Erro ao atualizar serviço", variant: "destructive" }),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => catalogService.deleteService(id),
    onSuccess: () => {
      toast({ title: "Serviço removido" });
      invalidateServices();
    },
    onError: () =>
      toast({ title: "Erro ao remover serviço", variant: "destructive" }),
  });

  const clientPets = allPets.filter((p) => p.client?.id === cart.clientId);
  const activeProducts = products.filter((p) => p.active !== false);
  const activeServices = services.filter((s) => s.active !== false);

  const filteredProducts = activeProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.barcode ?? "").toLowerCase().includes(productSearch.toLowerCase()),
  );
  const filteredServices = activeServices.filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase()),
  );

  const addProduct = (p: ApiProduct) => {
    const unitPrice = Number(p.sale_price);
    const existing = cart.items.find(
      (i) => i.referenceId === p.id && i.type === "product",
    );
    if (existing) {
      cart.updateItem(existing.id, {
        quantity: existing.quantity + 1,
        total: (existing.quantity + 1) * existing.unitPrice,
      });
    } else {
      cart.addItem({
        type: "product",
        referenceId: p.id,
        name: p.name,
        quantity: 1,
        unitPrice,
        discount: 0,
        total: unitPrice,
      });
    }
  };

  const addService = (s: ApiService) => {
    const unitPrice = Number(s.price);
    cart.addItem({
      type: "service",
      referenceId: s.id,
      name: s.name,
      quantity: 1,
      unitPrice,
      discount: 0,
      total: unitPrice,
    });
  };

  const addPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    cart.addPayment({
      method: paymentMethod,
      amount,
      installments:
        paymentMethod === "credit_card" ? parseInt(installments) : undefined,
    });
    setPaymentAmount("");
  };

  const openNewProduct = () => {
    setEditingProduct(null);
    setProductForm({ ...EMPTY_PRODUCT });
    setProductDialogOpen(true);
  };

  const openEditProduct = (p: ApiProduct) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      sku: p.barcode ?? "",
      category: p.category,
      description: p.notes ?? "",
      unit: p.unit,
      costPrice: String(p.cost_price),
      salePrice: String(p.sale_price),
      stock: String(p.stock),
      minStock: String(p.min_stock),
      supplier: "",
      active: p.active,
    });
    setProductDialogOpen(true);
  };

  const handleSaveProduct = () => {
    if (!productForm.name.trim() || !productForm.salePrice) {
      toast({
        title: "Nome e preço de venda são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    const payload: StoreProductPayload = {
      name: productForm.name.trim(),
      category: productForm.category || "other",
      unit: productForm.unit || "un",
      cost_price: parseFloat(productForm.costPrice) || 0,
      sale_price: parseFloat(productForm.salePrice),
      stock: parseInt(productForm.stock) || 0,
      min_stock: parseInt(productForm.minStock) || 0,
      barcode: productForm.sku || undefined,
      notes: productForm.description || undefined,
      active: productForm.active,
    };
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, payload });
    } else {
      createProductMutation.mutate(payload);
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (!confirm("Remover produto?")) return;
    deleteProductMutation.mutate(id);
  };

  const openNewService = () => {
    setEditingService(null);
    setServiceForm({ ...EMPTY_SERVICE });
    setServiceDialogOpen(true);
  };

  const openEditService = (s: ApiService) => {
    setEditingService(s);
    setServiceForm({
      name: s.name,
      category: s.category,
      price: String(s.price),
      duration: s.duration ? String(s.duration) : "",
      description: s.description ?? "",
      active: s.active,
    });
    setServiceDialogOpen(true);
  };

  const handleSaveService = () => {
    if (!serviceForm.name.trim() || !serviceForm.price) {
      toast({ title: "Nome e preço são obrigatórios", variant: "destructive" });
      return;
    }
    const payload: StoreServicePayload = {
      name: serviceForm.name.trim(),
      category: serviceForm.category || "Geral",
      price: parseFloat(serviceForm.price),
      duration: serviceForm.duration
        ? parseInt(serviceForm.duration)
        : undefined,
      description: serviceForm.description || undefined,
      active: serviceForm.active,
    };
    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, payload });
    } else {
      createServiceMutation.mutate(payload);
    }
  };

  const handleDeleteService = (id: string) => {
    if (!confirm("Remover serviço?")) return;
    deleteServiceMutation.mutate(id);
  };

  const handleFinalize = async () => {
    if (cart.items.length === 0) {
      toast({ title: "Carrinho vazio", variant: "destructive" });
      return;
    }
    if (cart.remaining() > 0.01) {
      toast({
        title: `Falta ${formatCurrency(cart.remaining())} para cobrir o total`,
        variant: "destructive",
      });
      return;
    }
    setProcessing(true);
    try {
      await catalogService.createSale({
        client_id: cart.clientId ?? undefined,
        pet_id: cart.petId ?? undefined,
        date: new Date().toISOString().split("T")[0],
        total: cart.total(),
        discount: cart.discount,
        status: "completed",
        items: cart.items.map((i) => ({
          type: i.type as "product" | "service",
          item_id: i.referenceId,
          quantity: i.quantity,
          price: i.unitPrice,
          discount: i.discount,
        })),
        payments: cart.payments.map((p) => ({
          method: p.method,
          amount: p.amount,
          installments: p.installments,
        })),
      });
      toast({
        title: "Venda finalizada!",
        description: `Total: ${formatCurrency(cart.total())}`,
      });
      cart.clearCart();
      setCheckoutOpen(false);
      qc.invalidateQueries({ queryKey: ["finance-entries"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    } catch {
      toast({ title: "Erro ao finalizar venda", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const isLoading = loadingProducts || loadingServices;
  if (isLoading)
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary [font-family:var(--font-heading)]">PDV / Vendas</h1>
          <p className="text-muted-foreground text-sm">
            Ponto de venda e cadastro de produtos/serviços
          </p>
        </div>
      </div>

      <Tabs defaultValue="pdv">
        <TabsList>
          <TabsTrigger value="pdv">
            <ShoppingCart className="w-4 h-4 mr-1.5" />
            Venda
          </TabsTrigger>
          <TabsTrigger value="produtos">
            <Package className="w-4 h-4 mr-1.5" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="servicos">
            <Wrench className="w-4 h-4 mr-1.5" />
            Serviços
          </TabsTrigger>
        </TabsList>

        {/* ── PRODUTOS CRUD ─────────────────────────────────────────────── */}
        <TabsContent value="produtos" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={openNewProduct}>
              <Plus className="w-4 h-4 mr-1" /> Novo Produto
            </Button>
          </div>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">Nome</th>
                  <th className="text-left px-4 py-2 font-medium">SKU</th>
                  <th className="text-left px-4 py-2 font-medium">Categoria</th>
                  <th className="text-right px-4 py-2 font-medium">Preço</th>
                  <th className="text-right px-4 py-2 font-medium">Estoque</th>
                  <th className="text-center px-4 py-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhum produto cadastrado
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-2 font-medium">{p.name}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {p.barcode ?? "—"}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className="text-xs">
                          {PRODUCT_CATEGORIES.find(
                            (c) => c.value === p.category,
                          )?.label ?? p.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-primary">
                        {formatCurrency(p.sale_price)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span
                          className={
                            p.stock <= p.min_stock
                              ? "text-destructive font-semibold"
                              : ""
                          }
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEditProduct(p)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteProduct(p.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── SERVIÇOS CRUD ─────────────────────────────────────────────── */}
        <TabsContent value="servicos" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={openNewService}>
              <Plus className="w-4 h-4 mr-1" /> Novo Serviço
            </Button>
          </div>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">Nome</th>
                  <th className="text-left px-4 py-2 font-medium">Categoria</th>
                  <th className="text-right px-4 py-2 font-medium">Preço</th>
                  <th className="text-right px-4 py-2 font-medium">Duração</th>
                  <th className="text-center px-4 py-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {services.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhum serviço cadastrado
                    </td>
                  </tr>
                ) : (
                  services.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-2 font-medium">{s.name}</td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className="text-xs">
                          {s.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-primary">
                        {formatCurrency(s.price)}
                      </td>
                      <td className="px-4 py-2 text-right text-muted-foreground">
                        {s.duration ? `${s.duration} min` : "—"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEditService(s)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteService(s.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── PDV / VENDA ───────────────────────────────────────────────── */}
        <TabsContent value="pdv" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Products/Services panel */}
            <div className="lg:col-span-2 space-y-4">
              {/* Client selector */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Cliente</Label>
                      <Select
                        value={cart.clientId ?? "__none__"}
                        onValueChange={(v) => {
                          cart.setClient(v === "__none__" ? null : v);
                          cart.setPet(null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar cliente..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Sem cliente</SelectItem>
                          {clients.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Pet</Label>
                      <Select
                        value={cart.petId ?? "__none__"}
                        onValueChange={(v) =>
                          cart.setPet(v === "__none__" ? null : v)
                        }
                        disabled={!cart.clientId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar pet..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Sem pet</SelectItem>
                          {clientPets.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="products">
                <TabsList>
                  <TabsTrigger value="products">Produtos</TabsTrigger>
                  <TabsTrigger value="services">Serviços</TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="mt-3 space-y-3">
                  <Input
                    placeholder="Buscar produto ou SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                    {filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addProduct(p)}
                        disabled={p.stock === 0}
                        className="text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.barcode ?? p.category}
                        </p>
                        <p className="text-sm font-bold text-primary mt-1">
                          {formatCurrency(p.sale_price)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Estoque: {p.stock}
                        </p>
                      </button>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="services" className="mt-3 space-y-3">
                  <Input
                    placeholder="Buscar serviço..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                    {filteredServices.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => addService(s)}
                        className="text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {s.category}
                        </Badge>
                        <p className="text-sm font-bold text-primary mt-1">
                          {formatCurrency(s.price)}
                        </p>
                      </button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Cart panel */}
            <div className="space-y-3">
              <Card className="sticky top-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" /> Carrinho (
                    {cart.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cart.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Carrinho vazio
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {cart.items.map((item) => (
                        <div key={item.id} className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const q = parseInt(e.target.value) || 1;
                                  cart.updateItem(item.id, {
                                    quantity: q,
                                    total: q * item.unitPrice - item.discount,
                                  });
                                }}
                                className="h-6 w-14 text-xs px-1"
                              />
                              <span className="text-xs text-muted-foreground">
                                × {formatCurrency(item.unitPrice)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold">
                              {formatCurrency(item.total)}
                            </p>
                            <button
                              onClick={() => cart.removeItem(item.id)}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(cart.subtotal())}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Desconto</span>
                      <Input
                        type="number"
                        min="0"
                        value={cart.discount}
                        onChange={(e) =>
                          cart.setDiscount(parseFloat(e.target.value) || 0)
                        }
                        className="h-6 w-20 text-xs px-1 text-right"
                      />
                    </div>
                    <div className="flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span className="text-primary">
                        {formatCurrency(cart.total())}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => cart.clearCart()}
                    >
                      Limpar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => setCheckoutOpen(true)}
                      disabled={cart.items.length === 0}
                    >
                      Finalizar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Checkout Dialog */}
          <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Finalizar Venda</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cart.subtotal())}</span>
                  </div>
                  {cart.discount > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Desconto</span>
                      <span>-{formatCurrency(cart.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>{formatCurrency(cart.total())}</span>
                  </div>
                </div>

                {/* Payments added */}
                {cart.payments.length > 0 && (
                  <div className="space-y-1">
                    {cart.payments.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm bg-success/10 rounded px-3 py-1.5"
                      >
                        <span>
                          {
                            paymentMethods.find((m) => m.value === p.method)
                              ?.label
                          }{" "}
                          {p.installments && p.installments > 1
                            ? `(${p.installments}x)`
                            : ""}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatCurrency(p.amount)}
                          </span>
                          <button
                            onClick={() => cart.removePayment(i)}
                            className="text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-medium px-1">
                      <span>Restante</span>
                      <span
                          className={
                            cart.remaining() > 0
                              ? "text-destructive"
                              : "text-success"
                          }
                        >
                        {formatCurrency(cart.remaining())}
                      </span>
                    </div>
                  </div>
                )}

                {/* Add payment */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">Adicionar Pagamento</p>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setPaymentMethod(m.value)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors ${paymentMethod === m.value ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}
                      >
                        <m.icon className="w-4 h-4" />
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Valor"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addPayment()}
                      className="flex-1"
                    />
                    {paymentMethod === "credit_card" && (
                      <Select
                        value={installments}
                        onValueChange={setInstallments}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 6, 12].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}x
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button variant="outline" onClick={addPayment}>
                      Adicionar
                    </Button>
                  </div>
                  {cart.remaining() > 0 && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const remaining = cart.remaining();
                        cart.addPayment({
                          method: paymentMethod,
                          amount: remaining,
                          installments:
                            paymentMethod === "credit_card"
                              ? parseInt(installments)
                              : undefined,
                        });
                        setPaymentAmount("");
                      }}
                    >
                      Cobrar {formatCurrency(cart.remaining())} em{" "}
                      {paymentMethods.find((m) => m.value === paymentMethod)
                        ?.label ?? paymentMethod}
                    </Button>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCheckoutOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleFinalize}
                  disabled={processing || cart.remaining() > 0.01}
                >
                  {processing ? "Processando..." : "Confirmar Venda"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      {/* ── Product CRUD Dialog ─────────────────────────────────────────── */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Nome *</Label>
              <Input
                value={productForm.name}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Nome do produto"
              />
            </div>
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input
                value={productForm.sku}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, sku: e.target.value }))
                }
                placeholder="Ex: RAC001"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select
                value={productForm.category}
                onValueChange={(v) =>
                  setProductForm((f) => ({
                    ...f,
                    category: v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Preço de Custo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={productForm.costPrice}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, costPrice: e.target.value }))
                }
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Preço de Venda (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={productForm.salePrice}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, salePrice: e.target.value }))
                }
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estoque</Label>
              <Input
                type="number"
                min="0"
                value={productForm.stock}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, stock: e.target.value }))
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estoque Mínimo</Label>
              <Input
                type="number"
                min="0"
                value={productForm.minStock}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, minStock: e.target.value }))
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unidade</Label>
              <Input
                value={productForm.unit}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, unit: e.target.value }))
                }
                placeholder="un"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fornecedor</Label>
              <Input
                value={productForm.supplier}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, supplier: e.target.value }))
                }
                placeholder="Opcional"
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Switch
                checked={productForm.active}
                onCheckedChange={(v) =>
                  setProductForm((f) => ({ ...f, active: v }))
                }
              />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProductDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveProduct}
              disabled={
                createProductMutation.isPending ||
                updateProductMutation.isPending
              }
            >
              {createProductMutation.isPending ||
              updateProductMutation.isPending
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Service CRUD Dialog ─────────────────────────────────────────── */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Editar Serviço" : "Novo Serviço"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Nome *</Label>
              <Input
                value={serviceForm.name}
                onChange={(e) =>
                  setServiceForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Nome do serviço"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Input
                value={serviceForm.category}
                onChange={(e) =>
                  setServiceForm((f) => ({ ...f, category: e.target.value }))
                }
                placeholder="Ex: Clínica, Estética"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Preço (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={serviceForm.price}
                onChange={(e) =>
                  setServiceForm((f) => ({ ...f, price: e.target.value }))
                }
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Duração (min)</Label>
              <Input
                type="number"
                min="0"
                value={serviceForm.duration}
                onChange={(e) =>
                  setServiceForm((f) => ({ ...f, duration: e.target.value }))
                }
                placeholder="30"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input
                value={serviceForm.description}
                onChange={(e) =>
                  setServiceForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Opcional"
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Switch
                checked={serviceForm.active}
                onCheckedChange={(v) =>
                  setServiceForm((f) => ({ ...f, active: v }))
                }
              />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setServiceDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveService}
              disabled={
                createServiceMutation.isPending ||
                updateServiceMutation.isPending
              }
            >
              {createServiceMutation.isPending ||
              updateServiceMutation.isPending
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
