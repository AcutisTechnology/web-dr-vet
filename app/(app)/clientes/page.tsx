"use client";
import { useState, useMemo } from "react";
import { Plus, Search, Eye, Edit, Trash2, PawPrint } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from "@/hooks/use-clients-pets";
import type { Client } from "@/types";
import { formatDate } from "@/lib/utils";

export default function ClientesPage() {
  const { toast } = useToast();
  const { data: clients = [], isLoading } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    notes: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "SP",
    zip: "",
  });

  const filtered = useMemo(
    () =>
      clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search) ||
          (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (c.cpf ?? "").includes(search),
      ),
    [clients, search],
  );

  const openNew = () => {
    setEditingClient(null);
    setForm({
      name: "",
      cpf: "",
      email: "",
      phone: "",
      notes: "",
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "SP",
      zip: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditingClient(c);
    setForm({
      name: c.name,
      cpf: c.cpf ?? "",
      email: c.email ?? "",
      phone: c.phone,
      notes: c.notes ?? "",
      street: c.address?.street ?? "",
      number: c.address?.number ?? "",
      neighborhood: c.address?.neighborhood ?? "",
      city: c.address?.city ?? "",
      state: c.address?.state ?? "SP",
      zip: c.address?.zip ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.phone) {
      toast({
        title: "Nome e telefone são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    const payload = {
      name: form.name,
      cpf: form.cpf || undefined,
      email: form.email || undefined,
      phone: form.phone,
      notes: form.notes || undefined,
      street: form.street || undefined,
      number: form.number || undefined,
      neighborhood: form.neighborhood || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      zip: form.zip || undefined,
    };
    if (editingClient) {
      updateClient.mutate(
        { id: editingClient.id, payload },
        {
          onSuccess: () => {
            toast({ title: "Cliente atualizado" });
            setDialogOpen(false);
          },
          onError: () =>
            toast({
              title: "Erro ao atualizar cliente",
              variant: "destructive",
            }),
        },
      );
    } else {
      createClient.mutate(payload, {
        onSuccess: () => {
          toast({ title: "Cliente cadastrado" });
          setDialogOpen(false);
        },
        onError: () =>
          toast({ title: "Erro ao cadastrar cliente", variant: "destructive" }),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Desativar este cliente?")) return;
    deleteClient.mutate(id, {
      onSuccess: () => toast({ title: "Cliente desativado" }),
      onError: () =>
        toast({ title: "Erro ao desativar cliente", variant: "destructive" }),
    });
  };

  const isSaving = createClient.isPending || updateClient.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes & Pets</h1>
          <p className="text-muted-foreground text-sm">
            {clients.filter((c) => c.active).length} clientes ativos
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Novo Cliente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone, CPF..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum cliente encontrado
              </CardContent>
            </Card>
          )}
          {filtered.map((client) => (
            <Card
              key={client.id}
              className={!client.active ? "opacity-60" : ""}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{client.name}</p>
                      {!client.active && (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                      <span>{client.phone}</span>
                      {client.email && <span>{client.email}</span>}
                      {client.cpf && <span>CPF: {client.cpf}</span>}
                      {client.address && (
                        <span>
                          {client.address.city}/{client.address.state}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <PawPrint className="w-3 h-3" />
                      <span>Cadastrado em {formatDate(client.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      title="Ver ficha"
                    >
                      <Link href={`/clientes/${client.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(client)}
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {client.active && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(client.id)}
                        title="Desativar"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Editar Cliente" : "Novo Cliente"}
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
                <Label>Telefone *</Label>
                <Input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-1.5">
                <Label>CPF</Label>
                <Input
                  value={form.cpf}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cpf: e.target.value }))
                  }
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-3">Endereço</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Rua</Label>
                  <Input
                    value={form.street}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, street: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Número</Label>
                  <Input
                    value={form.number}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, number: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Bairro</Label>
                  <Input
                    value={form.neighborhood}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, neighborhood: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Cidade</Label>
                  <Input
                    value={form.city}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, city: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Estado</Label>
                  <Input
                    value={form.state}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, state: e.target.value }))
                    }
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
