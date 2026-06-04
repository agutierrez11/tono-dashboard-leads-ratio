import { useState, useEffect } from "react";
import { useSalesFunnelMetrics } from "@/hooks/useSalesFunnelMetrics";
import { useSavedScenarios } from "@/hooks/useSavedScenarios";
import { Target, TrendingUp, Calendar, Info, RefreshCw, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalculatorInputs {
  metaCierres: number;
  ticketPromedio: number;
  leadContacto: number;         // % Lead a Contacto Calificado (SDR)
  contactoReunion: number;      // % Contacto Calificado a Reunión Agendada
  reunionAsistencia: number;    // % Show Rate (Tasa de Asistencia)
  reunionOportunidad: number;   // % Reunión Realizada a Oportunidad
  oportunidadCierre: number;    // % Oportunidad a Cierre (AE)
}

interface CalculatorResults {
  cierres: number;
  oportunidades: number;
  reuniones: number; // Reuniones Realizadas (attended)
  reunionesAgendadas: number; // Reuniones Agendadas (scheduled)
  leads: number;
  ingresos: number;
  conversionTotal: number;
}

const benchmarks = {
  leadContacto: { min: 30, max: 60, avg: 35 },
  contactoReunion: { min: 20, max: 40, avg: 30 },
  reunionAsistencia: { min: 60, max: 80, avg: 75 },
  reunionOportunidad: { min: 25, max: 50, avg: 40 },
  oportunidadCierre: { min: 20, max: 30, avg: 25 },
};

const FUNNEL_COLORS = {
  leads: "bg-[#475569]", // Slate 600
  reunionesAgendadas: "bg-[#eab308]", // Yellow 500
  reunionesRealizadas: "bg-[#a855f7]", // Purple 500
  oportunidades: "bg-[#3b82f6]", // Blue 500
  cierres: "bg-[#22c55e]", // Green 500
};

export const SalesCalculator = () => {
  const { metrics, isLoading } = useSalesFunnelMetrics(0); // All time metrics for baseline
  const { saveScenario } = useSavedScenarios();

  const [useRealData, setUseRealData] = useState(true);
  const [scenarioName, setScenarioName] = useState("");
  
  const [inputs, setInputs] = useState<CalculatorInputs>({
    metaCierres: 10,
    ticketPromedio: 15000,
    leadContacto: benchmarks.leadContacto.avg,
    contactoReunion: benchmarks.contactoReunion.avg,
    reunionAsistencia: benchmarks.reunionAsistencia.avg,
    reunionOportunidad: benchmarks.reunionOportunidad.avg,
    oportunidadCierre: benchmarks.oportunidadCierre.avg,
  });

  const [results, setResults] = useState<CalculatorResults>({
    cierres: 0,
    oportunidades: 0,
    reuniones: 0,
    reunionesAgendadas: 0,
    leads: 0,
    ingresos: 0,
    conversionTotal: 0,
  });

  // Extract database values if available
  const dbValues = useMemo(() => {
    if (!metrics || isLoading || metrics.totalLeads === 0) return null;
    
    // Map funnel stages to rates
    // stage 0 = Total, stage 1 = Contacted, stage 2 = Relevant, stage 3 = Opps, stage 4 = Won
    const leadContacto = metrics.stages[1]?.conversionFromPrevious || benchmarks.leadContacto.avg;
    const contactoReunion = metrics.stages[2]?.conversionFromPrevious || benchmarks.contactoReunion.avg;
    const reunionAsistencia = benchmarks.reunionAsistencia.avg; // No direct mapping, keep default
    const reunionOportunidad = metrics.stages[3]?.conversionFromPrevious || benchmarks.reunionOportunidad.avg;
    const oportunidadCierre = metrics.stages[4]?.conversionFromPrevious || benchmarks.oportunidadCierre.avg;
    
    // Average ticket
    const ticketPromedio = metrics.stages[4]?.count > 0 ? (metrics.weeklySummaries.reduce((sum, w) => sum + w.revenue, 0) / (metrics.stages[4].count || 1)) : 15000;

    return {
      leadContacto: Math.round(leadContacto),
      contactoReunion: Math.round(contactoReunion),
      reunionAsistencia: Math.round(reunionAsistencia),
      reunionOportunidad: Math.round(reunionOportunidad),
      oportunidadCierre: Math.round(oportunidadCierre),
      ticketPromedio: Math.round(ticketPromedio > 0 ? ticketPromedio : 15000)
    };
  }, [metrics, isLoading]);

  // Load database values if "useRealData" is active
  useEffect(() => {
    if (useRealData && dbValues) {
      setInputs((prev) => ({
        ...prev,
        leadContacto: dbValues.leadContacto,
        contactoReunion: dbValues.contactoReunion,
        reunionAsistencia: dbValues.reunionAsistencia,
        reunionOportunidad: dbValues.reunionOportunidad,
        oportunidadCierre: dbValues.oportunidadCierre,
        ticketPromedio: dbValues.ticketPromedio,
      }));
    }
  }, [useRealData, dbValues]);

  // Calculate results on input change
  useEffect(() => {
    const {
      metaCierres,
      ticketPromedio,
      leadContacto,
      contactoReunion,
      reunionAsistencia,
      reunionOportunidad,
      oportunidadCierre,
    } = inputs;

    if (
      oportunidadCierre <= 0 ||
      reunionOportunidad <= 0 ||
      reunionAsistencia <= 0 ||
      contactoReunion <= 0 ||
      leadContacto <= 0
    ) {
      return;
    }

    // Reverse funnel calculations: from closures to initial leads
    const oportunidades = Math.ceil(metaCierres / (oportunidadCierre / 100));
    const reuniones = Math.ceil(oportunidades / (reunionOportunidad / 100)); // Attended
    const reunionesAgendadas = Math.ceil(reuniones / (reunionAsistencia / 100)); // Scheduled
    const leadReunionRate = (leadContacto / 100) * (contactoReunion / 100);
    const leads = Math.ceil(reunionesAgendadas / (leadReunionRate || 0.1));
    const ingresos = metaCierres * ticketPromedio;
    const conversionTotal = leads > 0 ? (metaCierres / leads) * 100 : 0;

    setResults({
      cierres: metaCierres,
      oportunidades,
      reuniones,
      reunionesAgendadas,
      leads,
      ingresos,
      conversionTotal,
    });
  }, [inputs]);

  const handleSliderChange = (key: keyof CalculatorInputs, val: number) => {
    setUseRealData(false); // Switch to simulation mode if they drag sliders
    setInputs((prev) => ({ ...prev, [key]: val }));
  };

  const handleMetaChange = (key: "metaCierres" | "ticketPromedio", val: number) => {
    setInputs((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    if (!scenarioName.trim()) {
      toast.error("Ingresa un nombre para el escenario");
      return;
    }
    saveScenario(scenarioName, "sales", inputs);
    setScenarioName("");
  };

  const getPacingClass = (val: number, benchmark: { min: number; max: number }) => {
    if (val < benchmark.min) return "text-red-500 font-semibold";
    if (val > benchmark.max) return "text-green-500 font-semibold";
    return "text-foreground";
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 pt-4">
        {/* Toggle Real Data vs Simulation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-indigo-50/40 dark:bg-indigo-950/15 p-4 rounded-xl border border-indigo-100/80 dark:border-indigo-900/30">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Usar Desempeño Real (Supabase)</span>
              {dbValues ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Conectado</Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/35 font-semibold">Sin Historial (Benchmarks)</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {useRealData 
                ? "Alimentado de tus últimos leads. Mueve cualquier slider para entrar en Modo Simulación." 
                : "Modo Simulación activo. Estás prediciendo escenarios hipotéticos."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!useRealData && dbValues && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setUseRealData(true)}
                className="h-8 gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Restablecer Real
              </Button>
            )}
            <Switch
              checked={useRealData}
              onCheckedChange={setUseRealData}
              disabled={!dbValues}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Section */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              1. Configurar Metas e Hitos
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Meta de Ventas (Cierres)</Label>
                <Input
                  type="number"
                  value={inputs.metaCierres}
                  onChange={(e) => handleMetaChange("metaCierres", Math.max(1, parseInt(e.target.value) || 0))}
                  min={1}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Ticket Promedio ($)</Label>
                <Input
                  type="number"
                  value={inputs.ticketPromedio}
                  onChange={(e) => handleMetaChange("ticketPromedio", Math.max(1, parseInt(e.target.value) || 0))}
                  min={1}
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-semibold text-muted-foreground">Conversiones del Embudo</h3>
              
              {[
                { key: "leadContacto" as const, label: "Tasa de Contacto Calificado (SDR)", desc: "% de leads que logras calificar inicialmente", min: benchmarks.leadContacto.min, max: benchmarks.leadContacto.max },
                { key: "contactoReunion" as const, label: "Tasa de Agendamiento", desc: "% de contactos calificados que agendan reunión", min: benchmarks.contactoReunion.min, max: benchmarks.contactoReunion.max },
                { key: "reunionAsistencia" as const, label: "Tasa de Asistencia (Show Rate)", desc: "% de reuniones agendadas que se realizan", min: benchmarks.reunionAsistencia.min, max: benchmarks.reunionAsistencia.max },
                { key: "reunionOportunidad" as const, label: "Tasa de Oportunidades", desc: "% de reuniones que pasan a propuesta", min: benchmarks.reunionOportunidad.min, max: benchmarks.reunionOportunidad.max },
                { key: "oportunidadCierre" as const, label: "Tasa de Cierre (AE)", desc: "% de propuestas enviadas que se firman", min: benchmarks.oportunidadCierre.min, max: benchmarks.oportunidadCierre.max },
              ].map(({ key, label, desc, min, max }) => (
                <div key={key} className="space-y-2 p-3 bg-indigo-50/30 dark:bg-indigo-950/10 rounded-lg border border-indigo-100/40 dark:border-indigo-900/20">
                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs font-medium">{label}</Label>
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
                    </div>
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {inputs[key]}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground w-6">{min}%</span>
                    <Slider
                      value={[inputs[key]]}
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

            {/* Save Scenario Form */}
            <div className="flex items-center gap-2 pt-2">
              <Input
                placeholder="Nombre del escenario (ej. Meta Alta Q3)"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="h-8 text-xs flex-1 bg-background"
              />
              <Button onClick={handleSave} size="sm" className="h-8 gap-1 text-xs">
                <Save className="h-3.5 w-3.5" />
                Guardar Simulación
              </Button>
            </div>
          </div>

          {/* Results & Visual Funnel Section */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                2. Requerimientos de Volumen
              </h3>
              
              {/* Funnel Progress Bars */}
              <div className="space-y-4 bg-indigo-50/20 dark:bg-indigo-950/5 p-4 rounded-xl border border-indigo-100/30 dark:border-indigo-900/10">
                {[
                  { label: "Leads Totales", val: results.leads, color: FUNNEL_COLORS.leads, desc: "Leads iniciales requeridos" },
                  { label: "Reuniones Agendadas", val: results.reunionesAgendadas, color: FUNNEL_COLORS.reunionesAgendadas, desc: "Reuniones que debes agendar", pct: inputs.leadContacto * inputs.contactoReunion / 100 },
                  { label: "Reuniones Realizadas", val: results.reuniones, color: FUNNEL_COLORS.reunionesRealizadas, desc: "Reuniones que deben asistir", pct: inputs.reunionAsistencia },
                  { label: "Oportunidades", val: results.oportunidades, color: FUNNEL_COLORS.oportunidades, desc: "Propuestas a enviar", pct: inputs.reunionOportunidad },
                  { label: "Cierres (Ventas)", val: results.cierres, color: FUNNEL_COLORS.cierres, desc: "Ventas ganadas logradas", pct: inputs.oportunidadCierre },
                ].map((stage, idx) => {
                  const width = results.leads > 0 ? (stage.val / results.leads) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-foreground">{stage.label}</span>
                        <div className="flex items-center gap-1.5">
                          {stage.pct !== undefined && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1 rounded">
                              {stage.pct.toFixed(0)}%
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
                    {new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(results.ingresos)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase">Conversión General</p>
                  <p className="text-base font-semibold text-foreground">
                    {results.conversionTotal.toFixed(2)}%
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Para alcanzar tu meta de <span className="font-semibold text-foreground">{results.cierres} ventas</span> con un ticket promedio de <span className="font-semibold text-foreground">${inputs.ticketPromedio.toLocaleString()}</span>, necesitas generar un flujo constante de <span className="font-semibold text-foreground">{results.leads.toLocaleString()} leads</span>.
              </p>
            </div>

            {/* Pacing Operational Block */}
            <div className="bg-indigo-50/40 dark:bg-indigo-950/15 border border-indigo-100/60 dark:border-indigo-900/20 rounded-xl p-4 space-y-3">

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider">Ritmo de Actividad Sugerido (Pacing)</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Calculado sobre 20 días hábiles de prospección comercial al mes.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-background rounded p-2 text-center border border-border/40">
                  <p className="text-[9px] text-muted-foreground mb-0.5">Leads Nuevos</p>
                  <p className="text-sm font-bold text-foreground">
                    {Math.ceil(results.leads / 20)}
                    <span className="text-[9px] text-muted-foreground font-normal block">/día</span>
                  </p>
                </div>
                <div className="bg-background rounded p-2 text-center border border-border/40">
                  <p className="text-[9px] text-muted-foreground mb-0.5">Reuniones Agendadas</p>
                  <p className="text-sm font-bold text-foreground">
                    {(results.reunionesAgendadas / 4).toFixed(1)}
                    <span className="text-[9px] text-muted-foreground font-normal block">/semana</span>
                  </p>
                </div>
                <div className="bg-background rounded p-2 text-center border border-border/40">
                  <p className="text-[9px] text-muted-foreground mb-0.5">Reuniones Realizadas</p>
                  <p className="text-sm font-bold text-foreground">
                    {(results.reuniones / 4).toFixed(1)}
                    <span className="text-[9px] text-muted-foreground font-normal block">/semana</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

// Helper hook
import { useMemo } from "react";
