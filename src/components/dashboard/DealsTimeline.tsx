import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeads } from "@/hooks/useLeads";
import { Linkedin, Phone, Mail, Calendar, TrendingUp } from "lucide-react";
import { startOfDay, startOfWeek, startOfMonth, isAfter, format, subDays, subWeeks, subMonths } from "date-fns";
import { es } from "date-fns/locale";

interface PeriodData {
  total: number;
  linkedin: number;
  phone: number;
  email: number;
  previousTotal: number;
  change: number;
}

export const DealsTimeline = () => {
  const { data: leads = [] } = useLeads();
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");

  const periodData = useMemo(() => {
    const now = new Date();
    
    const getStartDate = (p: "day" | "week" | "month") => {
      switch (p) {
        case "day": return startOfDay(now);
        case "week": return startOfWeek(now, { locale: es });
        case "month": return startOfMonth(now);
      }
    };

    const getPreviousStartDate = (p: "day" | "week" | "month") => {
      switch (p) {
        case "day": return startOfDay(subDays(now, 1));
        case "week": return startOfWeek(subWeeks(now, 1), { locale: es });
        case "month": return startOfMonth(subMonths(now, 1));
      }
    };

    const getPreviousEndDate = (p: "day" | "week" | "month") => {
      return getStartDate(p);
    };

    const calculatePeriod = (p: "day" | "week" | "month"): PeriodData => {
      const startDate = getStartDate(p);
      const previousStart = getPreviousStartDate(p);
      const previousEnd = getPreviousEndDate(p);

      const currentLeads = leads.filter(lead => 
        isAfter(new Date(lead.created_at), startDate)
      );

      const previousLeads = leads.filter(lead => {
        const createdAt = new Date(lead.created_at);
        return isAfter(createdAt, previousStart) && !isAfter(createdAt, previousEnd);
      });

      const total = currentLeads.length;
      const previousTotal = previousLeads.length;
      const change = previousTotal > 0 
        ? ((total - previousTotal) / previousTotal) * 100 
        : total > 0 ? 100 : 0;

      return {
        total,
        linkedin: currentLeads.filter(l => l.channel === "linkedin").length,
        phone: currentLeads.filter(l => l.channel === "phone").length,
        email: currentLeads.filter(l => l.channel === "email").length,
        previousTotal,
        change,
      };
    };

    return {
      day: calculatePeriod("day"),
      week: calculatePeriod("week"),
      month: calculatePeriod("month"),
    };
  }, [leads]);

  const currentData = periodData[period];

  const periodLabels = {
    day: "Hoy",
    week: "Esta Semana",
    month: "Este Mes",
  };

  const channelData = [
    { 
      name: "LinkedIn", 
      value: currentData.linkedin, 
      icon: Linkedin, 
      color: "text-linkedin",
      bgColor: "bg-linkedin/10",
      percentage: currentData.total > 0 ? (currentData.linkedin / currentData.total * 100).toFixed(0) : 0
    },
    { 
      name: "Teléfono", 
      value: currentData.phone, 
      icon: Phone, 
      color: "text-phone",
      bgColor: "bg-phone/10",
      percentage: currentData.total > 0 ? (currentData.phone / currentData.total * 100).toFixed(0) : 0
    },
    { 
      name: "Email", 
      value: currentData.email, 
      icon: Mail, 
      color: "text-email",
      bgColor: "bg-email/10",
      percentage: currentData.total > 0 ? (currentData.email / currentData.total * 100).toFixed(0) : 0
    },
  ];

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Deals por Período
            </CardTitle>
            <CardDescription>
              Leads agregados por día, semana y mes
            </CardDescription>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as "day" | "week" | "month")}>
            <TabsList>
              <TabsTrigger value="day">Día</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mes</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Total del período */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center p-6 rounded-xl bg-primary/5 border border-primary/10">
            <span className="text-4xl font-bold text-primary">{currentData.total}</span>
            <span className="text-sm text-muted-foreground mt-1">{periodLabels[period]}</span>
            {currentData.change !== 0 && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${currentData.change > 0 ? 'text-green-600' : 'text-red-500'}`}>
                <TrendingUp className={`h-4 w-4 ${currentData.change < 0 ? 'rotate-180' : ''}`} />
                <span>{currentData.change > 0 ? '+' : ''}{currentData.change.toFixed(0)}%</span>
                <span className="text-muted-foreground text-xs">vs anterior</span>
              </div>
            )}
          </div>

          {/* Desglose por canal */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {channelData.map((channel) => {
              const Icon = channel.icon;
              return (
                <div
                  key={channel.name}
                  className={`flex flex-col p-4 rounded-xl ${channel.bgColor} border border-current/10`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-background/80 ${channel.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={`text-xs font-medium ${channel.color}`}>
                      {channel.percentage}%
                    </span>
                  </div>
                  <span className={`text-2xl font-bold ${channel.color}`}>
                    {channel.value}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {channel.name}
                  </span>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-background/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${channel.color} bg-current rounded-full transition-all duration-500`}
                      style={{ width: `${channel.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumen comparativo */}
        <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <span className="text-2xl font-bold">{periodData.day.total}</span>
            <p className="text-xs text-muted-foreground">Hoy</p>
          </div>
          <div>
            <span className="text-2xl font-bold">{periodData.week.total}</span>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </div>
          <div>
            <span className="text-2xl font-bold">{periodData.month.total}</span>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
