import React from "react";
import { useSalesFunnelMetrics } from "@/hooks/useSalesFunnelMetrics";
import { useDailyGoals } from "@/hooks/useDailyGoals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Zap, AlertTriangle, CheckCircle2, Info, TrendingUp, CalendarDays, CheckSquare } from "lucide-react";

const getWorkingDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  let count = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
};

export const PacingAdvisor: React.FC = () => {
  const { metrics, isLoading: metricsLoading } = useSalesFunnelMetrics(30);
  const { data: dailyGoals = [], isLoading: goalsLoading } = useDailyGoals();

  if (metricsLoading || goalsLoading) {
    return (
      <div className="w-full h-48 flex items-center justify-center rounded-xl border border-white/10 bg-background/20 backdrop-blur-md animate-pulse">
        <span className="text-muted-foreground text-sm">Cargando asistente de ritmo...</span>
      </div>
    );
  }

  // Get current week's actuals (the last summary in the weeklySummaries array)
  const currentWeekActuals = metrics?.weeklySummaries && metrics.weeklySummaries.length > 0
    ? metrics.weeklySummaries[metrics.weeklySummaries.length - 1]
    : {
        callsMade: 0,
        callsConnected: 0,
        emailsSent: 0,
        linkedinContacts: 0,
      };

  // Get daily goal value
  const getDailyGoalValue = (type: string, fallback: number) => {
    const goal = dailyGoals.find((g) => g.goal_type === type);
    return goal ? goal.target_value : fallback;
  };

  const today = new Date();
  const totalWorkDaysInMonth = getWorkingDaysInMonth(today);
  const remainingDaysOfWeek = metrics?.remainingWorkDaysOfWeek ?? 5;
  const remainingDaysOfMonth = metrics?.remainingWorkDaysOfMonth ?? 20;

  // Calculate day of the week progress (Monday = 1 to Friday = 5)
  let dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
  if (dayOfWeek === 0) dayOfWeek = 7; // Sunday is 7
  const workDay = Math.min(dayOfWeek, 5); // Limit progress to 5 working days
  const expectedProgressPercent = (workDay / 5) * 100;

  // Weekly data structure
  const channelsData = [
    {
      name: "Llamadas Realizadas",
      key: "callsMade",
      actual: currentWeekActuals.callsMade,
      target: getDailyGoalValue("calls_made", 20) * 5,
      fallbackDaily: getDailyGoalValue("calls_made", 20),
      icon: Zap,
      accent: "bg-blue-500",
    },
    {
      name: "Correos Enviados",
      key: "emailsSent",
      actual: currentWeekActuals.emailsSent,
      target: getDailyGoalValue("emails_sent", 100) * 5,
      fallbackDaily: getDailyGoalValue("emails_sent", 100),
      icon: Zap,
      accent: "bg-purple-500",
    },
    {
      name: "Contactos LinkedIn",
      key: "linkedinContacts",
      actual: currentWeekActuals.linkedinContacts,
      target: getDailyGoalValue("linkedin_contacts", 20) * 5,
      fallbackDaily: getDailyGoalValue("linkedin_contacts", 20),
      icon: Zap,
      accent: "bg-emerald-500",
    },
  ];

  const processedChannels = channelsData.map((ch) => {
    const progressPercent = ch.target > 0 ? Math.min((ch.actual / ch.target) * 100, 150) : 0;
    const gap = Math.max(0, ch.target - ch.actual);

    // Calculate dynamic suggested daily pace for remaining days in the week
    const suggestedDailyPace = remainingDaysOfWeek > 0 
      ? Math.max(0, gap / remainingDaysOfWeek) 
      : gap;

    let status: "acelerar" | "buen-ritmo" | "excelente" | "completado" = "buen-ritmo";
    let statusLabel = "Buen Ritmo";
    let statusColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";
    let advice = "";

    if (ch.actual >= ch.target) {
      status = "completado";
      statusLabel = "Meta Cumplida";
      statusColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      advice = "¡Objetivo semanal cumplido! Cuota diaria restante: 0.";
    } else if (progressPercent < expectedProgressPercent - 15) {
      status = "acelerar";
      statusLabel = "Aumentar Ritmo";
      statusColor = "bg-rose-500/10 text-rose-500 border-rose-500/20";
      advice = `Faltan ${gap} acciones para la meta semanal. Cuota sugerida: ${suggestedDailyPace.toFixed(1)} / día.`;
    } else if (progressPercent >= expectedProgressPercent + 15) {
      status = "excelente";
      statusLabel = "Adelantado";
      statusColor = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      advice = `Vas adelantado en el plan semanal. Cuota diaria restante: ${suggestedDailyPace.toFixed(1)} / día.`;
    } else {
      status = "buen-ritmo";
      statusLabel = "Buen Ritmo";
      statusColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
      advice = `En buen camino. Mantén ${suggestedDailyPace.toFixed(1)} / día para completar la cuota semanal.`;
    }

    return {
      ...ch,
      progressPercent,
      gap,
      status,
      statusLabel,
      statusColor,
      advice,
      suggestedDailyPace,
    };
  });

  const laggingChannels = processedChannels.filter((c) => c.status === "acelerar");
  const completedChannels = processedChannels.filter((c) => c.status === "completado");

  // Monthly pacing data preparation
  const monthlyPacingData = [
    {
      name: "Llamadas Mensuales",
      actual: metrics?.monthlyActuals?.callsMade ?? 0,
      target: getDailyGoalValue("calls_made", 20) * totalWorkDaysInMonth,
      fallbackDaily: getDailyGoalValue("calls_made", 20),
      accent: "bg-blue-500",
    },
    {
      name: "Correos Mensuales",
      actual: metrics?.monthlyActuals?.emailsSent ?? 0,
      target: getDailyGoalValue("emails_sent", 100) * totalWorkDaysInMonth,
      fallbackDaily: getDailyGoalValue("emails_sent", 100),
      accent: "bg-purple-500",
    },
    {
      name: "LinkedIn Mensuales",
      actual: metrics?.monthlyActuals?.linkedinContacts ?? 0,
      target: getDailyGoalValue("linkedin_contacts", 20) * totalWorkDaysInMonth,
      fallbackDaily: getDailyGoalValue("linkedin_contacts", 20),
      accent: "bg-emerald-500",
    },
    {
      name: "Reuniones Mensuales",
      actual: metrics?.monthlyActuals?.meetingsBooked ?? 0,
      target: getDailyGoalValue("meetings_booked", 1) * totalWorkDaysInMonth,
      fallbackDaily: getDailyGoalValue("meetings_booked", 1),
      accent: "bg-amber-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Dynamic Summary Card */}
      <Card className="border border-white/10 bg-gradient-to-r from-slate-900/60 to-slate-950/60 backdrop-blur-md overflow-hidden relative shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-medium text-white">
              Asistente de Ritmo Comercial Acumulativo (Pacing)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {laggingChannels.length > 0 ? (
            <div className="flex gap-4 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 items-start">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Alerta de Ritmo Comercial</h4>
                <p className="text-xs text-rose-200/80 mt-1">
                  Estás rezagado en <strong>{laggingChannels.map(c => c.name.split(" ")[1]).join(", ")}</strong> esta semana.
                  El pacing ha recalculado tu esfuerzo diario para compensar la cuota pendiente. ¡Prioriza estos canales!
                </p>
              </div>
            </div>
          ) : completedChannels.length === processedChannels.length ? (
            <div className="flex gap-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 items-start">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">¡Objetivos Semanales Cumplidos!</h4>
                <p className="text-xs text-emerald-200/80 mt-1">
                  Has completado todas las metas de prospección previstas para la semana. Las cuotas sugeridas diarias para el resto de la semana han bajado a 0.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 items-start">
              <Info className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Ritmo Ajustado en Progreso</h4>
                <p className="text-xs text-blue-200/80 mt-1">
                  Tu avance semanal va al {Math.round(expectedProgressPercent)}%. Las metas diarias de los días restantes se adaptan automáticamente a tus resultados reales de hoy.
                </p>
              </div>
            </div>
          )}

          {/* Weekly Channels Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <CheckSquare className="h-4 w-4 text-primary" />
                Pacing de Prospección Semanal
              </h4>
              <Badge variant="outline" className="text-xs bg-slate-800 text-slate-300 border-slate-700">
                {remainingDaysOfWeek > 0 ? `${remainingDaysOfWeek} días hábiles rest.` : "Fin de semana"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {processedChannels.map((channel) => (
                <div 
                  key={channel.key} 
                  className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs text-muted-foreground font-medium">{channel.name}</span>
                      <Badge variant="outline" className={`${channel.statusColor} text-[10px] py-0 px-2 font-semibold`}>
                        {channel.statusLabel}
                      </Badge>
                    </div>

                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-2xl font-bold text-white tracking-tight">
                        {channel.actual}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        de {channel.target}
                      </span>
                    </div>

                    <Progress value={channel.progressPercent} className="h-1.5 mb-3" indicatorClassName={channel.accent} />
                  </div>

                  <div className="bg-slate-950/45 p-2 rounded-lg border border-white/5 text-center mt-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Cuota Diaria Restante</p>
                    <p className="text-lg font-extrabold text-primary mt-0.5">
                      {channel.suggestedDailyPace.toFixed(1)}
                      <span className="text-[10px] text-muted-foreground font-normal normal-case"> / día</span>
                    </p>
                    <p className="text-[9px] text-muted-foreground/60 italic mt-0.5">
                      (Original: {channel.fallbackDaily}/día)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 pt-6" />

          {/* Monthly Pacing Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary" />
                Pacing Mensual Acumulado (MTD)
              </h4>
              <Badge variant="outline" className="text-xs bg-slate-800 text-slate-300 border-slate-700">
                {remainingDaysOfMonth} días hábiles rest. en el mes
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {monthlyPacingData.map((channel) => {
                const progressPercent = channel.target > 0 ? Math.min((channel.actual / channel.target) * 100, 100) : 0;
                const gap = Math.max(0, channel.target - channel.actual);
                const suggestedDailyPace = remainingDaysOfMonth > 0 
                  ? Math.max(0, gap / remainingDaysOfMonth) 
                  : gap;

                return (
                  <div 
                    key={channel.name} 
                    className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block">
                        {channel.name}
                      </span>
                      <div className="flex items-baseline justify-between mt-2 mb-1">
                        <span className="text-xl font-bold text-white tracking-tight">
                          {channel.actual}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          de {channel.target}
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-1.5 mb-3" indicatorClassName={channel.accent} />
                    </div>

                    <div className="bg-slate-950/25 p-2 rounded-lg border border-white/5 text-center mt-1">
                      <p className="text-[9px] text-muted-foreground uppercase font-semibold">Cuota Diaria Restante</p>
                      <p className="text-base font-bold text-indigo-400 mt-0.5">
                        {suggestedDailyPace.toFixed(1)}
                        <span className="text-[10px] text-muted-foreground font-normal normal-case"> / día</span>
                      </p>
                      <p className="text-[8px] text-muted-foreground/60 italic">
                        (Original: {channel.fallbackDaily}/día)
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};
