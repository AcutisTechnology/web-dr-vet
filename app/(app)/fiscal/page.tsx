"use client";
import { useEffect, useState, useCallback } from "react";
import { FileText, Download, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { invoicesDb, clientsDb, salesDb } from "@/mocks/db";
import type { Invoice, Client, Sale } from "@/types";
import { formatCurrency, formatDate, exportToCSV } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const typeLabels: Record<string, string> = { nfce: "NFC-e", nfe: "NF-e", nfse: "NFS-e" };
const statusColors: Record<string, "success" | "warning" | "destructive" | "secondary" | "info"> = {
  issued: "success", pending: "warning", cancelled: "destructive", draft: "secondary", error: "destructive",
};
const statusLabels: Record<string, string> = {
  issued: "Emitida", pending: "Pendente", cancelled: "Cancelada", draft: "Rascunho", error: "Erro",
};

export default function FiscalPage() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const [invs, cls, sls] = await Promise.all([invoicesDb.findAll(), clientsDb.findAll(), salesDb.findAll()]);
    setInvoices(invs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setClients(cls);
    setSales(sls);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = invoices.filter((inv) => {
    const matchType = typeFilter === "all" || inv.type === typeFilter;
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchType && matchStatus;
  });

  const handleCancel = async (inv: Invoice) => {
    if (!confirm("Cancelar esta nota fiscal?")) return;
    await invoicesDb.update(inv.id, { status: "cancelled", cancelDate: new Date().toISOString() });
    toast({ title: "Nota fiscal cancelada" });
    load();
  };

  const handleIssue = async (inv: Invoice) => {
    await invoicesDb.update(inv.id, { status: "issued", issueDate: new Date().toISOString(), number: String(Math.floor(Math.random() * 900000) + 100000) });
    toast({ title: "Nota fiscal emitida (simulação)" });
    load();
  };

  const handleExport = () => {
    exportToCSV(
      filtered.map((inv) => ({
        Número: inv.number ?? "–", Tipo: typeLabels[inv.type], Status: statusLabels[inv.status],
        Valor: inv.amount, Emissão: inv.issueDate ? formatDate(inv.issueDate) : "–",
        Cliente: clients.find((c) => c.id === inv.clientId)?.name ?? "–",
      })),
      "notas-fiscais"
    );
  };

  const totalIssued = invoices.filter((i) => i.status === "issued").reduce((s, i) => s + i.amount, 0);
  const countByType = (type: string) => invoices.filter((i) => i.type === type && i.status === "issued").length;

  if (loading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Fiscal / Notas</h1>
          <p className="text-muted-foreground text-sm">{invoices.filter((i) => i.status === "issued").length} notas emitidas</p>
        </div>
        <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4" /> Exportar</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Emitido", value: formatCurrency(totalIssued), sub: "notas emitidas" },
          { label: "NFC-e", value: countByType("nfce"), sub: "emitidas" },
          { label: "NF-e", value: countByType("nfe"), sub: "emitidas" },
          { label: "NFS-e", value: countByType("nfse"), sub: "emitidas" },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos tipos</SelectItem>
            <SelectItem value="nfce">NFC-e</SelectItem>
            <SelectItem value="nfe">NF-e</SelectItem>
            <SelectItem value="nfse">NFS-e</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="issued">Emitida</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma nota encontrada</TableCell></TableRow>
            )}
            {filtered.map((inv) => {
              const client = clients.find((c) => c.id === inv.clientId);
              return (
                <TableRow key={inv.id} className={inv.status === "cancelled" ? "opacity-50" : ""}>
                  <TableCell className="font-mono text-sm">{inv.number ?? "–"}</TableCell>
                  <TableCell><Badge variant="outline">{typeLabels[inv.type]}</Badge></TableCell>
                  <TableCell className="text-sm">{client?.name ?? "Consumidor Final"}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(inv.amount)}</TableCell>
                  <TableCell><Badge variant={statusColors[inv.status]}>{statusLabels[inv.status]}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{inv.issueDate ? formatDate(inv.issueDate) : "–"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {inv.status === "draft" && (
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => handleIssue(inv)}>Emitir</Button>
                      )}
                      {inv.status === "issued" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Cancelar" onClick={() => handleCancel(inv)}>
                          <X className="w-3 h-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Info card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Ambiente de Demonstração</p>
              <p className="text-blue-700 mt-1">Este módulo simula a emissão de notas fiscais. Em produção, seria integrado com um provedor fiscal (ex: Focus NFe, NFe.io) via API. As notas aqui são apenas registros mock.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
