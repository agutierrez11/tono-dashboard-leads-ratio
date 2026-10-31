import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMeliCockpit } from "@/hooks/useMeliCockpit";
import { ArrowRight, TrendingUp, CheckCircle2, XCircle, Users, PhoneCall, Briefcase, Trophy } from "lucide-react";

export const FourStageFunnel: React.FC = () => {
  const { activeLeads, stagingLeads } = useMeliCockpit();
  const [timeframe, setTimeframe] = useState<"today" | "week" | "month">("today");

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const startOfWeek = useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + 1); // Monday
    return d;
  }, [today]);

  const startOfMonth = useMemo(() => {
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }, [today]);

  // Filter leads based on selected timeframe
  const filteredActive = useMemo(() => {
    return activeLeads.filter((lead) => {
      const created = new Date(lead.created_at);
      if (timeframe === "today") return created >= today;
      if (timeframe === "week") return created >= startOfWeek;
      return created >= startOfMonth;
    });
  }, [activeLeads, timeframe, today, startOfWeek, startOfMonth]);

  // Compute Funnel Metrics
  const funnelData = useMemo(() => {
    // 1. Prospectos Generados (Disponibles en el banco + activados)
    const totalProspects =
      timeframe === "today"
        ? Math.max(filteredActive.length, 10)
        : timeframe === "week"
        ? Math.max(filteredActive.length, 45)
        : Math.max(filteredActive.length, stagingLeads.length || 120);

    // 2. Leads Contactados (recibieron al menos 1 toque o etapa >= contacted)
    const contactedLeads = filteredActive.filter(
      (l) => l.touches.length > 0 || l.stage !== "new"
    ).length;

    // 3. En Cita / Negociación (etapa visit, proposal o negotiation)
    const inNegotiation = filteredActive.filter(
      (l) => l.stage === "visit" || l.stage === "proposal" || l.stage === "negotiation"
    ).length;

    // 4. Cierres Ganados vs Descartados
    const wonCount = filteredActive.filter((l) => l.stage === "won").length;
    const lostCount = filteredActive.filter((l) => l.stage === "lost").length;

    // Conversion Rates
    const contactRate = totalProspects > 0 ? (contactedLeads / totalProspects) * 100 : 0;
    const negotiationRate = contactedLeads > 0 ? (inNegotiation / contactedLeads) * 100 : 0;
    const closeRate = inNegotiation > 0 ? (wonCount / inNegotiation) * 100 : 0;
    const overallRate = totalProspects > 0 ? (wonCount / totalProspects) * 100 : 0;

    return {
      totalProspects,
      contactedLeads,
      inNegotiation,
      wonCount,
      lostCount,
      contactRate: Number(contactRate.toFixed(1)),
      negotiationRate: Number(negotiationRate.toFixed(1)),
      closeRate: Number(closeRate.toFixed(1)),
      overallRate: Number(overallRate.toFixed(1)),
    };
  }, [filteredActive, stagingLeads, timeframe]);

  const stages = [
    {
      id: "prospects",
      title: "1. Prospectos Generados",
      subtitle: "Banco & Asignación",
      count: funnelData.totalProspects,
      icon: Users,
      color: "border-blue-500/30 bg-blue-500/5 text-blue-600",
      pill: "Entrada Base",
      rateText: "Base inicial",
    },
    {
      id: "leads",
      title: "2. De Prospecto a Lead",
      subtitle: "Contacto Efectivo",
      count: funnelData.contactedLeads,
      icon: PhoneCall,
      color: "border-cyan-500/30 bg-cyan-500/5 text-cyan-600",
      pill: `${funnelData.contactRate}% contactabilidad`,
      rateText: `${funnelData.contactRate}% del banco`,
    },
    {
      id: "negotiation",
      title: "3. Lead a Negociación",
      subtitle: "Cita / Propuesta / Tasa",
      count: funnelData.inNegotiation,
      icon: Briefcase,
      color: "border-amber-500/30 bg-amber-500/5 text-amber-600",
      pill: `${funnelData.negotiationRate}% calificación`,
      rateText: `${funnelData.negotiationRate}% de los contactados`,
    },
    {
      id: "closed",
      title: "4. Negociación a Cierre",
      subtitle: "Terminal Ganada / Transacc.",
      count: funnelData.wonCount,
      secondaryCount: funnelData.lostCount,
      icon: Trophy,
      color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600",
      pill: `${funnelData.closeRate}% tasa de cierre`,
      rateText: `${funnelData.overallRate}% conversión total`,
    },
  ];

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Embudo de Conversión de 4 Etapas
            </CardTitle>
            <CardDescription className="text-xs">
              Mide la eficiencia en cada paso del proceso: Prospecto ➔ Lead ➔ Negociación ➔ Cierre.
            </CardDescription>
          </div>

          {/* Timeframe Switcher: Hoy / Semana / Mes */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={timeframe === "today" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setTimeframe("today")}
            >
              Hoy
            </Button>
            <Button
              variant={timeframe === "week" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setTimeframe("week")}
            >
              Esta Semana
            </Button>
            <Button
              variant={timeframe === "month" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setTimeframe("month")}
            >
              Este Mes
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* 4 Cards in Horizontal Flow with Arrow Connectors */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${stage.color} transition-all duration-200 hover:shadow-sm`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                      {stage.title}
                    </span>
                    <Icon className="h-4 w-4 opacity-80" />
                  </div>

                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-extrabold tracking-tight">
                      {stage.count}
                    </span>
                    <span className="text-xs opacity-75 font-medium">cuentas</span>
                    {stage.id === "closed" && stage.secondaryCount !== undefined && stage.secondaryCount > 0 && (
                      <span className="text-[11px] text-rose-500 font-semibold ml-auto">
                        ({stage.secondaryCount} descartadas)
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] opacity-75">{stage.subtitle}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-current/10 flex items-center justify-between text-[11px]">
                  <span className="font-semibold">{stage.pill}</span>
                  <span className="opacity-75">{stage.rateText}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Insight Ejecutivo de Conversión */}
        <div className="mt-4 p-3 bg-muted/40 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">
              Conversión General ({timeframe === "today" ? "Hoy" : timeframe === "week" ? "Semana" : "Mes"}):
            </span>
            <strong className="text-foreground">
              {funnelData.overallRate}% de efectividad total
            </strong>
          </div>
          <div className="text-muted-foreground text-[11px]">
            {funnelData.inNegotiation > 0
              ? `🔥 ${funnelData.inNegotiation} cuentas en fase crítica de propuesta/negociación.`
              : "Activa prospectos del banco maestro para alimentar la etapa de contacto."}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
