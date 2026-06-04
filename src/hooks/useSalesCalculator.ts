import { useState, useEffect, useMemo } from "react";
import { useSalesFunnelMetrics } from "@/hooks/useSalesFunnelMetrics";
import { useSavedScenarios } from "@/hooks/useSavedScenarios";
import { toast } from "sonner";

export interface CalculatorInputs {
  metaCierres: number;
  ticketPromedio: number;
  leadContacto: number;         // % Lead a Contacto Calificado (SDR)
  contactoReunion: number;      // % Contacto Calificado a Reunión Agendada
  reunionAsistencia: number;    // % Show Rate (Tasa de Asistencia)
  reunionOportunidad: number;   // % Reunión Realizada a Oportunidad
  oportunidadCierre: number;    // % Oportunidad a Cierre (AE)
}

export interface CalculatorResults {
  cierres: number;
  oportunidades: number;
  reuniones: number; // Reuniones Realizadas (attended)
  reunionesAgendadas: number; // Reuniones Agendadas (scheduled)
  leads: number;
  ingresos: number;
  conversionTotal: number;
}

export const benchmarks = {
  leadContacto: { min: 30, max: 60, avg: 35 },
  contactoReunion: { min: 20, max: 40, avg: 30 },
  reunionAsistencia: { min: 60, max: 80, avg: 75 },
  reunionOportunidad: { min: 25, max: 50, avg: 40 },
  oportunidadCierre: { min: 20, max: 30, avg: 25 },
};

export const useSalesCalculator = () => {
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
    
    const leadContacto = metrics.stages[1]?.conversionFromPrevious || benchmarks.leadContacto.avg;
    const contactoReunion = metrics.stages[2]?.conversionFromPrevious || benchmarks.contactoReunion.avg;
    const reunionAsistencia = benchmarks.reunionAsistencia.avg; // No direct mapping, keep default
    const reunionOportunidad = metrics.stages[3]?.conversionFromPrevious || benchmarks.reunionOportunidad.avg;
    const oportunidadCierre = metrics.stages[4]?.conversionFromPrevious || benchmarks.oportunidadCierre.avg;
    
    // Average ticket
    const ticketPromedio = metrics.stages[4]?.count > 0 
      ? (metrics.weeklySummaries.reduce((sum, w) => sum + w.revenue, 0) / (metrics.stages[4].count || 1)) 
      : 15000;

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

  return {
    useRealData,
    setUseRealData,
    scenarioName,
    setScenarioName,
    inputs,
    results,
    dbValues,
    handleSliderChange,
    handleMetaChange,
    handleSave,
    isLoading
  };
};
