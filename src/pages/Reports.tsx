import { useState } from "react";
import { Download, ArrowLeft, TrendingUp, Calendar } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PerformanceAnalytics } from "@/components/dashboard/PerformanceAnalytics";
import { LeadChart } from "@/components/dashboard/LeadChart";
import { ChannelMetrics } from "@/components/dashboard/ChannelMetrics";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSalesFunnelMetrics, useSalesFunnelTrend } from "@/hooks/useSalesFunnelMetrics";
import { useLeads, useLeadStats } from "@/hooks/useLeads";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const Reports = () => {
  const { metrics, isLoading: metricsLoading } = useSalesFunnelMetrics();
  const trend30 = useSalesFunnelTrend(30);
  const trend90 = useSalesFunnelTrend(90);
  const { data: leads = [], isLoading } = useLeads();
  const { stats } = useLeadStats();
  const [selectedPeriod, setSelectedPeriod] = useState<"30" | "90" | "all">("30");

  const exportToExcel = () => {
    const data = [
      ["REPORTE DE DESEMPEÑO COMERCIAL"],
      [`Generado: ${new Date().toLocaleDateString("es-ES")}`],
      [],
      ["EMBUDO DE VENTAS"],
      ["Etapa", "Cantidad", "Porcentaje", "Conversión desde anterior"],
      ...metrics.stages.map(stage => [
        stage.name,
        stage.count,
        `${stage.percentage.toFixed(1)}%`,
        `${stage.conversionFromPrevious.toFixed(1)}%`,
      ]),
      [],
      ["TASAS DE CONVERSIÓN POR CANAL"],
      ["Canal", "Tasa de Conversión"],
      ...Object.entries(metrics.conversionRateByChannel).map(([channel, rate]) => [
        channel.toUpperCase(),
        `${rate.toFixed(1)}%`,
      ]),
      [],
      ["MÉTRICAS CLAVE"],
      ["Métrica", "Valor"],
      ["Ciclo de Venta Promedio", `${metrics.averageCycleTime.toFixed(1)} días`],
      ["Total de Leads", metrics.totalLeads],
      [],
      ["PROYECCIONES (Si tuvieras 100 contactos)"],
      ["Etapa", "Cantidad Proyectada"],
      ["Contactos", metrics.projections.if100Contacts],
      ["Contactados", metrics.projections.if100Contacted],
      ["Relevantes", metrics.projections.if100Relevant],
      ["Oportunidades", metrics.projections.if100Opportunities],
      ["Clientes", metrics.projections.if100Customers],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `reporte_desempeño_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const selectedTrend = selectedPeriod === "30" ? trend30 : selectedPeriod === "90" ? trend90 : null;

  // Datos para gráficos originales
  const channelData = [
    { name: "LinkedIn", value: stats.byChannel.linkedin, color: "#0A66C2" },
    { name: "Teléfono", value: stats.byChannel.phone, color: "#34D399" },
    { name: "Email", value: stats.byChannel.email, color: "#F59E0B" },
  ];

  const statusLabels: Record<string, string> = {
    new: "Nuevo",
    contacted: "Contactado",
    qualified: "Calificado",
    proposal: "Propuesta",
    won: "Ganado",
    lost: "Perdido"
  };

  const statusColors: Record<string, string> = {
    new: "#94A3B8",
    contacted: "#38BDF8",
    qualified: "#818CF8",
    proposal: "#F97316",
    won: "#22C55E",
    lost: "#EF4444"
  };

  const statusData = Object.entries(
    leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([status, count]) => ({
    name: statusLabels[status] || status,
    value: count,
    color: statusColors[status] || "#94A3B8"
  }));

  if (isLoading || metricsLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-8">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <TrendingUp className="h-8 w-8" />
                Reportes de Desempeño
              </h1>
              <p className="text-muted-foreground mt-1">
                Análisis profundo de tu proceso comercial
              </p>
            </div>
          </div>
          <Button onClick={exportToExcel} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="performance">Análisis de Desempeño</TabsTrigger>
            <TabsTrigger value="trends">Tendencias</TabsTrigger>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
          </TabsList>

          {/* Tab 1: Performance Analytics */}
          <TabsContent value="performance" className="space-y-6">
            <PerformanceAnalytics />
          </TabsContent>

          {/* Tab 2: Trends */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Últimos 30 días", value: "30" },
                { label: "Últimos 90 días", value: "90" },
                { label: "Todo el tiempo", value: "all" },
              ].map(period => (
                <Button
                  key={period.value}
                  variant={selectedPeriod === period.value ? "default" : "outline"}
                  onClick={() => setSelectedPeriod(period.value as "30" | "90" | "all")}
                  className="w-full"
                >
                  {period.label}
                </Button>
              ))}
            </div>

            {selectedTrend && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Leads en Período</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedTrend.totalLeads}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedPeriod === "30"
                        ? "Últimos 30 días"
                        : selectedPeriod === "90"
                        ? "Últimos 90 días"
                        : "Total"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedTrend.conversionRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedTrend.conversionRate > 20
                        ? "✅ Excelente"
                        : selectedTrend.conversionRate > 10
                        ? "⚠️ Promedio"
                        : "❌ Bajo"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Ciclo Promedio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedTrend.averageCycleTime.toFixed(0)}d
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">días</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Mejor Canal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className="mt-2">
                      {selectedTrend.topChannel?.toUpperCase() || "N/A"}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Tab 3: Charts */}
          <TabsContent value="charts" className="space-y-6">
            <LeadChart />
            <ChannelMetrics />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Distribución por Canal</CardTitle>
                </CardHeader>
                <CardContent className="p-1 h-[300px]">
                  {stats.total === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No hay datos disponibles
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={channelData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          animationDuration={800}
                        >
                          {channelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Distribución por Estado</CardTitle>
                </CardHeader>
                <CardContent className="p-1 h-[300px]">
                  {statusData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No hay datos disponibles
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          animationDuration={800}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
