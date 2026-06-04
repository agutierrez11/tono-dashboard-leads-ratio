import { useState, useMemo, useEffect } from "react";
import { useFunnelMetrics } from "@/contexts/FunnelMetricsContext";
import { useSavedScenarios } from "@/hooks/useSavedScenarios";
import { Linkedin, Users, MessageSquare, Calendar, Trophy, TrendingUp, TrendingDown, RefreshCw, Save, Info, Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const FUNNEL_COLORS = {
  prospectos: "bg-[#475569]",
  conectados: "bg-[#eab308]",
  agendadas: "bg-[#a855f7]",
  realizadas: "bg-[#3b82f6]",
  ventas: "bg-[#22c55e]",
};

const benchmarks = {
  conectadosProspectos: { min: 20, max: 40, avg: 30 },
  agendadasConectados: { min: 10, max: 25, avg: 15 },
  realizadasAgendadas: { min: 60, max: 80, avg: 70 },
  ventasRealizadas: { min: 15, max: 30, avg: 20 },
};

export const ProspectFunnelCalculator = () => {
  const { prospectMetrics, isRealDataActive, setIsRealDataActive, resetToRealData } = useFunnelMetrics();
  const { saveScenario } = useSavedScenarios();

  const [useRealRates, setUseRealRates] = useState(true);
  const [targetCloses, setTargetCloses] = useState(2);
  const [scenarioName, setScenarioName] = useState("");

  // Rates and inputs state
  const [rates, setRates] = useState({
    connectRate: benchmarks.conectadosProspectos.avg,
    meetingRate: benchmarks.agendadasConectados.avg,
    showRate: benchmarks.realizadasAgendadas.avg,
    closeRate: benchmarks.ventasRealizadas.avg,
    ticketPromedio: 15000,
  });

  // Calculate real rates from Supabase activities context
  const dbRates = useMemo(() => {
    const { prospectosGenerados, prospectosContactados, reunionesGeneradas, reunionesRealizadas, ventas, ticketPromedio } = prospectMetrics;
    const connectRate = prospectosGenerados > 0 ? (prospectosContactados / prospectosGenerados) * 100 : benchmarks.conectadosProspectos.avg;
    const meetingRate = prospectosContactados > 0 ? (reunionesGeneradas / prospectosContactados) * 100 : benchmarks.agendadasConectados.avg;
    const showRate = reunionesGeneradas > 0 ? (reunionesRealizadas / reunionesGeneradas) * 100 : benchmarks.realizadasAgendadas.avg;
    const closeRate = reunionesRealizadas > 0 ? (ventas / reunionesRealizadas) * 100 : benchmarks.ventasRealizadas.avg;

    return {
      connectRate: Math.round(connectRate),
      meetingRate: Math.round(meetingRate),
      showRate: Math.round(showRate),
      closeRate: Math.round(closeRate),
      ticketPromedio: Math.round(ticketPromedio > 0 ? ticketPromedio : 15000),
      hasData: prospectosGenerados > 0
    };
  }, [prospectMetrics]);

  // Sync rates when "useRealRates" is active and dbRates exist
  useEffect(() => {
    if (useRealRates && dbRates) {
      setRates({
        connectRate: dbRates.connectRate,
        meetingRate: dbRates.meetingRate,
        showRate: dbRates.showRate,
        closeRate: dbRates.closeRate,
        ticketPromedio: dbRates.ticketPromedio,
      });
    }
  }, [useRealRates, dbRates]);

  // Calculate simulated activity required to hit the target sales
  const projections = useMemo(() => {
    const rConnect = rates.connectRate / 100;
    const rMeet = rates.meetingRate / 100;
    const rShow = rates.showRate / 100;
    const rClose = rates.closeRate / 100;

    const realizadasReq = Math.ceil(targetCloses / (rClose || 0.2));
    const agendadasReq = Math.ceil(realizadasReq / (rShow || 0.7));
    const conectadosReq = Math.ceil(agendadasReq / (rMeet || 0.15));
    const prospectosReq = Math.ceil(conectadosReq / (rConnect || 0.3));

    return {
      realizadas: realizadasReq,
      agendadas: agendadasReq,
      conectados: conectadosReq,
      prospectos: prospectosReq,
      diario: Math.ceil(prospectosReq / 20), // 20 days pacing
      ingresos: targetCloses * rates.ticketPromedio,
    };
  }, [targetCloses, rates]);

  const handleSliderChange = (key: keyof Omit<typeof rates, "ticketPromedio">, val: number) => {
    setUseRealRates(false);
    setIsRealDataActive(false);
    setRates((prev) => ({ ...prev, [key]: val }));
  };

  const handleTicketChange = (val: number) => {
    setUseRealRates(false);
    setIsRealDataActive(false);
    setRates((prev) => ({ ...prev, ticketPromedio: val }));
  };

  const handleSave = () => {
    if (!scenarioName.trim()) return;
    saveScenario(scenarioName, "linkedin", { ...rates, targetCloses });
    setScenarioName("");
  };

  const getStatusIcon = (val: number, benchmark: { min: number; max: number; avg: number }) => {
    if (val >= benchmark.avg) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (val >= benchmark.min) return <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs">─</span>;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 pt-4">
        {/* Toggle Real Data vs Simulation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-blue-50/40 dark:bg-blue-950/15 p-4 rounded-xl border border-blue-100/80 dark:border-blue-900/30">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Usar Conversión de LinkedIn Real (Supabase)</span>
              {dbRates.hasData ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Conectado</Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/35 font-semibold">Sin Historial (Benchmarks)</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {useRealRates 
                ? "Utilizando tasas reales de LinkedIn. Mueve los sliders para simular objetivos futuros." 
                : "Modo Simulación activo. Estás prediciendo la cantidad de invitaciones a enviar."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!useRealRates && dbRates.hasData && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setUseRealRates(true);
                  resetToRealData();
                }}
                className="h-8 gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Restablecer Real
              </Button>
            )}
            <Switch
              checked={useRealRates}
              onCheckedChange={setUseRealRates}
              disabled={!dbRates.hasData}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
              <Linkedin className="w-4 h-4 text-primary" />
              1. Parámetros de LinkedIn Social Selling
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Meta de Ventas (Cierres)</Label>
                <Input
                  type="number"
                  value={targetCloses}
                  onChange={(e) => setTargetCloses(Math.max(1, parseInt(e.target.value) || 0))}
                  min={1}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Ticket Promedio ($)</Label>
                <Input
                  type="number"
                  value={rates.ticketPromedio}
                  onChange={(e) => handleTicketChange(Math.max(1, parseInt(e.target.value) || 0))}
                  min={1}
                  className="bg-background border-border"
                />
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-semibold text-muted-foreground">Efectividad de LinkedIn</h3>
              
              {[
                { key: "connectRate" as const, label: "Tasa de Aceptación de Invitación", desc: "Contactos conectados / invitaciones enviadas", min: benchmarks.conectadosProspectos.min, max: benchmarks.conectadosProspectos.max, bench: benchmarks.conectadosProspectos },
                { key: "meetingRate" as const, label: "Tasa de Agendamiento de Reunión", desc: "Reuniones agendadas / conectados", min: benchmarks.agendadasConectados.min, max: benchmarks.agendadasConectados.max, bench: benchmarks.agendadasConectados },
                { key: "showRate" as const, label: "Tasa de Asistencia (Show Rate)", desc: "Reuniones realizadas / reuniones agendadas", min: benchmarks.realizadasAgendadas.min, max: benchmarks.realizadasAgendadas.max, bench: benchmarks.realizadasAgendadas },
                { key: "closeRate" as const, label: "Tasa de Cierre", desc: "Ventas cerradas / reuniones realizadas", min: benchmarks.ventasRealizadas.min, max: benchmarks.ventasRealizadas.max, bench: benchmarks.ventasRealizadas },
              ].map(({ key, label, desc, min, max, bench }) => (
                <div key={key} className="space-y-2 p-3 bg-blue-50/30 dark:bg-blue-950/10 rounded-lg border border-blue-100/40 dark:border-blue-900/20">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs font-medium">{label}</Label>
                      {getStatusIcon(rates[key], bench)}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs p-2">
                          <p className="text-xs">{desc}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Benchmark SaaS: {min}% - {max}%</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {rates[key]}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground w-6">{min}%</span>
                    <Slider
                      value={[rates[key]]}
                      onValueChange={([val]) => handleSliderChange(key, val)}
                      min={1}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-[10px] text-muted-foreground w-6">{max}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Save Form */}
            <div className="flex items-center gap-2 pt-2">
              <Input
                placeholder="Nombre del escenario (ej. LinkedIn Q3)"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="h-8 text-xs flex-1 bg-background"
              />
              <Button onClick={handleSave} size="sm" className="h-8 gap-1 text-xs">
                <Save className="h-3.5 w-3.5" />
                Guardar Escenario
              </Button>
            </div>
          </div>

          {/* Results/Pacing Section */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                2. Actividad Requerida (Predicción)
              </h3>
              
              <div className="space-y-4 bg-blue-50/20 dark:bg-blue-950/5 p-4 rounded-xl border border-blue-100/30 dark:border-blue-900/10">
                {[
                  { label: "Invitaciones a Enviar", val: projections.prospectos, color: FUNNEL_COLORS.prospectos, desc: "Invitaciones totales a mandar" },
                  { label: "Contactos Aceptados", val: projections.conectados, color: FUNNEL_COLORS.conectados, desc: "Contactos que aceptarán conectar", pct: rates.connectRate },
                  { label: "Reuniones Agendadas", val: projections.agendadas, color: FUNNEL_COLORS.agendadas, desc: "Reuniones agendadas", pct: rates.meetingRate },
                  { label: "Reuniones Realizadas", val: projections.realizadas, color: FUNNEL_COLORS.realizadas, desc: "Demos reales realizadas", pct: rates.showRate },
                  { label: "Ventas Ganadas", val: targetCloses, color: FUNNEL_COLORS.ventas, desc: "Tu meta de ventas ganadas", pct: rates.closeRate },
                ].map((stage, idx) => {
                  const width = projections.prospectos > 0 ? (stage.val / projections.prospectos) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-foreground">{stage.label}</span>
                        <div className="flex items-center gap-1.5">
                          {stage.pct !== undefined && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1 rounded">
                              {stage.pct}%
                            </span>
                          )}
                          <span className="font-bold">{stage.val.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="w-full bg-secondary/30 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${stage.color} transition-all duration-500`}
                          style={{ width: `${Math.max(8, width)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{stage.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Income Projections Summary */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Proyección de Ingresos</p>
                  <p className="text-xl font-bold text-primary">
                    {new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(projections.ingresos)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase">Invitaciones Diarias</p>
                  <p className="text-base font-semibold text-foreground">
                    {projections.diario}
                    <span className="text-[10px] text-muted-foreground font-normal"> /día</span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Para alcanzar tu meta de <span className="font-semibold text-foreground">{targetCloses} cierres</span> por LinkedIn con un ticket promedio de <span className="font-semibold text-foreground">${rates.ticketPromedio.toLocaleString()}</span>, necesitas enviar <span className="font-semibold text-foreground">{projections.diario} invitaciones de conexión al día</span>.
              </p>
            </div>

            {/* Diagnosis / Tips */}
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold uppercase tracking-wider text-accent-foreground">Recomendaciones de Mejora</span>
              </div>
              <ul className="space-y-2">
                {rates.connectRate < benchmarks.conectadosProspectos.min && (
                  <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-accent">•</span>
                    <span>Tasa de aceptación baja. Optimiza tu perfil: ten una foto profesional, un banner corporativo claro y un título enfocado en cómo ayudas a tu cliente (ej. "Ayudo a X a lograr Y" en vez de "Ejecutivo de Ventas").</span>
                  </li>
                )}
                {rates.meetingRate < benchmarks.agendadasConectados.min && (
                  <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-accent">•</span>
                    <span>Tasa de agendamiento baja. No intentes vender en el primer mensaje. Aporta valor compartiendo un recurso útil (PDF, webinar, etc.) o haz preguntas de dolor para iniciar conversación.</span>
                  </li>
                )}
                {rates.showRate < benchmarks.realizadasAgendadas.min && (
                  <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-accent">•</span>
                    <span>Asistencia baja. Envía confirmaciones personalizadas y añade un breve cuestionario de calificación previo para filtrar prospectos no interesados.</span>
                  </li>
                )}
                {rates.closeRate < benchmarks.ventasRealizadas.min && (
                  <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-accent">•</span>
                    <span>Cierre bajo. Trabaja en la estructuración de tus demos, la identificación de los tomadores de decisiones clave en la cuenta y el seguimiento posterior.</span>
                  </li>
                )}
                {rates.connectRate >= benchmarks.conectadosProspectos.min && rates.meetingRate >= benchmarks.agendadasConectados.min && rates.showRate >= benchmarks.realizadasAgendadas.min && rates.closeRate >= benchmarks.ventasRealizadas.min && (
                  <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-green-500">✓</span>
                    <span>Tus ratios de LinkedIn son sobresalientes. Mantén el flujo constante de contactos agregados.</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
