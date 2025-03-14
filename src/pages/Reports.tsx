
import { useState } from "react";
import { Linkedin, Phone, Mail, Download } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LeadChart } from "@/components/dashboard/LeadChart";
import { mockLeads } from "@/utils/mock-data";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timeframe } from "@/utils/types";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import { toast } from "sonner";

const Reports = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>("monthly");

  // Calculate channel distribution
  const channelData = [
    { name: "LinkedIn", value: mockLeads.filter(lead => lead.channel === "linkedin").length, color: "#0A66C2" },
    { name: "Teléfono", value: mockLeads.filter(lead => lead.channel === "phone").length, color: "#34D399" },
    { name: "Email", value: mockLeads.filter(lead => lead.channel === "email").length, color: "#F59E0B" },
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
    mockLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([status, count]) => ({
    name: statusLabels[status],
    value: count,
    color: statusColors[status]
  }));

  const handleDownloadReport = () => {
    toast.success("Reporte descargado exitosamente");
  };

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <Card className="glass-card animate-slide-up">
            <CardHeader>
              <CardTitle>Distribución por Canal</CardTitle>
            </CardHeader>
            <CardContent className="p-1 h-[300px]">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
