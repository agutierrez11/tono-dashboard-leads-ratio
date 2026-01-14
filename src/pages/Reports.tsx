
import { useMemo, useState } from "react";
import { Download, TrendingUp, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LeadChart } from "@/components/dashboard/LeadChart";
import { ChannelMetrics } from "@/components/dashboard/ChannelMetrics";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { ChannelComparison } from "@/components/charts/ChannelComparison";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timeframe } from "@/utils/types";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { useLeads, calculateConversionRates, calculateSalesCycleTimes, calculateFunnelData } from "@/hooks/useLeads";
import { Loader2 } from "lucide-react";

const Reports = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>("monthly");
  const { leads, isLoading } = useLeads();

  const reportData = useMemo(() => {
    const channelData = [
      { name: "LinkedIn", value: leads.filter(lead => lead.channel === "linkedin").length, color: "#0A66C2" },
      { name: "Teléfono", value: leads.filter(lead => lead.channel === "phone").length, color: "#34D399" },
      { name: "Email", value: leads.filter(lead => lead.channel === "email").length, color: "#F59E0B" },
    ];

    const statusLabels: Record<string, string> = {
      new: "Nuevo",
      contacted: "Contactado",
      negotiation: "Negociación",
      won: "Ganado",
      lost: "Perdido"
    };

    const statusColors: Record<string, string> = {
      new: "#94A3B8",
      contacted: "#38BDF8",
      negotiation: "#818CF8",
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

    const conversionRates = calculateConversionRates(leads);
    const salesCycleTimes = calculateSalesCycleTimes(leads);
    const funnelData = calculateFunnelData(leads);

    const conversionChartData = conversionRates.map(item => ({
      name: item.channel === "linkedin" ? "LinkedIn" : 
            item.channel === "phone" ? "Teléfono" : "Email",
      value: item.rate,
      color: item.channel === "linkedin" ? "#0A66C2" :
             item.channel === "phone" ? "#34D399" : "#F59E0B"
    }));

    const cycleTimeChartData = salesCycleTimes.map(item => ({
      name: item.channel === "linkedin" ? "LinkedIn" : 
            item.channel === "phone" ? "Teléfono" : "Email",
      value: item.avgDays,
      color: item.channel === "linkedin" ? "#0A66C2" :
             item.channel === "phone" ? "#34D399" : "#F59E0B"
    }));

    return { channelData, statusData, conversionChartData, cycleTimeChartData, funnelData };
  }, [leads]);

  const handleDownloadReport = () => {
    toast.success("Reporte descargado exitosamente");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

        <LeadChart leads={leads} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FunnelChart data={reportData.funnelData} />
          <ChannelComparison leads={leads} />
        </div>
        
        <ChannelMetrics leads={leads} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <Card className="glass-card animate-slide-up">
            <CardHeader>
              <CardTitle>Distribución por Canal</CardTitle>
            </CardHeader>
            <CardContent className="p-1 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.channelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    animationDuration={800}
                  >
                    {reportData.channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend 
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card animate-slide-up delay-75">
            <CardHeader>
              <CardTitle>Distribución por Estado</CardTitle>
            </CardHeader>
            <CardContent className="p-1 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    animationDuration={800}
                  >
                    {reportData.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend 
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
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
                  data={reportData.conversionChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: '%', position: 'insideLeft', angle: -90, dy: 30 }} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Tasa de Conversión']} />
                  <Bar dataKey="value" name="Conversión" radius={[4, 4, 0, 0]}>
                    {reportData.conversionChartData.map((entry, index) => (
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
                  data={reportData.cycleTimeChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'días', position: 'insideLeft', angle: -90, dy: 40 }} />
                  <Tooltip formatter={(value) => [`${value} días`, 'Tiempo de Ciclo']} />
                  <Bar dataKey="value" name="Días" radius={[4, 4, 0, 0]}>
                    {reportData.cycleTimeChartData.map((entry, index) => (
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
