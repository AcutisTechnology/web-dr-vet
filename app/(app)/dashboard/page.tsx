"use client";
import {
  Calendar,
  ShoppingCart,
  AlertTriangle,
  BedDouble,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PIE_COLORS = [
  "var(--primary)",
  "var(--accent)",
  "var(--warning)",
  "var(--info)",
  "var(--destructive)",
  "var(--success)",
  "var(--secondary-foreground)",
];

const statusColors: Record<
  string,
  "info" | "success" | "warning" | "secondary" | "destructive"
> = {
  scheduled: "info",
  confirmed: "success",
  in_progress: "warning",
  completed: "secondary",
  cancelled: "destructive",
};
const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  in_progress: "Em atendimento",
  completed: "Concluído",
  cancelled: "Cancelado",
};

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading, refetch } = useDashboardStats();

  const weeklySalesChart = (stats?.weekly_sales ?? []).map((d) => ({
    day: format(parseISO(d.date), "EEE", { locale: ptBR }),
    vendas: Number(d.total),
    count: d.count,
  }));

  const weeklyApptsChart = (stats?.weekly_appointments ?? []).map((d) => ({
    day: format(parseISO(d.date), "EEE", { locale: ptBR }),
    atendimentos: d.count,
  }));

  const servicesBreakdown = (stats?.services_breakdown ?? []).map((s, i) => ({
    ...s,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold [font-family:var(--font-heading)]">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Visão geral do dia</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          title="Atualizar"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Atendimentos Hoje"
          value={
            (stats?.today_appointments.scheduled ?? 0) +
            (stats?.today_appointments.confirmed ?? 0) +
            (stats?.today_appointments.in_progress ?? 0)
          }
          sub={`${stats?.today_appointments.completed ?? 0} concluídos`}
          icon={Calendar}
          color="bg-primary"
        />
        <KpiCard
          title="Vendas do Dia"
          value={formatCurrency(stats?.today_sales.revenue ?? 0)}
          sub={`${stats?.today_sales.total ?? 0} transações`}
          icon={ShoppingCart}
          color="bg-success"
        />
        <KpiCard
          title="Internações Ativas"
          value={stats?.active_hospitalizations.total ?? 0}
          sub="animais internados"
          icon={BedDouble}
          color="bg-accent"
        />
        <KpiCard
          title="Estoque Baixo"
          value={stats?.low_stock_products.total ?? 0}
          sub="produtos abaixo do mínimo"
          icon={AlertTriangle}
          color={
            (stats?.low_stock_products.total ?? 0) > 0
              ? "bg-destructive"
              : "bg-muted-foreground"
          }
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Vendas da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklySalesChart}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Area
                  type="monotone"
                  dataKey="vendas"
                  stroke="var(--primary)"
                  fill="url(#colorVendas)"
                  strokeWidth={2}
                  name="Vendas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Serviços por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {servicesBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-16">
                Sem dados
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={servicesBreakdown}
                    cx="50%"
                    cy="45%"
                    outerRadius={70}
                    dataKey="value"
                  >
                    {servicesBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Agenda de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(stats?.today_appointments.list ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum agendamento hoje
              </p>
            ) : (
              <div className="space-y-2">
                {stats?.today_appointments.list.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-lg">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {appt.service_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {appt.start_time} – {appt.end_time}
                          {appt.pet && ` · ${appt.pet.name}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusColors[appt.status] ?? "secondary"}>
                      {statusLabels[appt.status] ?? appt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" /> Alertas de
              Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(stats?.low_stock_products.list ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum alerta de estoque
              </p>
            ) : (
              <div className="space-y-2">
                {stats?.low_stock_products.list.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Mínimo: {p.min_stock} {p.unit}
                      </p>
                    </div>
                    <Badge variant={p.stock === 0 ? "destructive" : "warning"}>
                      {p.stock} {p.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Atendimentos bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atendimentos por Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyApptsChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar
                dataKey="atendimentos"
                fill="var(--accent)"
                radius={[4, 4, 0, 0]}
                name="Atendimentos"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
