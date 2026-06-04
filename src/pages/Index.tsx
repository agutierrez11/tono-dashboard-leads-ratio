import { BarChart3, Linkedin, Phone, Mail, Users, TrendingUp, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { LeadChart } from "@/components/dashboard/LeadChart";
import { ChannelMetrics } from "@/components/dashboard/ChannelMetrics";
import { ChannelComparison } from "@/components/dashboard/ChannelComparison";
import { MetricsInstructions } from "@/components/dashboard/MetricsInstructions";
import { DataActions } from "@/components/dashboard/DataActions";
import { DealsTimeline } from "@/components/dashboard/DealsTimeline";
import { PerformanceAnalytics } from "@/components/dashboard/PerformanceAnalytics";
import { FunnelCalculator } from "@/components/dashboard/FunnelCalculator";
import { SalesCompanion } from "@/components/gamification/SalesCompanion";
import { DailyGoalTracker } from "@/components/gamification/DailyGoalTracker";
import { ActivityHistory } from "@/components/gamification/ActivityHistory";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLeadStats, useCreateLead } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const { stats, isLoading } = useLeadStats();
  const createLead = useCreateLead();
  const { user } = useAuth();

  const handleImportData = async (data: any[]) => {
    if (!user) {
      toast.error("Debes iniciar sesión para importar leads");
      return;
    }
    
    console.log("Datos recibidos para importar:", data);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of data) {
      try {
        const leadData = {
          name: item.name || "Sin nombre",
          email: item.email || null,
          phone: item.phone || null,
          company: item.company || null,
          channel: item.channel || "email",
          status: item.status || "new",
          source: null,
          user_id: user.id,
          contacted_at: null,
          closed_at: null,
          next_followup_at: null,
          sale_value: null,
          sale_cycle_days: null,
        };
        
        console.log("Insertando lead:", leadData);
        
        await createLead.mutateAsync(leadData);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error("Error importing lead:", error);
      }
    }
    
    if (successCount > 0) {
      toast.success(`${successCount} leads importados correctamente`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} leads no pudieron importarse`);
    }
  };

  // Calculate overall metrics
  const overallConversionRate = stats.conversionRates.length > 0
    ? stats.conversionRates.reduce((sum, item) => sum + item.rate, 0) / stats.conversionRates.length
    : 0;
  
  const overallCycleTime = stats.salesCycleTimes.length > 0
    ? stats.salesCycleTimes.reduce((sum, item) => sum + item.avgDays, 0) / stats.salesCycleTimes.filter(s => s.count > 0).length || 0
    : 0;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Monitorea el rendimiento de tus leads a través de distintos canales.
              </p>
            </div>
            <Button size="sm" className="animate-fade-in" asChild>
              <Link to="/leads">
                <Users className="h-4 w-4 mr-2" />
                Agregar Lead
              </Link>
            </Button>
          </div>
          <DataActions onImportData={handleImportData} />
        </div>

        {/* Sales Companion - Interactive Avatar */}
        <SalesCompanion />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Leads"
            value={stats.total}
            icon={<BarChart3 className="h-4 w-4" />}
            description="Todos los canales"
            linkTo="/leads-list"
          />
          <StatCard
            title="LinkedIn"
            value={stats.byChannel.linkedin}
            icon={<Linkedin className="h-4 w-4" />}
            description="Leads vía LinkedIn"
            channel="linkedin"
            linkTo="/linkedin"
          />
          <StatCard
            title="Teléfono"
            value={stats.byChannel.phone}
            icon={<Phone className="h-4 w-4" />}
            description="Leads vía Teléfono"
            channel="phone"
            linkTo="/phone"
          />
          <StatCard
            title="Email"
            value={stats.byChannel.email}
            icon={<Mail className="h-4 w-4" />}
            description="Leads vía Email"
            channel="email"
            linkTo="/email"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <StatCard
            title="Tasa de Conversión"
            value={`${overallConversionRate.toFixed(1)}%`}
            icon={<TrendingUp className="h-4 w-4" />}
            description="Promedio general"
            className="lg:col-span-1"
          />
          <StatCard
            title="Ciclo de Venta"
            value={`${overallCycleTime.toFixed(1)} días`}
            icon={<Clock className="h-4 w-4" />}
            description="Tiempo promedio"
            className="lg:col-span-2"
          />
        </div>

        {/* Daily Goal Tracker & Activity History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DailyGoalTracker />
          <ActivityHistory />
        </div>

        <DealsTimeline />

        {/* Tabs para análisis y calculadora */}
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="performance">Análisis de Desempeño</TabsTrigger>
            <TabsTrigger value="calculator">Calculadora de Escenarios</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            <PerformanceAnalytics />
          </TabsContent>

          <TabsContent value="calculator" className="space-y-6">
            <FunnelCalculator />
          </TabsContent>
        </Tabs>

        <LeadChart />
        
        <ChannelMetrics />
        
        <ChannelComparison />
        
        <MetricsInstructions />

        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" asChild className="animate-fade-in">
            <Link to="/reports">
              <TrendingUp className="h-4 w-4 mr-2" />
              Ver reportes detallados
            </Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
