import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLeads } from "@/hooks/useLeads";
import { useRecentActivities } from "@/hooks/useActivities";
import { Sparkles, BarChart2, TrendingUp, Calendar, ArrowRight, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";

interface AnalysisReport {
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

export const SalesDataAnalyzer = () => {
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
    let contactStatus: AnalysisReport["contactStatus"] = {
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
    let bookingStatus: AnalysisReport["bookingStatus"] = {
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
    let closeStatus: AnalysisReport["closeStatus"] = {
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

  const formatText = (text: string) => {
    // Basic helper to highlight markdown bold in JSX
    const parts = text.split("(\\*\\*.*?\\*\\*)");
    const regex = /\*\*(.*?)\*\*/g;
    let match;
    const elements = [];
    let lastIndex = 0;
    
    while ((match = regex.exec(text)) !== null) {
      // Add text before bold
      if (match.index > lastIndex) {
        elements.push(text.substring(lastIndex, match.index));
      }
      // Add bold text
      elements.push(<strong className="font-bold text-foreground" key={match.index}>{match[1]}</strong>);
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }
    
    return elements.length > 0 ? elements : text;
  };

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <BarChart2 className="h-5 w-5 text-primary" />
              Analizador de Datos de Ventas
            </CardTitle>
            <CardDescription>
              Compara tus volúmenes comerciales para diagnosticar la salud de tu embudo de ventas B2B.
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {isSimulationMode && dbData.hasData && (
              <Button 
                variant="ghost" 
                size="xs" 
                onClick={handleResetToReal}
                className="text-[10px] text-muted-foreground h-6 px-2 hover:text-foreground"
              >
                Cargar Real
              </Button>
            )}
            <Badge 
              variant="outline" 
              className={
                isSimulationMode 
                  ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/35 font-semibold" 
                  : dbData.hasData 
                    ? "bg-green-500/10 text-green-500 border-green-500/20" 
                    : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
              }
            >
              {isSimulationMode ? "Modo Simulación" : dbData.hasData ? "IA Real (Supabase)" : "IA Real"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Leads totales</Label>
            <Input
              type="number"
              value={inputs.leads}
              onChange={(e) => handleInputChange("leads", parseInt(e.target.value) || 0)}
              className="bg-background border-border font-mono font-semibold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Llamadas realizadas</Label>
            <Input
              type="number"
              value={inputs.calls}
              onChange={(e) => handleInputChange("calls", parseInt(e.target.value) || 0)}
              className="bg-background border-border font-mono font-semibold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Reuniones agendadas</Label>
            <Input
              type="number"
              value={inputs.meetings}
              onChange={(e) => handleInputChange("meetings", parseInt(e.target.value) || 0)}
              className="bg-background border-border font-mono font-semibold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Ventas cerradas</Label>
            <Input
              type="number"
              value={inputs.sales}
              onChange={(e) => handleInputChange("sales", parseInt(e.target.value) || 0)}
              className="bg-background border-border font-mono font-semibold"
            />
          </div>
        </div>

        <Button 
          onClick={handleAnalyze} 
          className="w-full gap-2 bg-primary hover:bg-primary/95 text-white font-medium shadow-sm transition-all duration-200"
        >
          <Sparkles className="h-4 w-4" />
          Analizar con IA
        </Button>

        {/* Detailed Analysis Output */}
        {report && (
          <div className="space-y-6 pt-6 border-t border-border animate-slide-up">
            
            {/* 1. Diagnóstico del Embudo */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">1</span>
                Diagnóstico del Embudo
              </h3>
              
              <ul className="space-y-2.5 pl-6 list-disc text-xs text-muted-foreground">
                <li>
                  <span className="font-semibold text-foreground">{report.contactStatus.label} ({report.contactRate.toFixed(1)}%):</span>{" "}
                  {formatText(report.contactStatus.text)}
                </li>
                <li>
                  <span className="font-semibold text-foreground">{report.bookingStatus.label} ({report.bookingRate.toFixed(1)}%):</span>{" "}
                  {formatText(report.bookingStatus.text)}
                </li>
                <li>
                  <span className="font-semibold text-foreground">{report.closeStatus.label} ({report.closeRate.toFixed(1)}%):</span>{" "}
                  {formatText(report.closeStatus.text)}
                </li>
              </ul>

              <div className="p-3.5 bg-indigo-50/20 dark:bg-indigo-950/5 rounded-xl border border-indigo-100/30 dark:border-indigo-900/10 text-xs leading-relaxed text-muted-foreground mt-2">
                <span className="font-bold text-foreground block mb-1">Análisis general:</span>
                {formatText(report.generalAnalysis)}
              </div>
            </div>

            {/* 2. Las 3 Acciones Prioritarias */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">2</span>
                Las 3 Acciones Prioritarias para Mejorar Resultados
              </h3>
              
              <ol className="space-y-2.5 pl-6 list-decimal text-xs text-muted-foreground">
                {report.priorities.map((priority, idx) => (
                  <li key={idx}>
                    {formatText(priority)}
                  </li>
                ))}
              </ol>
            </div>

            {/* 3. Herramientas Recomendadas */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">3</span>
                Herramientas Específicas que Podrían Ayudar
              </h3>
              
              <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                {report.tools.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-2">
                    <span className="text-xs font-bold text-foreground block">
                      {group.category}:
                    </span>
                    <ul className="space-y-2 pl-4 list-disc text-xs text-muted-foreground">
                      {group.list.map((tool, tIdx) => (
                        <li key={tIdx}>
                          <span className="font-semibold text-foreground">{tool.name}:</span>{" "}
                          {tool.desc}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  );
};

