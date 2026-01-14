
import { useMemo } from "react";
import { BarChart3, Linkedin, Phone, Mail, Users, TrendingUp, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { LeadChart } from "@/components/dashboard/LeadChart";
import { ChannelMetrics } from "@/components/dashboard/ChannelMetrics";
import { mockLeads, conversionRates, salesCycleTimes } from "@/utils/mock-data";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const stats = useMemo(() => {
    const totalLeads = mockLeads.length;
    
    const byChannel = {
      linkedin: mockLeads.filter(lead => lead.channel === "linkedin").length,
      phone: mockLeads.filter(lead => lead.channel === "phone").length,
      email: mockLeads.filter(lead => lead.channel === "email").length,
    };

    // Calculate percentages for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentLeads = mockLeads.filter(lead => lead.date > thirtyDaysAgo);
    const totalRecent = recentLeads.length;
    
    const byChannelRecent = {
      linkedin: recentLeads.filter(lead => lead.channel === "linkedin").length,
      phone: recentLeads.filter(lead => lead.channel === "phone").length,
      email: recentLeads.filter(lead => lead.channel === "email").length,
    };

    // Generate random trends
    const linkedinTrend = Math.floor(Math.random() * 30) + 5;
    const phoneTrend = Math.floor(Math.random() * 15) + 2;
    const emailTrend = Math.floor(Math.random() * 20) - 5;
    const totalTrend = Math.floor((linkedinTrend + phoneTrend + emailTrend) / 3);

    // Get overall conversion rate and cycle time
    const overallConversionRate = conversionRates.reduce((sum, item) => sum + (item.rate * item.leads), 0) / totalLeads;
    const overallCycleTime = salesCycleTimes.reduce((sum, item) => sum + (item.avgDays * item.count), 0) / 
                              salesCycleTimes.reduce((sum, item) => sum + item.count, 0);

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
      }
    };
  }, []);

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
          <Button size="sm" className="animate-fade-in" asChild>
            <Link to="/leads">
              <Users className="h-4 w-4 mr-2" />
              Agregar Lead
            </Link>
          </Button>
        </div>

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
      </div>
    </DashboardLayout>
  );
};

export default Index;
