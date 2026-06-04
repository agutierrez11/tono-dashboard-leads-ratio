import { useState, useMemo, useEffect } from "react";
import { useFunnelMetrics } from "@/contexts/FunnelMetricsContext";
import { useSavedScenarios } from "@/hooks/useSavedScenarios";
import { Mail, MailOpen, MessageSquare, Calendar, TrendingUp, TrendingDown, RefreshCw, Save, Info, Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const FUNNEL_COLORS = {
  enviados: "bg-[#475569]",
  abiertos: "bg-[#eab308]",
  respondidos: "bg-[#3b82f6]",
  reuniones: "bg-[#22c55e]",
};

const benchmarks = {
  abiertosEnviados: { min: 25, max: 50, avg: 35 },
  respondidosAbiertos: { min: 5, max: 15, avg: 10 },
  reunionesRespondidos: { min: 10, max: 30, avg: 20 },
};

export const EmailFunnelCalculator = () => {
  const { emailMetrics, isRealDataActive, setIsRealDataActive, resetToRealData } = useFunnelMetrics();
  const { saveScenario } = useSavedScenarios();

  const [useRealRates, setUseRealRates] = useState(true);
  const [targetMeetings, setTargetMeetings] = useState(5);
  const [scenarioName, setScenarioName] = useState("");

  // Rates and inputs state
  const [rates, setRates] = useState({
    openRate: benchmarks.abiertosEnviados.avg,
    replyRate: benchmarks.respondidosAbiertos.avg,
    meetingRate: benchmarks.reunionesRespondidos.avg,
  });

  // Calculate real rates from Supabase activities context
  const dbRates = useMemo(() => {
    const { emailsEnviados, emailsAbiertos, emailsRespondidos, reuniones } = emailMetrics;
    const openRate = emailsEnviados > 0 ? (emailsAbiertos / emailsEnviados) * 100 : benchmarks.abiertosEnviados.avg;
    const replyRate = emailsAbiertos > 0 ? (emailsRespondidos / emailsAbiertos) * 100 : benchmarks.respondidosAbiertos.avg;
    const meetingRate = emailsRespondidos > 0 ? (reuniones / emailsRespondidos) * 100 : benchmarks.reunionesRespondidos.avg;

    return {
      openRate: Math.round(openRate),
      replyRate: Math.round(replyRate),
      meetingRate: Math.round(meetingRate),
      hasData: emailsEnviados > 0
    };
  }, [emailMetrics]);

  // Sync rates when "useRealRates" is active and dbRates exist
  useEffect(() => {
    if (useRealRates && dbRates) {
      setRates({
        openRate: dbRates.openRate,
        replyRate: dbRates.replyRate,
        meetingRate: dbRates.meetingRate,
      });
    }
  }, [useRealRates, dbRates]);

  // Calculate simulated activity required to hit the target meetings
  const projections = useMemo(() => {
    const rOpen = rates.openRate / 100;
    const rRep = rates.replyRate / 100;
    const rMeet = rates.meetingRate / 100;

    const respondidosReq = Math.ceil(targetMeetings / (rMeet || 0.2));
    const abiertosReq = Math.ceil(respondidosReq / (rRep || 0.1));
    const enviadosReq = Math.ceil(abiertosReq / (rOpen || 0.35));

    return {
      respondidos: respondidosReq,
      abiertos: abiertosReq,
      enviados: enviadosReq,
      diario: Math.ceil(enviadosReq / 20), // 20 days pacing
    };
  }, [targetMeetings, rates]);

  const handleSliderChange = (key: keyof typeof rates, val: number) => {
    setUseRealRates(false);
    setIsRealDataActive(false);
    setRates((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    if (!scenarioName.trim()) return;
    saveScenario(scenarioName, "email", { ...rates, targetMeetings });
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
              <span className="text-sm font-semibold">Usar Conversión de Emails Real (Supabase)</span>
              {dbRates.hasData ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Conectado</Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Sin Historial (Benchmarks)</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {useRealRates 
                ? "Utilizando tasas reales de email. Mueve los sliders para simular objetivos futuros." 
                : "Modo Simulación activo. Estás prediciendo la cantidad de correos a enviar."}
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
              <Mail className="w-4 h-4 text-primary" />
              1. Parámetros de Email Outreach
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
              <h3 className="text-xs font-semibold text-muted-foreground">Efectividad de Email</h3>
              
              {[
                { key: "openRate" as const, label: "Tasa de Apertura", desc: "Correos abiertos / correos enviados", min: benchmarks.abiertosEnviados.min, max: benchmarks.abiertosEnviados.max, bench: benchmarks.abiertosEnviados },
                { key: "replyRate" as const, label: "Tasa de Respuesta", desc: "Respuestas directas / abiertos", min: benchmarks.respondidosAbiertos.min, max: benchmarks.respondidosAbiertos.max, bench: benchmarks.respondidosAbiertos },
                { key: "meetingRate" as const, label: "Tasa de Agendamiento", desc: "Reuniones agendadas / respuestas", min: benchmarks.reunionesRespondidos.min, max: benchmarks.reunionesRespondidos.max, bench: benchmarks.reunionesRespondidos },
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
                placeholder="Nombre del escenario (ej. Meta Email Q3)"
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
                  { label: "Emails a Enviar", val: projections.enviados, color: FUNNEL_COLORS.enviados, desc: "Emails totales a mandar" },
                  { label: "Emails Abiertos", val: projections.abiertos, color: FUNNEL_COLORS.abiertos, desc: "Emails que serán abiertos", pct: rates.openRate },
                  { label: "Respuestas Recibidas", val: projections.respondidos, color: FUNNEL_COLORS.respondidos, desc: "Respuestas o interesados", pct: rates.replyRate },
                  { label: "Reuniones Agendadas", val: targetMeetings, color: FUNNEL_COLORS.reuniones, desc: "Tu meta de reuniones agendadas", pct: rates.meetingRate },
                ].map((stage, idx) => {
                  const width = projections.enviados > 0 ? (stage.val / projections.enviados) * 100 : 0;
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
                <p className="text-[10px] text-muted-foreground uppercase">Emails Diarios</p>
                <p className="text-3xl font-bold text-primary">
                  {projections.diario}
                </p>
                <p className="text-[9px] text-muted-foreground mt-0.5">Basado en 20 días laborales al mes</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Para agendar tu meta de <span className="font-semibold text-foreground">{targetMeetings} reuniones</span>, necesitas enviar un promedio de <span className="font-semibold text-foreground">{projections.diario} emails al día</span>.
              </p>
            </div>

            {/* Diagnosis / Tips */}
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold uppercase tracking-wider text-accent-foreground">Recomendaciones de Mejora</span>
              </div>
              <ul className="space-y-2">
                {rates.openRate < benchmarks.abiertosEnviados.min && (
                  <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-accent">•</span>
                    <span>Tasa de apertura baja. Mejora tus líneas de asunto (hazlas de 3 a 5 palabras, en minúsculas y sin sonar vendedor) e investiga si tienes problemas de entregabilidad (Spam).</span>
                  </li>
                )}
                {rates.replyRate < benchmarks.respondidosAbiertos.min && (
                  <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-accent">•</span>
                    <span>Respuestas bajas. Acorta el cuerpo del correo (máximo 100 palabras), quita enlaces/archivos en el primer correo y personaliza la primera línea del email.</span>
                  </li>
                )}
                {rates.meetingRate < benchmarks.reunionesRespondidos.min && (
                  <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-accent">•</span>
                    <span>Tasa de reunión baja. Tu llamada a la acción (CTA) debe ser de bajo interés (ej. "¿te importaría si te envío una idea rápida de 2 min?" en vez de pedir directo una llamada de 30 min).</span>
                  </li>
                )}
                {rates.openRate >= benchmarks.abiertosEnviados.min && rates.replyRate >= benchmarks.respondidosAbiertos.min && rates.meetingRate >= benchmarks.reunionesRespondidos.min && (
                  <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-green-500">✓</span>
                    <span>Tus campañas de email están funcionando correctamente. Mantén las secuencias de seguimiento.</span>
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
