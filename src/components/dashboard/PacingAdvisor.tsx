import React from "react";
import { useMeliCockpit } from "@/hooks/useMeliCockpit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MapPin, MessageSquare, Phone, Trophy, CheckCircle2, Info, TrendingUp, CalendarDays, CheckSquare } from "lucide-react";

export const PacingAdvisor: React.FC = () => {
  const { metrics, activeLeads } = useMeliCockpit();

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Work days remaining in current week (assuming Monday to Friday)
  const remainingWorkDaysOfWeek = isWeekend ? 0 : Math.max(1, 5 - dayOfWeek);
  // Nov 2026 working days (approx 21)
  const remainingDaysOfMonth = 21;

  // Real Weekly Target per channel (5 daily x 5 work days = 25 weekly per channel = 75 total touches weekly)
  const channelsData = [
    {
      name: "Cambaceo / Visita en Calle",
      key: "cambaceo",
      actual: metrics.cambaceoToday || metrics.visitsToday,
      target: 25,
      fallbackDaily: 5,
      icon: MapPin,
      accent: "bg-purple-500",
    },
    {
      name: "WhatsApps a Negocios",
      key: "whatsapp",
      actual: metrics.whatsappsToday,
      target: 25,
      fallbackDaily: 5,
      icon: MessageSquare,
      accent: "bg-emerald-500",
    },
    {
      name: "Llamadas Telefónicas",
      key: "calls",
      actual: metrics.callsToday,
      target: 25,
      fallbackDaily: 5,
      icon: Phone,
      accent: "bg-blue-500",
    },
  ];

  const processedChannels = channelsData.map((ch) => {
    const progressPercent = ch.target > 0 ? Math.min((ch.actual / ch.target) * 100, 100) : 0;
    const gap = Math.max(0, ch.target - ch.actual);

    // Calculate dynamic suggested daily pace for remaining days in the week
    const suggestedDailyPace = isWeekend
      ? 0
      : remainingWorkDaysOfWeek > 0
      ? Math.max(0, gap / remainingWorkDaysOfWeek)
      : gap;

    let status: "acelerar" | "buen-ritmo" | "excelente" | "completado" = "buen-ritmo";
    let statusLabel = isWeekend ? "Planificación" : "Buen Ritmo";
    let statusColor = "bg-blue-500/10 text-blue-500 border-blue-500/20";

    if (ch.actual >= ch.target) {
      status = "completado";
      statusLabel = "Meta Cumplida";
      statusColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    } else if (isWeekend) {
      statusLabel = "Fin de Semana";
      statusColor = "bg-slate-500/10 text-slate-400 border-slate-500/20";
    } else if (ch.actual >= ch.fallbackDaily) {
      status = "excelente";
      statusLabel = "Ritmo Óptimo";
      statusColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    }

    return {
      ...ch,
      progressPercent,
      gap,
      status,
      statusLabel,
      statusColor,
      suggestedDailyPace: isWeekend ? 5 : suggestedDailyPace,
    };
  });

  // Monthly pacing data preparation (Meta Real: 2 cierres en Noviembre)
  const monthlyPacingData = [
    {
      name: "Cierres Ganados Mercado Pago",
      actual: metrics.wonLeadsCount,
      target: 2, // Antonio's November Goal
      unit: "cierres",
      progress: Math.min(100, (metrics.wonLeadsCount / 2) * 100),
      accent: "bg-emerald-500",
      detail: "Meta de arranque noviembre: 2 colocaciones",
    },
    {
      name: "TPV Ganado Transaccionando",
      actual: `$${(metrics.totalWonTpv / 1000).toLocaleString()}k`,
      target: "$900k MXN",
      unit: "MXN",
      progress: Math.min(100, (metrics.totalWonTpv / 900000) * 100),
      accent: "bg-blue-500",
      detail: "Facturación mensual proyectada",
    },
    {
      name: "Toques Totales del Mes",
      actual: metrics.totalTouchesToday,
      target: 315, // 15 daily x 21 work days
      unit: "toques",
      progress: Math.min(100, (metrics.totalTouchesToday / 315) * 100),
      accent: "bg-purple-500",
      detail: "Cadencia de 15 acciones diarias en campo",
    },
    {
      name: "Prospectos Activos en Cartera",
      actual: activeLeads.length,
      target: 50,
      unit: "cuentas",
      progress: Math.min(100, (activeLeads.length / 50) * 100),
      accent: "bg-amber-500",
      detail: "Cartera activa rotando por lotes de 10",
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
          {isWeekend ? (
            <div className="flex gap-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 items-start">
              <Info className="h-5 w-5 shrink-0 mt-0.5 text-blue-400" />
              <div>
                <h4 className="font-semibold text-sm">Fin de Semana • Preparación de Ruta de Prospección</h4>
                <p className="text-xs text-blue-200/80 mt-1">
                  Aprovecha para revisar tu Banco Maestro de Quintana Roo y activar tu lote de 10 cuentas prioritarias para iniciar el lunes con alta velocidad. Tu meta diaria base es de <strong>15 toques combinados</strong> (5 cambaceo, 5 WhatsApp, 5 llamadas) y <strong>2 cierres para el mes de noviembre</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 items-start">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <h4 className="font-semibold text-sm">Cadencia Diaria Calibrada</h4>
                <p className="text-xs text-emerald-200/80 mt-1">
                  Tu meta operativa es de <strong>15 toques diarios</strong>. Mantener este ritmo asegura el volumen de conversión necesario para tus <strong>2 cierres de noviembre</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Weekly Channels Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <CheckSquare className="h-4 w-4 text-primary" />
                Pacing Semanal por Canal Operativo (Meta: 15 toques/día • 75 semanal)
              </h4>
              <Badge variant="outline" className="text-xs bg-slate-800 text-slate-300 border-slate-700">
                {isWeekend ? "Fin de semana" : `${remainingWorkDaysOfWeek} días hábiles rest.`}
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
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <channel.icon className="h-3.5 w-3.5 text-primary" />
                        {channel.name}
                      </span>
                      <Badge variant="outline" className={`${channel.statusColor} text-[10px] py-0 px-2 font-semibold`}>
                        {channel.statusLabel}
                      </Badge>
                    </div>

                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-2xl font-bold text-white tracking-tight">
                        {channel.actual}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        meta hoy: {channel.fallbackDaily}
                      </span>
                    </div>

                    <Progress value={channel.progressPercent} className="h-1.5 mb-3" indicatorClassName={channel.accent} />
                  </div>

                  <div className="bg-slate-950/45 p-2 rounded-lg border border-white/5 text-center mt-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Ritmo Diario Recomendado
                    </p>
                    <p className="text-lg font-extrabold text-primary mt-0.5">
                      {channel.suggestedDailyPace.toFixed(0)}
                      <span className="text-[10px] text-muted-foreground font-normal normal-case"> / día</span>
                    </p>
                    <p className="text-[9px] text-muted-foreground/60 italic mt-0.5">
                      (Meta base: {channel.fallbackDaily}/día)
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
                Objetivos de Noviembre • Mercado Pago
              </h4>
              <Badge variant="outline" className="text-xs bg-slate-800 text-slate-300 border-slate-700">
                {remainingDaysOfMonth} días hábiles en el mes
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {monthlyPacingData.map((item) => (
                <div
                  key={item.name}
                  className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block">
                      {item.name}
                    </span>
                    <div className="flex items-baseline justify-between mt-2 mb-1">
                      <span className="text-xl font-bold text-white tracking-tight">
                        {item.actual}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        meta: {item.target}
                      </span>
                    </div>
                    <Progress value={item.progress} className="h-1.5 mb-2" indicatorClassName={item.accent} />
                  </div>

                  <div className="bg-slate-950/25 p-2 rounded-lg border border-white/5 text-center mt-1">
                    <p className="text-[10px] text-slate-400 font-medium">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
