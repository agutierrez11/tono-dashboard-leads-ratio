
import { useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PlusCircle, TrendingUp, Clock, Loader2 } from "lucide-react";
import { Channel, Lead } from "@/utils/types";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import { cn } from "@/lib/utils";
import { useLeads, calculateConversionRates, calculateSalesCycleTimes, generateTimeframeData } from "@/hooks/useLeads";

interface ChannelPageProps {
  channel: Channel;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const ChannelPage = ({ 
  channel, 
  title, 
  description, 
  icon
}: ChannelPageProps) => {
  const { leads, isLoading } = useLeads({ channel });

  const channelColors: Record<Channel, string> = {
    linkedin: "#0A66C2",
    phone: "#34D399",
    email: "#F59E0B"
  };
  
  const color = channelColors[channel];
  
  const metrics = useMemo(() => {
    const conversionRates = calculateConversionRates(leads);
    const salesCycleTimes = calculateSalesCycleTimes(leads);
    const { daily } = generateTimeframeData(leads);

    return {
      count: leads.length,
      conversionRate: conversionRates.find(item => item.channel === channel),
      salesCycleTime: salesCycleTimes.find(item => item.channel === channel),
      dailyData: daily
    };
  }, [leads, channel]);

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
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              {icon}
              <span>{title}</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              {description}
            </p>
          </div>
          <Button size="sm" className="animate-fade-in" asChild>
            <Link to="/leads">
              <PlusCircle className="h-4 w-4 mr-2" />
              Agregar Lead
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title={`Leads vía ${title}`}
            value={metrics.count}
            icon={icon}
            description="Total acumulado"
            channel={channel}
            className="md:col-span-1"
          />
          
          <Card className={cn(
            "glass-card overflow-hidden animate-scale-in md:col-span-2",
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base font-medium">Tendencia reciente</CardTitle>
                <CardDescription>Últimos 14 días</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={metrics.dailyData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id={`color${channel}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey={channel} 
                    stroke={color} 
                    fillOpacity={1} 
                    fill={`url(#color${channel})`}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className={cn(
            "glass-card overflow-hidden animate-slide-up",
          )}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="flex flex-1 items-center">
                <CardTitle className="text-base font-medium">Tasa de Conversión</CardTitle>
                <TrendingUp className="ml-2 h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center text-center">
                <div className={cn(
                  "text-4xl font-bold",
                  `text-${channel}`,
                )}>
                  {metrics.conversionRate?.rate || 0}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {metrics.conversionRate?.closed || 0} de {metrics.conversionRate?.leads || 0} leads convertidos
                </p>
                <div className="w-full mt-4 px-6">
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className={cn("h-3 rounded-full transition-all duration-1000")}
                      style={{ 
                        width: `${Math.min(metrics.conversionRate?.rate || 0, 100)}%`,
                        backgroundColor: color
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "glass-card overflow-hidden animate-slide-up delay-75",
          )}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="flex flex-1 items-center">
                <CardTitle className="text-base font-medium">Ciclo de Venta</CardTitle>
                <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center text-center">
                <div className={cn(
                  "text-4xl font-bold",
                  `text-${channel}`,
                )}>
                  {metrics.salesCycleTime?.avgDays || 0} días
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Basado en {metrics.salesCycleTime?.count || 0} leads cerrados
                </p>
                <div className="w-full mt-4">
                  <ResponsiveContainer width="100%" height={60}>
                    <BarChart data={[
                      { name: "Ciclo", value: metrics.salesCycleTime?.avgDays || 0 }
                    ]}>
                      <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};
