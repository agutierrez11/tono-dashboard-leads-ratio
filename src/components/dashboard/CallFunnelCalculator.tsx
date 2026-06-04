import { useState, useMemo, useEffect } from "react";
import { useFunnelMetrics } from "@/contexts/FunnelMetricsContext";
import { useSavedScenarios } from "@/hooks/useSavedScenarios";
import { Phone, PhoneCall, MessageSquare, Calendar, TrendingUp, TrendingDown, RefreshCw, Save, Info, Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const FUNNEL_COLORS = {
  llamadas: "bg-[#475569]",
  conectadas: "bg-[#eab308]",
  conversaciones: "bg-[#3b82f6]",
  reuniones: "bg-[#22c55e]",
};

const benchmarks = {
  conectadasLlamadas: { min: 30, max: 60, avg: 50 },
  conversacionesConectadas: { min: 15, max: 30, avg: 20 },
  reunionesConversaciones: { min: 5, max: 15, avg: 10 },
};

export const CallFunnelCalculator = () => {
  const { callMetrics, isRealDataActive, setIsRealDataActive, resetToRealData } = useFunnelMetrics();
  const { saveScenario } = useSavedScenarios();

  const [useRealRates, setUseRealRates] = useState(true);
  const [targetMeetings, setTargetMeetings] = useState(5);
  const [scenarioName, setScenarioName] = useState("");

  // Rates and inputs state
  const [rates, setRates] = useState({
    connectRate: benchmarks.conectadasLlamadas.avg,
    conversationRate: benchmarks.conversacionesConectadas.avg,
    meetingRate: benchmarks.reunionesConversaciones.avg,
  });

  // Calculate real rates from Supabase activities context
  const dbRates = useMemo(() => {
    const { llamadasRealizadas, contestadas, conversaciones, reuniones } = callMetrics;
    const connectRate = llamadasRealizadas > 0 ? (contestadas / llamadasRealizadas) * 100 : benchmarks.conectadasLlamadas.avg;
    const conversationRate = contestadas > 0 ? (conversaciones / contestadas) * 100 : benchmarks.conversacionesConectadas.avg;
    const meetingRate = conversaciones > 0 ? (reuniones / conversaciones) * 100 : benchmarks.reunionesConversaciones.avg;

    return {
      connectRate: Math.round(connectRate),
      conversationRate: Math.round(conversationRate),
      meetingRate: Math.round(meetingRate),
      hasData: llamadasRealizadas > 0
    };
  }, [callMetrics]);

  // Sync rates when "useRealRates" is active and dbRates exist
  useEffect(() => {
    if (useRealRates && dbRates) {
      setRates({
        connectRate: dbRates.connectRate,
        conversationRate: dbRates.conversationRate,
        meetingRate: dbRates.meetingRate,
      });
    }
  }, [useRealRates, dbRates]);

  // Calculate simulated activity required to hit the target meetings
  const projections = useMemo(() => {
    const rConnect = rates.connectRate / 100;
    const rConv = rates.conversationRate / 100;
    const rMeet = rates.meetingRate / 100;

    const conversacionesReq = Math.ceil(targetMeetings / (rMeet || 0.1));
    const contestadasReq = Math.ceil(conversacionesReq / (rConv || 0.2));
    const llamadasReq = Math.ceil(contestadasReq / (rConnect || 0.5));

    return {
      conversaciones: conversacionesReq,
      contestadas: contestadasReq,
      llamadas: llamadasReq,
      diario: Math.ceil(llamadasReq / 20), // 20 days pacing
    };
  }, [targetMeetings, rates]);

  const handleSliderChange = (key: keyof typeof rates, val: number) => {
    setUseRealRates(false);
    setIsRealDataActive(false);
    setRates((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    if (!scenarioName.trim()) return;
    saveScenario(scenarioName, "calls", { ...rates, targetMeetings });
    setScenarioName("");
  };

  const getStatusIcon = (val: number, benchmark: { min: number; max: number; avg: number }) => {
    if (val >= benchmark.avg) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (val >= benchmark.min) return <span className="text-yellow-500 font-semibold text-xs">─</span>;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 pt-4">
        {/* Toggle Real Data vs Simulation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/40 p-4 rounded-xl border border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Usar Conversión de Llamadas Real (Supabase)</span>
              {dbRates.hasData ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Conectado</Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Sin Historial (Benchmarks)</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {useRealRates 
                ? "Utilizando tasas reales de llamadas. Mueve los sliders para simular objetivos futuros." 
                : "Modo Simulación activo. Estás prediciendo la cantidad de llamadas requeridas."}
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
              <Phone className="w-4 h-4 text-primary" />
              1. Parámetros de Cold Calling
            </h3>

            {/* Target Meetings */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Meta de Reuniones Agendadas</Label>
              <Input
                type="number"
                value={targetMeetings}
                onChange={(e) => setTargetMeetings(Math.max(1, parseInt(e.target.value) || 0))}
                min={1}
                className="bg-background border-border"
              />
            </div>

            {/* Sliders */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-semibold text-muted-foreground">Efectividad de Llamadas</h3>
              
              {[
                { key: "connectRate" as const, label: "Tasa de Respuesta/Conexión", desc: "Llamadas contestadas / llamadas marcadas", min: benchmarks.conectadasLlamadas.min, max: benchmarks.conectadasLlamadas.max, bench: benchmarks.conectadasLlamadas },
                { key: "conversationRate" as const, label: "Tasa de Conversación Calificada", desc: "Leads calificados que muestran interés / contestadas", min: benchmarks.conversacionesConectadas.min, max: benchmarks.conversacionesConectadas.max, bench: benchmarks.conversacionesConectadas },
                { key: "meetingRate" as const, label: "Tasa de Agendamiento de Reunión", desc: "Reuniones agendadas / conversaciones", min: benchmarks.reunionesConversaciones.min, max: benchmarks.reunionesConversaciones.max, bench: benchmarks.reunionesConversaciones },
              ].map(({ key, label, desc, min, max, bench }) => (
                <div key={key} className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border/50">
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
                placeholder="Nombre del escenario (ej. Meta Llamadas Julio)"
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
              
              <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border">
                {[
                  { label: "Llamadas a Realizar", val: projections.llamadas, color: FUNNEL_COLORS.llamadas, desc: "Llamadas totales a marcar" },
                  { label: "Llamadas Contestadas", val: projections.contestadas, color: FUNNEL_COLORS.conectadas, desc: "Llamadas que contestarán", pct: rates.connectRate },
                  { label: "Conversaciones de Valor", val: projections.conversaciones, color: FUNNEL_COLORS.conversaciones, desc: "Contactos con interés", pct: rates.conversationRate },
                  { label: "Reuniones Agendadas", val: targetMeetings, color: FUNNEL_COLORS.reuniones, desc: "Tu meta de reuniones agendadas", pct: rates.meetingRate },
                ].map((stage, idx) => {
                  const width = projections.llamadas > 0 ? (stage.val / projections.llamadas) * 100 : 0;
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

            {/* Pacing daily requirements */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider">Cuota Diaria Requerida</span>
              </div>
              <div className="text-center py-2 bg-background/50 rounded-lg border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase">Llamadas Diarias</p>
                <p className="text-3xl font-bold text-primary">
                  {projections.diario}
                </p>
                <p className="text-[9px] text-muted-foreground mt-0.5">Basado en 20 días laborales al mes</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Para agendar tu meta de <span className="font-semibold text-foreground">{targetMeetings} reuniones</span> en 20 días hábiles, necesitas hacer <span className="font-semibold text-foreground">{projections.diario} llamadas al día</span> con tu efectividad actual.
              </p>
            </div>

            {/* Diagnosis / Tips */}
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold uppercase tracking-wider text-accent-foreground">Recomendaciones de Mejora</span>
              </div>
              <ul className="space-y-2">
                {rates.connectRate < benchmarks.conectadasLlamadas.min && (
                  <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-accent">•</span>
                    <span>Tasa de respuesta baja. Llama de 10:00 a 11:30 o de 15:30 a 17:00, o valida la calidad de la base de datos.</span>
                  </li>
                )}
                {rates.conversationRate < benchmarks.conversacionesConectadas.min && (
                  <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-accent">•</span>
                    <span>Conversaciones bajas. Intenta acortar tu gancho inicial (primeros 15 segundos) y enfócate en dolores típicos de tu ICP.</span>
                  </li>
                )}
                {rates.meetingRate < benchmarks.reunionesConversaciones.min && (
                  <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-accent">•</span>
                    <span>Agendamiento bajo. Pide la reunión con opciones cerradas (ej. "¿te viene bien martes a las 10 o miércoles a las 4?") en vez de dejarlo abierto.</span>
                  </li>
                )}
                {rates.connectRate >= benchmarks.conectadasLlamadas.min && rates.conversationRate >= benchmarks.conversacionesConectadas.min && rates.meetingRate >= benchmarks.reunionesConversaciones.min && (
                  <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-green-500">✓</span>
                    <span>Tus métricas de llamadas están en rangos saludables. Mantén el ritmo de prospección.</span>
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
