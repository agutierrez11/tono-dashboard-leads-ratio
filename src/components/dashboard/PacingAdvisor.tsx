import React from "react";
import { useSalesFunnelMetrics } from "@/hooks/useSalesFunnelMetrics";
import { useDailyGoals } from "@/hooks/useDailyGoals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Zap, AlertTriangle, CheckCircle2, Info, TrendingUp } from "lucide-react";

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

  // Default goals (multiplied by 5 to get weekly target)
  const getGoalValue = (type: string, fallback: number) => {
    const goal = dailyGoals.find((g) => g.goal_type === type);
    return (goal ? goal.target_value : fallback) * 5;
  };

  const channelsData = [
    {
      name: "Llamadas Realizadas",
      key: "callsMade",
      actual: currentWeekActuals.callsMade,
      target: getGoalValue("calls_made", 20),
      icon: Zap,
      color: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30",
      accent: "bg-blue-500",
    },
    {
      name: "Correos Enviados",
      key: "emailsSent",
      actual: currentWeekActuals.emailsSent,
      target: getGoalValue("emails_sent", 100),
      icon: Zap,
      color: "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30",
      accent: "bg-purple-500",
    },
    {
      name: "Contactos LinkedIn",
      key: "linkedinContacts",
      actual: currentWeekActuals.linkedinContacts,
      target: getGoalValue("linkedin_contacts", 20),
      icon: Zap,
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
      accent: "bg-emerald-500",
    },
  ];

  // Calculate day of the week progress (Monday = 1 to Friday = 5)
  const today = new Date();
  let dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
  if (dayOfWeek === 0) dayOfWeek = 7; // Sunday is 7
  const workDay = Math.min(dayOfWeek, 5); // Limit progress to 5 working days
  const expectedProgressPercent = (workDay / 5) * 100;

  const processedChannels = channelsData.map((ch) => {
    const progressPercent = ch.target > 0 ? Math.min((ch.actual / ch.target) * 100, 150) : 0;
    const gap = ch.target - ch.actual;

    let status: "acelerar" | "buen-ritmo" | "excelente" | "completado" = "buen-ritmo";
    let statusLabel = "Buen Ritmo";
    let statusColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";
    let advice = "";

    if (ch.actual >= ch.target) {
      status = "completado";
      statusLabel = "Meta Cumplida";
      statusColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      advice = "¡Enhorabuena! Has superado el objetivo de esta semana. Puedes mantener el ritmo o enfocar tus esfuerzos en otros canales.";
    } else if (progressPercent < expectedProgressPercent - 15) {
      status = "acelerar";
      statusLabel = "Poner Acelerador";
      statusColor = "bg-rose-500/10 text-rose-500 border-rose-500/20";
      advice = `Te faltan ${gap} acciones para tu meta semanal. Estás por debajo del ritmo sugerido para hoy (${Math.round(expectedProgressPercent)}%). ¡Prioriza este canal!`;
    } else if (progressPercent >= expectedProgressPercent + 15) {
      status = "excelente";
      statusLabel = "Ritmo Excelente";
      statusColor = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      advice = "Vas adelantado en el cronograma semanal. Buen trabajo manteniendo la constancia en tus prospecciones.";
    } else {
      status = "buen-ritmo";
      statusLabel = "Buen Ritmo";
      statusColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
      advice = `Estás a buen ritmo (${Math.round(progressPercent)}% completado vs ${Math.round(expectedProgressPercent)}% esperado). Sigue así para cerrar la semana con éxito.`;
    }

    return {
      ...ch,
      progressPercent,
      gap,
      status,
      statusLabel,
      statusColor,
      advice,
    };
  });

  const laggingChannels = processedChannels.filter((c) => c.status === "acelerar");
  const completedChannels = processedChannels.filter((c) => c.status === "completado");

  return (
    <div className="space-y-6">
      {/* Dynamic Summary Card */}
      <Card className="border border-white/10 bg-gradient-to-r from-slate-900/60 to-slate-950/60 backdrop-blur-md overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-medium text-white">
              Asistente de Ritmo Comercial (Pacing)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {laggingChannels.length > 0 ? (
            <div className="flex gap-4 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 items-start">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Alerta de Ritmo de Ventas</h4>
                <p className="text-xs text-rose-200/80 mt-1">
                  Estás rezagado en <strong>{laggingChannels.map(c => c.name.split(" ")[1]).join(", ")}</strong> esta semana.
                  Para alcanzar tus proyecciones de cierre, te sugerimos concentrar tus esfuerzos de prospección en estos canales hoy mismo.
                </p>
              </div>
            </div>
          ) : completedChannels.length === processedChannels.length ? (
            <div className="flex gap-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 items-start">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">¡Objetivos Semanales Cumplidos!</h4>
                <p className="text-xs text-emerald-200/80 mt-1">
                  Increíble trabajo. Has completado todas las metas de prospección previstas para la semana.
                  Este nivel de actividad real maximiza tu probabilidad de cumplir las cuotas comerciales del mes.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 items-start">
              <Info className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">En Camino Correcto</h4>
                <p className="text-xs text-blue-200/80 mt-1">
                  Vas a un ritmo saludable respecto al avance esperado de la semana ({Math.round(expectedProgressPercent)}%). 
                  Mantén el esfuerzo diario constante para evitar acumulaciones de trabajo hacia el viernes.
                </p>
              </div>
            </div>
          )}

          {/* Channels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {processedChannels.map((channel) => (
              <div 
                key={channel.key} 
                className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs text-muted-foreground font-medium">{channel.name}</span>
                    <Badge variant="outline" className={`${channel.statusColor} text-[10px] py-0 px-2 font-normal`}>
                      {channel.statusLabel}
                    </Badge>
                  </div>

                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-2xl font-semibold text-white tracking-tight">
                      {channel.actual}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      de {channel.target}
                    </span>
                  </div>

                  <Progress value={channel.progressPercent} className="h-1.5 mb-3" indicatorClassName={channel.accent} />
                </div>

                <p className="text-[11px] leading-relaxed text-muted-foreground/80 mt-2 italic">
                  "{channel.advice}"
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
