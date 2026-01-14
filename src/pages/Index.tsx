import { useMemo } from "react";
import { BarChart3, Linkedin, Phone, Mail, Users, TrendingUp, Clock, Trash2, RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { LeadChart } from "@/components/dashboard/LeadChart";
import { ChannelMetrics } from "@/components/dashboard/ChannelMetrics";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLeadsStore, calculateConversionRates, calculateSalesCycleTimes } from "@/hooks/useLeadsStore";
import { toast } from "sonner";
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
  const { leads, clearAllData, loadMockData, hasMockData } = useLeadsStore();

  const stats = useMemo(() => {
    const totalLeads = leads.length;

    const byChannel = {
      linkedin: leads.filter((lead) => lead.channel === "linkedin").length,
      phone: leads.filter((lead) => lead.channel === "phone").length,
      email: leads.filter((lead) => lead.channel === "email").length,
    };

    // Calculate percentages for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentLeads = leads.filter((lead) => lead.date > thirtyDaysAgo);

    // Generate random trends
    const linkedinTrend = Math.floor(Math.random() * 30) + 5;
    const phoneTrend = Math.floor(Math.random() * 15) + 2;
    const emailTrend = Math.floor(Math.random() * 20) - 5;
    const totalTrend = Math.floor((linkedinTrend + phoneTrend + emailTrend) / 3);

    // Get overall conversion rate and cycle time from leads
    const conversionRates = calculateConversionRates(leads);
    const salesCycleTimes = calculateSalesCycleTimes(leads);

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
        linkedin: { value: linkedinTrend, isPositive: linkedinTrend >= 0 },
        phone: { value: phoneTrend, isPositive: phoneTrend >= 0 },
        email: { value: emailTrend, isPositive: emailTrend >= 0 },
        total: { value: totalTrend, isPositive: totalTrend >= 0 },
      },
    };
  }, [leads]);

  const handleClearData = () => {
    clearAllData();
    toast.success("Todos los datos han sido eliminados. ¡Listo para ingresar datos reales!");
  };

  const handleLoadMockData = () => {
    loadMockData();
    toast.success("Datos de ejemplo cargados");
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitorea el rendimiento de tus leads a través de distintos canales.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {leads.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar datos
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar todos los datos?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará todos los leads actuales ({leads.length} registros). Podrás comenzar a
                      ingresar tus datos reales desde cero.
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
              <Button variant="outline" size="sm" onClick={handleLoadMockData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Cargar datos ejemplo
              </Button>
            )}
            <Button size="sm" className="animate-fade-in" asChild>
              <Link to="/leads">
                <Users className="h-4 w-4 mr-2" />
                Agregar Lead
              </Link>
            </Button>
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Sin datos registrados</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total de Leads"
                value={stats.total}
                icon={<BarChart3 className="h-4 w-4" />}
                description="Todos los canales"
                trend={stats.trends.total}
              />
              <StatCard
                title="LinkedIn"
                value={stats.byChannel.linkedin}
                icon={<Linkedin className="h-4 w-4" />}
                description="Leads vía LinkedIn"
                channel="linkedin"
                trend={stats.trends.linkedin}
              />
              <StatCard
                title="Teléfono"
                value={stats.byChannel.phone}
                icon={<Phone className="h-4 w-4" />}
                description="Leads vía Teléfono"
                channel="phone"
                trend={stats.trends.phone}
              />
              <StatCard
                title="Email"
                value={stats.byChannel.email}
                icon={<Mail className="h-4 w-4" />}
                description="Leads vía Email"
                channel="email"
                trend={stats.trends.email}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <StatCard
                title="Tasa de Conversión"
                value={`${stats.conversionRate}%`}
                icon={<TrendingUp className="h-4 w-4" />}
                description="Promedio general"
                className="lg:col-span-1"
              />
              <StatCard
                title="Ciclo de Venta"
                value={`${stats.salesCycleTime} días`}
                icon={<Clock className="h-4 w-4" />}
                description="Tiempo promedio"
                className="lg:col-span-2"
              />
            </div>

            <LeadChart />

            <ChannelMetrics />

            <div className="mt-4 flex justify-center">
              <Button variant="outline" size="sm" asChild className="animate-fade-in">
                <Link to="/reports">
                  <TrendingUp className="h-4 w-4 mr-2" />
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
