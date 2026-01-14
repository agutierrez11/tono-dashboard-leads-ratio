
import { useState } from "react";
import { Download, TrendingUp, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LeadChart } from "@/components/dashboard/LeadChart";
import { ChannelMetrics } from "@/components/dashboard/ChannelMetrics";
import { useLeads, useLeadStats } from "@/hooks/useLeads";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Timeframe } from "@/utils/types";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { toast } from "sonner";

const Reports = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>("monthly");
  const { data: leads = [], isLoading } = useLeads();
  const { stats } = useLeadStats();

  // Calculate channel distribution
  const channelData = [
    { name: "LinkedIn", value: stats.byChannel.linkedin, color: "#0A66C2" },
    { name: "Teléfono", value: stats.byChannel.phone, color: "#34D399" },
    { name: "Email", value: stats.byChannel.email, color: "#F59E0B" },
  ];

  // Calculate status distribution
  const statusLabels: Record<string, string> = {
    new: "Nuevo",
    contacted: "Contactado",
    qualified: "Calificado",
    proposal: "Propuesta",
    closed: "Cerrado",
    lost: "Perdido"
  };

  const statusColors: Record<string, string> = {
    new: "#94A3B8",
    contacted: "#38BDF8",
    qualified: "#818CF8",
    proposal: "#F97316",
    closed: "#22C55E",
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

  // Prepare conversion rate and sales cycle data for charts
  const conversionChartData = stats.conversionRates.map(item => ({
    name: item.channel === "linkedin" ? "LinkedIn" : 
          item.channel === "phone" ? "Teléfono" : "Email",
    value: item.rate,
    color: item.channel === "linkedin" ? "#0A66C2" :
           item.channel === "phone" ? "#34D399" : "#F59E0B"
  }));

  const cycleTimeChartData = stats.salesCycleTimes.map(item => ({
    name: item.channel === "linkedin" ? "LinkedIn" : 
          item.channel === "phone" ? "Teléfono" : "Email",
    value: item.avgDays,
    color: item.channel === "linkedin" ? "#0A66C2" :
           item.channel === "phone" ? "#34D399" : "#F59E0B"
  }));

  const handleDownloadReport = () => {
    toast.success("Reporte descargado exitosamente");
  };

  if (isLoading) {
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
            <p className="text-muted-foreground mt-1">
              Análisis detallado del desempeño de leads en diferentes períodos.
            </p>
          </div>
          <Button onClick={handleDownloadReport} size="sm" className="animate-fade-in">
            <Download className="h-4 w-4 mr-2" />
            Descargar Reporte
          </Button>
        </div>

        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
          <TabsList className="grid grid-cols-3 w-full sm:w-[400px] mb-6">
            <TabsTrigger value="daily">Diario</TabsTrigger>
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
            <TabsTrigger value="monthly">Mensual</TabsTrigger>
          </TabsList>
        </Tabs>

        <LeadChart />
        
        <ChannelMetrics />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <Card className="glass-card animate-slide-up">
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
                      className="animate-fade-in"
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend 
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(value) => <span className="text-sm">{value}</span>}
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card animate-slide-up delay-75">
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
                      className="animate-fade-in"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend 
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(value) => <span className="text-sm">{value}</span>}
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card animate-slide-up">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="flex flex-1 items-center">
                <CardTitle className="text-base font-medium">Tasa de Conversión por Canal</CardTitle>
                <TrendingUp className="ml-2 h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-1 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={conversionChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: '%', position: 'insideLeft', angle: -90, dy: 30 }} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Tasa de Conversión']} />
                  <Bar dataKey="value" name="Conversión" radius={[4, 4, 0, 0]}>
                    {conversionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card animate-slide-up delay-75">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="flex flex-1 items-center">
                <CardTitle className="text-base font-medium">Tiempo de Ciclo de Venta por Canal</CardTitle>
                <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-1 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cycleTimeChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'días', position: 'insideLeft', angle: -90, dy: 40 }} />
                  <Tooltip formatter={(value) => [`${value} días`, 'Tiempo de Ciclo']} />
                  <Bar dataKey="value" name="Días" radius={[4, 4, 0, 0]}>
                    {cycleTimeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
