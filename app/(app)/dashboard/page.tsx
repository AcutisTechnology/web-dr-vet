"use client";
import { useEffect, useState } from "react";
import {
  Calendar,
  Users,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  BedDouble,
  PawPrint,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatTime } from "@/lib/utils";
import { appointmentsDb } from "@/mocks/db";
import { productsDb } from "@/mocks/db";
import { salesDb } from "@/mocks/db";
import { hospitalizationsDb } from "@/mocks/db";
import { clientsDb } from "@/mocks/db";
import type { Appointment, Product, Sale, Hospitalization } from "@/types";
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

const salesChartData = [
  { day: "Seg", vendas: 420, atendimentos: 8 },
  { day: "Ter", vendas: 680, atendimentos: 12 },
  { day: "Qua", vendas: 540, atendimentos: 9 },
  { day: "Qui", vendas: 890, atendimentos: 15 },
  { day: "Sex", vendas: 1200, atendimentos: 18 },
  { day: "Sáb", vendas: 760, atendimentos: 11 },
  { day: "Dom", vendas: 320, atendimentos: 5 },
];

const servicesPieData = [
  { name: "Consultas", value: 38, color: "#1B2A6B" },
  { name: "Estética", value: 25, color: "#2DC6C6" },
  { name: "Vacinas", value: 18, color: "#f59e0b" },
  { name: "Exames", value: 12, color: "#4f8ef7" },
  { name: "Cirurgias", value: 7, color: "#ef4444" },
];

const statusColors: Record<string, string> = {
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
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [activeHospitalizations, setActiveHospitalizations] = useState<
    Hospitalization[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    Promise.all([
      appointmentsDb.findWhere((a) => a.date.startsWith(today)),
      productsDb.findWhere((p) => p.stock <= p.minStock && p.active),
      salesDb.findWhere((s) => s.createdAt.startsWith(today)),
      hospitalizationsDb.findWhere((h) => h.status === "active"),
    ]).then(([appts, lowStock, sales, hosps]) => {
      setTodayAppointments(appts);
      setLowStockProducts(lowStock);
      setTodaySales(sales);
      setActiveHospitalizations(hosps);
      setLoading(false);
    });
  }, []);

  const todayRevenue = todaySales.reduce((s, sale) => s + sale.total, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral do dia</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Atendimentos Hoje"
          value={
            todayAppointments.filter((a) =>
              ["scheduled", "confirmed", "in_progress"].includes(a.status),
            ).length
          }
          sub={`${todayAppointments.filter((a) => a.status === "completed").length} concluídos`}
          icon={Calendar}
          color="bg-[#1B2A6B]"
        />
        <KpiCard
          title="Vendas do Dia"
          value={formatCurrency(todayRevenue)}
          sub={`${todaySales.length} transações`}
          icon={ShoppingCart}
          color="bg-green-500"
        />
        <KpiCard
          title="Internações Ativas"
          value={activeHospitalizations.length}
          sub="animais internados"
          icon={BedDouble}
          color="bg-[#2DC6C6]"
        />
        <KpiCard
          title="Estoque Baixo"
          value={lowStockProducts.length}
          sub="produtos abaixo do mínimo"
          icon={AlertTriangle}
          color={lowStockProducts.length > 0 ? "bg-red-500" : "bg-gray-400"}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales area chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Vendas da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={salesChartData}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B2A6B" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1B2A6B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Area
                  type="monotone"
                  dataKey="vendas"
                  stroke="#1B2A6B"
                  fill="url(#colorVendas)"
                  strokeWidth={2}
                  name="Vendas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Services pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Serviços por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={servicesPieData}
                  cx="50%"
                  cy="45%"
                  outerRadius={70}
                  dataKey="value"
                >
                  {servicesPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Agenda de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum agendamento hoje
              </p>
            ) : (
              <div className="space-y-2">
                {todayAppointments.slice(0, 6).map((appt) => (
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
                          {appt.serviceType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {appt.startTime} – {appt.endTime}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        statusColors[appt.status] as
                          | "info"
                          | "success"
                          | "warning"
                          | "secondary"
                          | "destructive"
                      }
                    >
                      {statusLabels[appt.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low stock alert */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Alertas de
              Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum alerta de estoque
              </p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.slice(0, 6).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Mínimo: {p.minStock} {p.unit}
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
            <BarChart data={salesChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar
                dataKey="atendimentos"
                fill="#2DC6C6"
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
