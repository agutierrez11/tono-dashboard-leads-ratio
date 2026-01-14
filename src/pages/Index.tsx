import { useMemo, useState } from "react";
import { BarChart3, Linkedin, Phone, Mail, Users, TrendingUp, Clock, Trash2, RefreshCw, Calendar } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { LeadChart } from "@/components/dashboard/LeadChart";
import { ChannelMetrics } from "@/components/dashboard/ChannelMetrics";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { ChannelComparison } from "@/components/dashboard/ChannelComparison";
import { FollowUpReminders } from "@/components/dashboard/FollowUpReminders";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { useLeadsStore, calculateConversionRates, calculateSalesCycleTimes } from "@/hooks/useLeadsStore";
import { toast } from "sonner";
import { Timeframe } from "@/utils/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Index = () => {
  const { leads, clearAllData, loadMockData } = useLeadsStore();
  const [timeframe, setTimeframe] = useState<Timeframe>("weekly");

  const stats = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case "daily":
        startDate.setDate(now.getDate() - 1);
        break;
      case "weekly":
        startDate.setDate(now.getDate() - 7);
        break;
      case "monthly":
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const filteredLeads = leads.filter(lead => lead.date >= startDate);
    const totalLeads = filteredLeads.length;

    const byChannel = {
      linkedin: filteredLeads.filter((lead) => lead.channel === "linkedin").length,
      phone: filteredLeads.filter((lead) => lead.channel === "phone").length,
      email: filteredLeads.filter((lead) => lead.channel === "email").length,
    };

    // Calculate trends based on previous period
    const prevStartDate = new Date(startDate);
    const prevEndDate = new Date(startDate);
    switch (timeframe) {
      case "daily":
        prevStartDate.setDate(prevStartDate.getDate() - 1);
        break;
      case "weekly":
        prevStartDate.setDate(prevStartDate.getDate() - 7);
        break;
      case "monthly":
        prevStartDate.setMonth(prevStartDate.getMonth() - 1);
        break;
    }

    const prevLeads = leads.filter(lead => lead.date >= prevStartDate && lead.date < prevEndDate);
    const prevTotal = prevLeads.length;
    const prevLinkedin = prevLeads.filter(l => l.channel === "linkedin").length;
    const prevPhone = prevLeads.filter(l => l.channel === "phone").length;
    const prevEmail = prevLeads.filter(l => l.channel === "email").length;

    const calcTrend = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };

    const conversionRates = calculateConversionRates(filteredLeads);
    const salesCycleTimes = calculateSalesCycleTimes(filteredLeads);

    const overallConversionRate =
      totalLeads > 0 ? conversionRates.reduce((sum, item) => sum + item.rate * item.leads, 0) / totalLeads : 0;
    const totalCycleCount = salesCycleTimes.reduce((sum, item) => sum + item.count, 0);
    const overallCycleTime =
      totalCycleCount > 0
        ? salesCycleTimes.reduce((sum, item) => sum + item.avgDays * item.count, 0) / totalCycleCount
        : 0;

    return {
      total: totalLeads,
      byChannel,
      conversionRate: parseFloat(overallConversionRate.toFixed(1)),
      salesCycleTime: parseFloat(overallCycleTime.toFixed(1)),
      trends: {
        linkedin: { value: calcTrend(byChannel.linkedin, prevLinkedin), isPositive: byChannel.linkedin >= prevLinkedin },
        phone: { value: calcTrend(byChannel.phone, prevPhone), isPositive: byChannel.phone >= prevPhone },
        email: { value: calcTrend(byChannel.email, prevEmail), isPositive: byChannel.email >= prevEmail },
        total: { value: calcTrend(totalLeads, prevTotal), isPositive: totalLeads >= prevTotal },
      },
    };
  }, [leads, timeframe]);

  const handleClearData = () => {
    clearAllData();
    toast.success("Todos los datos han sido eliminados. ¡Listo para ingresar datos reales!");
  };

  const handleLoadMockData = () => {
    loadMockData();
    toast.success("Datos de ejemplo cargados");
  };

  const getTimeframeLabel = (tf: Timeframe): string => {
    switch (tf) {
      case "daily": return "Hoy";
      case "weekly": return "Semana";
      case "monthly": return "Mes";
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Monitorea el rendimiento de tus leads
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {leads.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive text-xs sm:text-sm">
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Limpiar datos</span>
                      <span className="sm:hidden">Limpiar</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar todos los datos?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará todos los leads actuales ({leads.length} registros).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearData}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar todo
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {leads.length === 0 && (
                <Button variant="outline" size="sm" onClick={handleLoadMockData} className="text-xs sm:text-sm">
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Cargar datos ejemplo</span>
                  <span className="sm:hidden">Ejemplo</span>
                </Button>
              )}
              <Button size="sm" className="animate-fade-in text-xs sm:text-sm" asChild>
                <Link to="/leads">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Agregar Lead</span>
                  <span className="sm:hidden">+ Lead</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Timeframe Selector */}
          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)} className="w-full">
            <TabsList className="grid grid-cols-3 w-full sm:w-[300px]">
              <TabsTrigger value="daily" className="text-xs sm:text-sm">
                <Calendar className="h-3 w-3 mr-1 sm:hidden" />
                {getTimeframeLabel("daily")}
              </TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs sm:text-sm">
                <Calendar className="h-3 w-3 mr-1 sm:hidden" />
                {getTimeframeLabel("weekly")}
              </TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs sm:text-sm">
                <Calendar className="h-3 w-3 mr-1 sm:hidden" />
                {getTimeframeLabel("monthly")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
            <div className="rounded-full bg-muted p-4 sm:p-6 mb-4">
              <Users className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Sin datos registrados</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md px-4">
              Comienza a agregar leads reales para ver las métricas de tu pipeline de ventas.
            </p>
            <Button asChild>
              <Link to="/leads">
                <Users className="h-4 w-4 mr-2" />
                Agregar primer lead
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Stat Cards - Mobile: 2 columns, Desktop: 4 columns */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              <StatCard
                title="Total Leads"
                value={stats.total}
                icon={<BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />}
                description="Todos los canales"
                trend={stats.trends.total}
              />
              <StatCard
                title="LinkedIn"
                value={stats.byChannel.linkedin}
                icon={<Linkedin className="h-3 w-3 sm:h-4 sm:w-4" />}
                description="Leads LinkedIn"
                channel="linkedin"
                trend={stats.trends.linkedin}
              />
              <StatCard
                title="Teléfono"
                value={stats.byChannel.phone}
                icon={<Phone className="h-3 w-3 sm:h-4 sm:w-4" />}
                description="Leads Teléfono"
                channel="phone"
                trend={stats.trends.phone}
              />
              <StatCard
                title="Email"
                value={stats.byChannel.email}
                icon={<Mail className="h-3 w-3 sm:h-4 sm:w-4" />}
                description="Leads Email"
                channel="email"
                trend={stats.trends.email}
              />
            </div>

            {/* Conversion & Cycle Stats */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <StatCard
                title="Conversión"
                value={`${stats.conversionRate}%`}
                icon={<TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />}
                description="Promedio general"
              />
              <StatCard
                title="Ciclo Venta"
                value={`${stats.salesCycleTime}d`}
                icon={<Clock className="h-3 w-3 sm:h-4 sm:w-4" />}
                description="Tiempo promedio"
              />
            </div>

            {/* Charts Row 1 - Funnel & Channel Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <FunnelChart />
              <ChannelComparison />
            </div>

            {/* Follow-up Reminders */}
            <FollowUpReminders />

            {/* Lead Chart */}
            <LeadChart />

            {/* Channel Metrics */}
            <ChannelMetrics />

            {/* Reports Link */}
            <div className="mt-2 sm:mt-4 flex justify-center">
              <Button variant="outline" size="sm" asChild className="animate-fade-in text-xs sm:text-sm">
                <Link to="/reports">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Ver reportes detallados
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Index;
