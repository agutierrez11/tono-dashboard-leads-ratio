
import { useMemo, useState } from "react";
import { BarChart3, Linkedin, Phone, Mail, Users, TrendingUp, Clock, Trash2, Plus, LayoutGrid, Target } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { LeadChart } from "@/components/dashboard/LeadChart";
import { ChannelMetrics } from "@/components/dashboard/ChannelMetrics";
import { LeadPipeline } from "@/components/leads/LeadPipeline";
import { FollowupReminders } from "@/components/leads/FollowupReminders";
import { LeadDetailDialog } from "@/components/leads/LeadDetailDialog";
import { GoalsManager } from "@/components/goals/GoalsManager";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { useLeads, calculateConversionRates, calculateSalesCycleTimes } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { Lead } from "@/utils/types";
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
import { Loader2 } from "lucide-react";

const Index = () => {
  const { signOut } = useAuth();
  const { leads, isLoading, deleteAllLeads, updateLead } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const stats = useMemo(() => {
    const totalLeads = leads.length;

    const byChannel = {
      linkedin: leads.filter((lead) => lead.channel === "linkedin").length,
      phone: leads.filter((lead) => lead.channel === "phone").length,
      email: leads.filter((lead) => lead.channel === "email").length,
    };

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
    };
  }, [leads]);

  const handleClearData = async () => {
    try {
      await deleteAllLeads();
    } catch (error) {
      toast.error("Error al eliminar los datos");
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailOpen(true);
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
            <Button size="sm" className="animate-fade-in" asChild>
              <Link to="/leads">
                <Plus className="h-4 w-4 mr-2" />
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
                <Plus className="h-4 w-4 mr-2" />
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
              />
              <StatCard
                title="LinkedIn"
                value={stats.byChannel.linkedin}
                icon={<Linkedin className="h-4 w-4" />}
                description="Leads vía LinkedIn"
                channel="linkedin"
              />
              <StatCard
                title="Teléfono"
                value={stats.byChannel.phone}
                icon={<Phone className="h-4 w-4" />}
                description="Leads vía Teléfono"
                channel="phone"
              />
              <StatCard
                title="Email"
                value={stats.byChannel.email}
                icon={<Mail className="h-4 w-4" />}
                description="Leads vía Email"
                channel="email"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <StatCard
                title="Tasa de Conversión"
                value={`${stats.conversionRate}%`}
                icon={<TrendingUp className="h-4 w-4" />}
                description="Promedio general"
              />
              <StatCard
                title="Ciclo de Venta"
                value={`${stats.salesCycleTime} días`}
                icon={<Clock className="h-4 w-4" />}
                description="Tiempo promedio"
                className="lg:col-span-2"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Tabs defaultValue="pipeline">
                  <TabsList>
                    <TabsTrigger value="pipeline">
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Pipeline
                    </TabsTrigger>
                    <TabsTrigger value="chart">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Tendencia
                    </TabsTrigger>
                    <TabsTrigger value="goals">
                      <Target className="h-4 w-4 mr-2" />
                      Metas
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="pipeline" className="mt-4">
                    <LeadPipeline 
                      leads={leads} 
                      onLeadClick={handleLeadClick}
                      onStatusChange={async (lead, newStatus) => {
                        try {
                          await updateLead({ id: lead.id, status: newStatus });
                          toast.success("Estado actualizado");
                        } catch {
                          toast.error("Error al actualizar");
                        }
                      }}
                    />
                  </TabsContent>
                  <TabsContent value="chart" className="mt-4">
                    <LeadChart leads={leads} />
                  </TabsContent>
                  <TabsContent value="goals" className="mt-4">
                    <GoalsManager />
                  </TabsContent>
                </Tabs>
              </div>
              
              <div>
                <FollowupReminders leads={leads} onLeadClick={handleLeadClick} />
              </div>
            </div>

            <ChannelMetrics leads={leads} />

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

      <LeadDetailDialog
        lead={selectedLead}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onSave={updateLead}
      />
    </DashboardLayout>
  );
};

export default Index;
