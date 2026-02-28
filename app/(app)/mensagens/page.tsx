"use client";
import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Plus,
  Edit,
  Trash2,
  Wifi,
  WifiOff,
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  messageTemplatesDb,
  messageLogsDb,
  clientsDb,
  whatsAppConfigDb,
} from "@/mocks/db";
import type {
  MessageTemplate,
  MessageLog,
  Client,
  WhatsAppConfig,
} from "@/types";
import { formatDateTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const typeLabels: Record<string, string> = {
  welcome: "Boas-vindas",
  appointment_confirmation: "Confirmação Agend.",
  appointment_reminder: "Lembrete Agend.",
  vaccine_reminder: "Lembrete Vacina",
  exam_result: "Resultado Exame",
  birthday: "Aniversário Pet",
  daily_agenda: "Agenda Diária",
  custom: "Personalizado",
};
const statusColors: Record<
  string,
  "success" | "info" | "warning" | "destructive" | "secondary"
> = {
  sent: "info",
  delivered: "success",
  read: "success",
  failed: "destructive",
  pending: "warning",
};
const statusLabels: Record<string, string> = {
  sent: "Enviado",
  delivered: "Entregue",
  read: "Lido",
  failed: "Falhou",
  pending: "Pendente",
};

export default function MensagensPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<MessageTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    type: "custom" as MessageTemplate["type"],
    content: "",
    active: true,
    triggerDaysBefore: "",
    scheduledTime: "",
  });
  const [sendForm, setSendForm] = useState({
    templateId: "",
    clientId: "",
    customMessage: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [tmps, lgss, cls, cfg] = await Promise.all([
      messageTemplatesDb.findAll(),
      messageLogsDb.findAll(),
      clientsDb.findAll(),
      whatsAppConfigDb.get(),
    ]);
    setTemplates(tmps);
    setLogs(
      lgss.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
    setClients(cls.filter((c) => c.active));
    setConfig(cfg);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: "",
      type: "custom",
      content: "",
      active: true,
      triggerDaysBefore: "",
      scheduledTime: "",
    });
    setTemplateDialogOpen(true);
  };

  const openEditTemplate = (t: MessageTemplate) => {
    setEditingTemplate(t);
    setTemplateForm({
      name: t.name,
      type: t.type,
      content: t.content,
      active: t.active,
      triggerDaysBefore: t.triggerDaysBefore ? String(t.triggerDaysBefore) : "",
      scheduledTime: t.scheduledTime ?? "",
    });
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.content) {
      toast({
        title: "Nome e conteúdo são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    const payload = {
      name: templateForm.name,
      type: templateForm.type,
      content: templateForm.content,
      active: templateForm.active,
      triggerDaysBefore: templateForm.triggerDaysBefore
        ? parseInt(templateForm.triggerDaysBefore)
        : undefined,
      scheduledTime: templateForm.scheduledTime || undefined,
    };
    if (editingTemplate) {
      await messageTemplatesDb.update(editingTemplate.id, payload);
      toast({ title: "Template atualizado" });
    } else {
      await messageTemplatesDb.create(payload);
      toast({ title: "Template criado" });
    }
    setTemplateDialogOpen(false);
    load();
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Excluir este template?")) return;
    await messageTemplatesDb.delete(id);
    toast({ title: "Template excluído" });
    load();
  };

  const handleSendMessage = async () => {
    const template = templates.find((t) => t.id === sendForm.templateId);
    const client = clients.find((c) => c.id === sendForm.clientId);
    if (!client) {
      toast({ title: "Selecione um cliente", variant: "destructive" });
      return;
    }
    const content =
      sendForm.customMessage ||
      template?.content.replace("{{nome}}", client.name) ||
      "";
    await messageLogsDb.create({
      templateId: sendForm.templateId || undefined,
      clientId: client.id,
      phone: client.phone,
      content,
      status: "sent",
      sentAt: new Date().toISOString(),
    });
    toast({ title: `Mensagem enviada para ${client.name} (simulação)` });
    setSendDialogOpen(false);
    setSendForm({ templateId: "", clientId: "", customMessage: "" });
    load();
  };

  const handleToggleConnect = async () => {
    if (!config) return;
    await whatsAppConfigDb.update({ connected: !config.connected });
    toast({
      title: config.connected
        ? "WhatsApp desconectado"
        : "WhatsApp conectado (simulação)",
    });
    load();
  };

  const totalSent = logs.length;
  const delivered = logs.filter(
    (l) => l.status === "delivered" || l.status === "read",
  ).length;
  const failed = logs.filter((l) => l.status === "failed").length;

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
          <h1 className="text-2xl font-bold">Mensagens / WhatsApp</h1>
          <p className="text-muted-foreground text-sm">
            Templates e histórico de envios
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSendDialogOpen(true)}>
            <Send className="w-4 h-4" /> Enviar Mensagem
          </Button>
          <Button onClick={openNewTemplate}>
            <Plus className="w-4 h-4" /> Novo Template
          </Button>
        </div>
      </div>

      {/* WhatsApp status */}
      <Card
        className={
          config?.connected
            ? "border-green-200 bg-green-50"
            : "border-red-200 bg-red-50"
        }
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {config?.connected ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p
                  className={`font-medium ${config?.connected ? "text-green-800" : "text-red-800"}`}
                >
                  WhatsApp {config?.connected ? "Conectado" : "Desconectado"}
                </p>
                {config?.phone && (
                  <p className="text-sm text-muted-foreground">
                    {config.phone}
                  </p>
                )}
              </div>
              {config?.connected && (
                <Badge variant="success">{config.credits} créditos</Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleToggleConnect}>
              {config?.connected ? "Desconectar" : "Conectar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Enviados", value: totalSent, color: "text-blue-600" },
          {
            label: "Entregues/Lidos",
            value: delivered,
            color: "text-green-600",
          },
          { label: "Falhas", value: failed, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">
            Templates ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="history">Histórico ({logs.length})</TabsTrigger>
        </TabsList>

        {/* Templates */}
        <TabsContent value="templates" className="mt-3 space-y-3">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum template cadastrado
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((t) => (
                <Card key={t.id} className={!t.active ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{t.name}</p>
                          {!t.active && (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {typeLabels[t.type]}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {t.content}
                        </p>
                        {t.triggerDaysBefore && (
                          <p className="text-xs text-blue-600 mt-1">
                            Disparo: {t.triggerDaysBefore} dia(s) antes
                          </p>
                        )}
                        {t.scheduledTime && (
                          <p className="text-xs text-purple-600 mt-1">
                            Horário: {t.scheduledTime}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditTemplate(t)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDeleteTemplate(t.id)}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="mt-3">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      Nenhuma mensagem enviada
                    </TableCell>
                  </TableRow>
                )}
                {logs.map((log) => {
                  const client = clients.find((c) => c.id === log.clientId);
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {log.sentAt ? formatDateTime(log.sentAt) : "–"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {client?.name ?? "–"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.phone}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {log.content}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[log.status]}>
                          {statusLabels[log.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Editar Template" : "Novo Template"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nome *</Label>
                <Input
                  value={templateForm.name}
                  onChange={(e) =>
                    setTemplateForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select
                  value={templateForm.type}
                  onValueChange={(v) =>
                    setTemplateForm((f) => ({
                      ...f,
                      type: v as MessageTemplate["type"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Horário Agendado</Label>
                <Input
                  type="time"
                  value={templateForm.scheduledTime}
                  onChange={(e) =>
                    setTemplateForm((f) => ({
                      ...f,
                      scheduledTime: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Conteúdo *</Label>
                <Textarea
                  value={templateForm.content}
                  onChange={(e) =>
                    setTemplateForm((f) => ({ ...f, content: e.target.value }))
                  }
                  rows={4}
                  placeholder="Use {{nome}}, {{pet}}, {{data}}, {{hora}}, {{servico}}..."
                />
                <p className="text-xs text-muted-foreground">
                  Variáveis: {"{{nome}}"}, {"{{pet}}"}, {"{{data}}"},{" "}
                  {"{{hora}}"}, {"{{servico}}"}, {"{{vacina}}"}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Dias antes do disparo</Label>
                <Input
                  type="number"
                  min="1"
                  value={templateForm.triggerDaysBefore}
                  onChange={(e) =>
                    setTemplateForm((f) => ({
                      ...f,
                      triggerDaysBefore: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <Switch
                  checked={templateForm.active}
                  onCheckedChange={(v) =>
                    setTemplateForm((f) => ({ ...f, active: v }))
                  }
                  id="active"
                />
                <Label htmlFor="active">Ativo</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTemplateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveTemplate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Mensagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Select
                value={sendForm.clientId}
                onValueChange={(v) =>
                  setSendForm((f) => ({ ...f, clientId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} – {c.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Template</Label>
              <Select
                value={sendForm.templateId || "__none__"}
                onValueChange={(v) => {
                  const realId = v === "__none__" ? "" : v;
                  const t = templates.find((t) => t.id === realId);
                  setSendForm((f) => ({
                    ...f,
                    templateId: realId,
                    customMessage: t?.content ?? f.customMessage,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    Mensagem personalizada
                  </SelectItem>
                  {templates
                    .filter((t) => t.active)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Mensagem</Label>
              <Textarea
                value={sendForm.customMessage}
                onChange={(e) =>
                  setSendForm((f) => ({ ...f, customMessage: e.target.value }))
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendMessage} disabled={!config?.connected}>
              <Send className="w-4 h-4" /> Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
