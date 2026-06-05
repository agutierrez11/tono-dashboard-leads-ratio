import { useState, useMemo, useEffect } from "react";
import { useLeads } from "@/hooks/useLeads";
import { useRecentActivities } from "@/hooks/useActivities";

export interface AnalysisReport {
  contactRate: number;
  bookingRate: number;
  closeRate: number;
  overallConversion: number;
  contactStatus: { label: string; text: string; status: "good" | "warning" | "critical" };
  bookingStatus: { label: string; text: string; status: "good" | "warning" | "critical" };
  closeStatus: { label: string; text: string; status: "good" | "warning" | "critical" };
  generalAnalysis: string;
  priorities: string[];
  tools: { category: string; list: { name: string; desc: string }[] }[];
}

export const useSalesDataAnalyzer = () => {
  const { data: leads = [] } = useLeads();
  const { data: activities = [] } = useRecentActivities(90);

  // Calculate real values from DB
  const dbData = useMemo(() => {
    const totalLeads = leads.length;
    const totalCalls = activities.reduce((sum, act) => sum + (act.calls_made || 0), 0);
    const wonCount = leads.filter(l => l.status === "won").length;
    const meetingsCount = leads.filter(l => 
      ["qualified", "proposal", "won", "lost"].includes(l.status)
    ).length;

    return {
      leads: totalLeads,
      calls: totalCalls || 0,
      meetings: meetingsCount,
      sales: wonCount,
      hasData: totalLeads > 0 || totalCalls > 0
    };
  }, [leads, activities]);

  // Input states (prefilled with DB values if available, otherwise default demo values)
  const [inputs, setInputs] = useState({
    leads: 100,
    calls: 50,
    meetings: 15,
    sales: 5,
  });

  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);

  // Sync inputs with DB data once loaded
  useEffect(() => {
    if (dbData.hasData) {
      setInputs({
        leads: dbData.leads || 100,
        calls: dbData.calls || 50,
        meetings: dbData.meetings || 15,
        sales: dbData.sales || 5,
      });
    }
  }, [dbData]);

  const handleInputChange = (field: keyof typeof inputs, val: number) => {
    setIsSimulationMode(true);
    setInputs(prev => ({ ...prev, [field]: Math.max(0, val) }));
  };

  const handleAnalyze = () => {
    const { leads: l, calls: c, meetings: m, sales: s } = inputs;

    // Rates calculation
    const contactRate = l > 0 ? parseFloat(((c / l) * 100).toFixed(1)) : 0;
    const bookingRate = c > 0 ? parseFloat(((m / c) * 100).toFixed(1)) : 0;
    const closeRate = m > 0 ? parseFloat(((s / m) * 100).toFixed(1)) : 0;
    const overallConversion = l > 0 ? parseFloat(((s / l) * 100).toFixed(1)) : 0;

    // 1. Diagnóstico del Embudo - Contact Rate (Llamadas / Leads)
    const contactStatus: AnalysisReport["contactStatus"] = {
      label: "Tasa de contacto",
      text: "",
      status: "good"
    };
    if (contactRate >= 40 && contactRate <= 60) {
      contactStatus.text = `Esta métrica está **dentro del rango objetivo** (40-60%). ¡Buen trabajo llegando a tus leads!`;
      contactStatus.status = "good";
    } else if (contactRate > 60) {
      contactStatus.text = `Esta métrica está **por encima de la media estándar** (>60%). Tienes un contacto muy intensivo con tus leads.`;
      contactStatus.status = "good";
    } else {
      contactStatus.text = `Esta métrica está **por debajo del rango objetivo** (40-60%). Necesitas incrementar el volumen de llamadas por lead para asegurar cobertura.`;
      contactStatus.status = "warning";
    }

    // 2. Booking Rate (Reuniones / Llamadas)
    const bookingStatus: AnalysisReport["bookingStatus"] = {
      label: "Tasa de conversión a reuniones",
      text: "",
      status: "good"
    };
    if (bookingRate >= 20 && bookingRate <= 35) {
      bookingStatus.text = `Esta métrica está **dentro del rango objetivo** (20-35%). Esto indica que tus conversaciones con los leads son efectivas para generar interés y reuniones.`;
      bookingStatus.status = "good";
    } else if (bookingRate > 35) {
      bookingStatus.text = `Esta métrica está **sobresaliente** (>35%). Tu gancho telefónico y propuesta inicial para agendar son de nivel élite.`;
      bookingStatus.status = "good";
    } else {
      bookingStatus.text = `Esta métrica está **por debajo del rango de efectividad** (<20%). Considera revisar tu pitch de los primeros 15 segundos o afinar la cualificación antes del agendamiento.`;
      bookingStatus.status = "critical";
    }

    // 3. Close Rate (Ventas / Reuniones)
    const closeStatus: AnalysisReport["closeStatus"] = {
      label: "Tasa de cierre",
      text: "",
      status: "good"
    };
    if (closeRate >= 25 && closeRate <= 40) {
      closeStatus.text = `Esta métrica está **dentro del rango objetivo** (25-40%). Tienes una buena habilidad para cerrar ventas una vez que llegas a la etapa de reunión.`;
      closeStatus.status = "good";
    } else if (closeRate > 40) {
      closeStatus.text = `Esta métrica está **excepcional** (>40%). Tu manejo del cierre y propuesta comercial de valor son de altísimo impacto.`;
      closeStatus.status = "good";
    } else {
      closeStatus.text = `Esta métrica está **por debajo del rango óptimo** (<25%). Recomendamos auditar el manejo de objeciones comerciales o simplificar el flujo de firma del contrato.`;
      closeStatus.status = "critical";
    }

    // General Summary
    let generalAnalysis = "";
    if (contactStatus.status === "good" && bookingStatus.status === "good" && closeStatus.status === "good") {
      generalAnalysis = "Tu embudo está funcionando saludablemente en todas sus etapas principales comparado con los benchmarks B2B. No hay \"cuellos de botella\" evidentes en términos de tasas de conversión. El mayor potencial de mejora reside en aumentar la **cantidad de leads en la parte superior del embudo** para escalar el volumen de ventas.";
    } else {
      const issues = [];
      if (contactStatus.status !== "good") issues.push("incrementar el volumen de contacto telefónico");
      if (bookingStatus.status !== "good") issues.push("optimizar tu pitch de prospección para agendar más reuniones");
      if (closeStatus.status !== "good") issues.push("reforzar el cierre comercial y seguimiento");
      generalAnalysis = `Tu embudo muestra áreas de oportunidad. Tu prioridad clave actual debe ser **${issues.join(" e ")}** para maximizar el retorno de tus leads.`;
    }

    // Priorities
    let priorities: string[] = [];
    if (contactStatus.status === "good" && bookingStatus.status === "good" && closeStatus.status === "good") {
      priorities = [
        "**Aumentar el volumen de leads iniciales:** Con tasas de conversión sólidas, el camino más directo para aumentar las ventas es introducir más leads cualificados al embudo.",
        "**Optimizar la cualificación de los leads:** Aunque la tasa de contacto es buena, asegurar que los leads iniciales sean de alta calidad puede mejorar marginalmente todas las tasas subsecuentes.",
        "**Reforzar la propuesta de valor post-contacto:** Mantener la efectividad alta en la conversión a reuniones y el cierre comercial."
      ];
    } else {
      priorities = [
        bookingStatus.status !== "good" 
          ? "**Optimizar el pitch telefónico:** Rediseña tus llamadas de prospección inicial para enfocarte en dolores del cliente y no en tu producto."
          : "**Aumentar base de leads calificados:** Asegurar un volumen mínimo para prospectar diariamente.",
        closeStatus.status !== "good"
          ? "**Estructurar el seguimiento (Follow-up):** Implementa un ritmo sistemático de mensajes post-reunión para evitar que las propuestas se enfríen."
          : "**Cualificar antes de la llamada:** Validar presupuesto o rol de tomador de decisiones.",
        "**Establecer bloques de tiempo dedicados:** Proteger bloques fijos en tu calendario para prospección e impedir interrupciones."
      ];
    }

    // Recommended Tools
    const tools = [
      {
        category: "Para aumentar el volumen de leads y cualificación",
        list: [
          {
            name: "LinkedIn Sales Navigator",
            desc: "Permite identificar y segmentar prospectos de alta calidad con gran precisión, ideal para enfocar los esfuerzos de contacto en leads con mayor probabilidad de conversión."
          },
          {
            name: "Apollo.io o ZoomInfo",
            desc: "Estas herramientas combinan capacidades de prospección (encontrar contactos) con enriquecimiento de datos, lo que te permite conseguir más leads con información de contacto verificada."
          }
        ]
      },
      {
        category: "Para reforzar la propuesta de valor y eficiencia post-contacto",
        list: [
          {
            name: "CRM (HubSpot o Salesforce)",
            desc: "Un CRM robusto te ayudaría a gestionar un mayor volumen de leads, hacer seguimiento de interacciones con cada uno, automatizar tareas de seguimiento y personalizar comunicaciones."
          },
          {
            name: "Email Marketing (Lemlist o Instantly)",
            desc: "Para complementar las llamadas, una estrategia de email marketing frío con secuencias personalizadas puede aumentar la tasa de contacto general."
          }
        ]
      }
    ];

    setReport({
      contactRate,
      bookingRate,
      closeRate,
      overallConversion,
      contactStatus,
      bookingStatus,
      closeStatus,
      generalAnalysis,
      priorities,
      tools
    });
  };

  const handleResetToReal = () => {
    setIsSimulationMode(false);
    setInputs({
      leads: dbData.leads || 100,
      calls: dbData.calls || 50,
      meetings: dbData.meetings || 15,
      sales: dbData.sales || 5,
    });
  };

  return {
    dbData,
    inputs,
    isSimulationMode,
    report,
    handleInputChange,
    handleAnalyze,
    handleResetToReal
  };
};
