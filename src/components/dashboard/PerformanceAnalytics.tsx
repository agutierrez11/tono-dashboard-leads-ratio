import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSalesFunnelMetrics } from "@/hooks/useSalesFunnelMetrics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { AlertCircle, TrendingUp, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const PerformanceAnalytics = () => {
  const { metrics, isLoading } = useSalesFunnelMetrics();

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Análisis de Desempeño</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            Cargando métricas...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (metrics.totalLeads === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Análisis de Desempeño</CardTitle>
          <CardDescription>
            No hay datos disponibles. Agrega leads para ver el análisis.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Preparar datos para gráfico del embudo
  const funnelChartData = metrics.stages.map(stage => ({
    name: stage.name,
    count: stage.count,
    percentage: parseFloat(stage.percentage.toFixed(1)),
  }));

  // Preparar datos para proyecciones
  const projectionData = [
    { name: "Contactos", value: metrics.projections.if100Contacts },
    { name: "Contactados", value: metrics.projections.if100Contacted },
    { name: "Relevantes", value: metrics.projections.if100Relevant },
    { name: "Oportunidades", value: metrics.projections.if100Opportunities },
    { name: "Clientes", value: metrics.projections.if100Customers },
  ];

  return (
    <div className="space-y-6">
      {/* Embudo de Ventas Principal */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Embudo de Ventas
          </CardTitle>
          <CardDescription>
            Distribución de leads por etapa del proceso comercial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.stages.map((stage, index) => {
              const isLastStage = index === metrics.stages.length - 1;
              const nextStage = metrics.stages[index + 1];
              const conversionToNext = nextStage
                ? parseFloat(
                    ((nextStage.count / stage.count) * 100).toFixed(1)
                  )
                : 0;

              return (
                <div key={stage.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="font-medium text-sm min-w-[140px]">
                        {stage.name}
                      </span>
                      <Badge variant="outline" className="bg-primary/10">
                        {stage.count} leads
                      </Badge>
                      <Badge variant="secondary">
                        {stage.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                    {!isLastStage && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        → {conversionToNext.toFixed(1)}% al siguiente
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-muted rounded-full h-8 overflow-hidden">
                    <div
                      className={cn(
                        "h-full flex items-center justify-center text-xs font-semibold text-white transition-all duration-500",
                        index === 0 && "bg-blue-500",
                        index === 1 && "bg-yellow-500",
                        index === 2 && "bg-purple-500",
                        index === 3 && "bg-orange-500",
                        index === 4 && "bg-green-500"
                      )}
                      style={{ width: `${stage.percentage}%` }}
                    >
                      {stage.percentage > 10 && `${stage.percentage.toFixed(1)}%`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Proyecciones */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Proyecciones (Si tuvieras 100 contactos)
          </CardTitle>
          <CardDescription>
            Estimación de conversión en cada etapa del embudo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Tabla de proyecciones */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-2">
            {projectionData.map((item) => (
              <div
                key={item.name}
                className="p-3 rounded-lg bg-muted text-center border border-border"
              >
                <div className="text-2xl font-bold text-primary">
                  {item.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tasas de Conversión por Canal */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Tasa de Conversión por Canal</CardTitle>
          <CardDescription>
            Porcentaje de leads que se convierten en clientes por cada canal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(metrics.conversionRateByChannel).map(
              ([channel, rate]) => (
                <div
                  key={channel}
                  className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{channel}</span>
                    <Badge
                      variant={rate > 20 ? "default" : "secondary"}
                      className={rate > 20 ? "bg-green-500/20 text-green-700" : ""}
                    >
                      {rate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        rate > 20 ? "bg-green-500" : "bg-yellow-500"
                      )}
                      style={{ width: `${Math.min(rate, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {rate > 20
                      ? "✅ Buen desempeño"
                      : rate > 10
                      ? "⚠️ Promedio"
                      : "❌ Necesita mejora"}
                  </p>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ciclo de Venta Promedio */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Ciclo de Venta Promedio (Full Cycle)</CardTitle>
          <CardDescription>
            Tiempo promedio total y desglose por etapas comerciales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center py-4 border-b border-border/40 pb-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">
                {metrics.averageCycleTime.toFixed(0)}
              </div>
              <div className="text-sm font-semibold text-foreground mt-1">Días Totales (Full Cycle)</div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.averageCycleTime > 30
                  ? "⚠️ Ciclo total largo. Analiza cuál de las fases tiene cuellos de botella."
                  : metrics.averageCycleTime > 15
                  ? "✅ Ciclo total moderado. Mantén la velocidad de seguimiento."
                  : "🚀 Ciclo total rápido. Excelente tiempo de respuesta."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/20 p-3 rounded-lg text-center border border-border/30">
              <div className="text-2xl font-bold text-yellow-600">
                {metrics.averageProspectingTime.toFixed(0)}
              </div>
              <div className="text-xs font-semibold text-foreground mt-1">Fase Prospección (SDR)</div>
              <p className="text-[10px] text-muted-foreground mt-1">Creación del lead a primer contacto</p>
            </div>
            <div className="bg-secondary/20 p-3 rounded-lg text-center border border-border/30">
              <div className="text-2xl font-bold text-green-600">
                {metrics.averageClosingTime.toFixed(0)}
              </div>
              <div className="text-xs font-semibold text-foreground mt-1">Fase Cierre (AE)</div>
              <p className="text-[10px] text-muted-foreground mt-1">Primer contacto a firma de contrato</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cuellos de Botella */}
      {metrics.bottlenecks.length > 0 && (
        <Card className="glass-card border-orange-500/30 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              Cuellos de Botella Identificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.bottlenecks.map((bottleneck, index) => (
                <Alert key={index} className="border-orange-500/30 bg-orange-500/5">
                  <AlertDescription className="text-orange-700">
                    {bottleneck}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendaciones */}
      {metrics.recommendations.length > 0 && (
        <Card className="glass-card border-blue-500/30 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Zap className="h-5 w-5" />
              Recomendaciones de Mejora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-700"
                >
                  {rec}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
