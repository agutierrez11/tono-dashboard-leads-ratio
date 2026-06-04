import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, BarChart2, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { useSalesDataAnalyzer } from "@/hooks/useSalesDataAnalyzer";

export const SalesDataAnalyzer = () => {
  const {
    dbData,
    inputs,
    isSimulationMode,
    report,
    handleInputChange,
    handleAnalyze,
    handleResetToReal
  } = useSalesDataAnalyzer();

  const formatText = (text: string) => {
    const regex = /\*\*(.*?)\*\*/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        elements.push(text.substring(lastIndex, match.index));
      }
      elements.push(
        <strong className="font-bold text-foreground" key={match.index}>
          {match[1]}
        </strong>
      );
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
                size="sm" 
                onClick={handleResetToReal}
                className="text-[10px] text-muted-foreground h-6 px-2 hover:text-foreground hover:bg-accent transition-colors"
              >
                Cargar Real
              </Button>
            )}
            <Badge 
              variant="outline" 
              className={
                isSimulationMode 
                  ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/35 font-bold" 
                  : dbData.hasData 
                    ? "bg-green-500/10 text-green-500 border-green-500/20 font-bold" 
                    : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 font-bold"
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
                <li className="flex items-start gap-2">
                  {report.contactStatus.status === "good" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <span>
                    <span className="font-semibold text-foreground">{report.contactStatus.label} ({report.contactRate.toFixed(1)}%):</span>{" "}
                    {formatText(report.contactStatus.text)}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  {report.bookingStatus.status === "good" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <span>
                    <span className="font-semibold text-foreground">{report.bookingStatus.label} ({report.bookingRate.toFixed(1)}%):</span>{" "}
                    {formatText(report.bookingStatus.text)}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  {report.closeStatus.status === "good" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <span>
                    <span className="font-semibold text-foreground">{report.closeStatus.label} ({report.closeRate.toFixed(1)}%):</span>{" "}
                    {formatText(report.closeStatus.text)}
                  </span>
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
