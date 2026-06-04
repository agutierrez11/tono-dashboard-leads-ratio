import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useSalesFunnelMetrics } from "@/hooks/useSalesFunnelMetrics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Calculator, TrendingUp, Zap } from "lucide-react";

interface ScenarioInputs {
  contactRate: number;
  relevantRate: number;
  opportunityRate: number;
  customerRate: number;
}

export const FunnelCalculator = () => {
  const { metrics } = useSalesFunnelMetrics();
  const [scenario, setScenario] = useState<ScenarioInputs>({
    contactRate: metrics.stages[1]?.conversionFromPrevious || 35,
    relevantRate: metrics.stages[2]?.conversionFromPrevious || 35,
    opportunityRate: metrics.stages[3]?.conversionFromPrevious || 67,
    customerRate: metrics.stages[4]?.conversionFromPrevious || 25,
  });

  const [targetLeads, setTargetLeads] = useState(100);

  // Calcular proyecciones basadas en el escenario
  const projections = useMemo(() => {
    const contacted = Math.round((targetLeads * scenario.contactRate) / 100);
    const relevant = Math.round((contacted * scenario.relevantRate) / 100);
    const opportunities = Math.round((relevant * scenario.opportunityRate) / 100);
    const customers = Math.round((opportunities * scenario.customerRate) / 100);

    return {
      targetLeads,
      contacted,
      relevant,
      opportunities,
      customers,
      contactRate: scenario.contactRate,
      relevantRate: scenario.relevantRate,
      opportunityRate: scenario.opportunityRate,
      customerRate: scenario.customerRate,
    };
  }, [targetLeads, scenario]);

  // Datos para gráfico de comparación
  const comparisonData = [
    {
      stage: "Contactos",
      actual: metrics.stages[0]?.count || 0,
      proyectado: projections.targetLeads,
    },
    {
      stage: "Contactados",
      actual: metrics.stages[1]?.count || 0,
      proyectado: projections.contacted,
    },
    {
      stage: "Relevantes",
      actual: metrics.stages[2]?.count || 0,
      proyectado: projections.relevant,
    },
    {
      stage: "Oportunidades",
      actual: metrics.stages[3]?.count || 0,
      proyectado: projections.opportunities,
    },
    {
      stage: "Clientes",
      actual: metrics.stages[4]?.count || 0,
      proyectado: projections.customers,
    },
  ];

  // Datos para gráfico de impacto de cambios
  const impactData = [
    {
      name: "Contacto",
      actual: scenario.contactRate,
      mejora10: scenario.contactRate + 10,
      mejora20: scenario.contactRate + 20,
    },
    {
      name: "Relevancia",
      actual: scenario.relevantRate,
      mejora10: scenario.relevantRate + 10,
      mejora20: scenario.relevantRate + 20,
    },
    {
      name: "Oportunidad",
      actual: scenario.opportunityRate,
      mejora10: scenario.opportunityRate + 10,
      mejora20: scenario.opportunityRate + 20,
    },
    {
      name: "Cierre",
      actual: scenario.customerRate,
      mejora10: scenario.customerRate + 10,
      mejora20: scenario.customerRate + 20,
    },
  ];

  // Calcular impacto de mejoras
  const calculateImpactWithImprovement = (improvement: number) => {
    const newScenario = {
      contactRate: Math.min(100, scenario.contactRate + improvement),
      relevantRate: Math.min(100, scenario.relevantRate + improvement),
      opportunityRate: Math.min(100, scenario.opportunityRate + improvement),
      customerRate: Math.min(100, scenario.customerRate + improvement),
    };

    const contacted = Math.round((targetLeads * newScenario.contactRate) / 100);
    const relevant = Math.round((contacted * newScenario.relevantRate) / 100);
    const opportunities = Math.round((relevant * newScenario.opportunityRate) / 100);
    const customers = Math.round((opportunities * newScenario.customerRate) / 100);

    return customers;
  };

  const impactWith10 = calculateImpactWithImprovement(10);
  const impactWith20 = calculateImpactWithImprovement(20);

  return (
    <div className="space-y-6">
      {/* Calculadora Interactiva */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Escenarios
          </CardTitle>
          <CardDescription>
            Ajusta las tasas de conversión para ver cómo impacta en tus resultados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input de leads objetivo */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Leads Objetivo (Contactos Totales)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={targetLeads}
                onChange={(e) => setTargetLeads(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1"
                min="1"
              />
              <span className="text-sm text-muted-foreground py-2">leads</span>
            </div>
          </div>

          {/* Sliders para tasas de conversión */}
          <div className="space-y-4">
            {[
              {
                key: "contactRate" as const,
                label: "Tasa de Contacto",
                description: "% de leads que contactas",
              },
              {
                key: "relevantRate" as const,
                label: "Tasa de Relevancia",
                description: "% de contactados que calificas",
              },
              {
                key: "opportunityRate" as const,
                label: "Tasa de Oportunidad",
                description: "% de calificados que son oportunidades",
              },
              {
                key: "customerRate" as const,
                label: "Tasa de Cierre",
                description: "% de oportunidades que cierras",
              },
            ].map(({ key, label, description }) => (
              <div key={key} className="space-y-2 p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">{label}</label>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <Badge className="text-lg px-3 py-1">
                    {scenario[key].toFixed(0)}%
                  </Badge>
                </div>
                <Slider
                  value={[scenario[key]]}
                  onValueChange={([value]) =>
                    setScenario({ ...scenario, [key]: value })
                  }
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            ))}
          </div>

          {/* Resumen de proyecciones */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-6 pt-6 border-t">
            {[
              { label: "Contactos", value: projections.targetLeads },
              { label: "Contactados", value: projections.contacted },
              { label: "Relevantes", value: projections.relevant },
              { label: "Oportunidades", value: projections.opportunities },
              { label: "Clientes", value: projections.customers },
            ].map((item) => (
              <div
                key={item.label}
                className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center"
              >
                <div className="text-2xl font-bold text-primary">
                  {item.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Comparación */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Comparación: Actual vs. Proyectado</CardTitle>
          <CardDescription>
            Cómo se vería tu embudo con los parámetros actuales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="actual" fill="#94a3b8" name="Actual" radius={[4, 4, 0, 0]} />
              <Bar dataKey="proyectado" fill="#3b82f6" name="Proyectado" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Análisis de Impacto */}
      <Card className="glass-card border-green-500/30 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Zap className="h-5 w-5" />
            Impacto de Mejoras
          </CardTitle>
          <CardDescription>
            Cómo mejoras en cada etapa impactarían en clientes finales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="text-sm text-muted-foreground mb-2">Escenario Actual</div>
              <div className="text-3xl font-bold text-green-600">
                {projections.customers}
              </div>
              <div className="text-xs text-muted-foreground mt-1">clientes</div>
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-sm text-muted-foreground mb-2">
                +10% en cada etapa
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {impactWith10}
              </div>
              <div className="text-xs text-green-600 mt-1">
                +{impactWith10 - projections.customers} clientes
              </div>
            </div>

            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="text-sm text-muted-foreground mb-2">
                +20% en cada etapa
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {impactWith20}
              </div>
              <div className="text-xs text-green-600 mt-1">
                +{impactWith20 - projections.customers} clientes
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm">
              <strong>Conclusión:</strong> Si mejoras cada etapa en un 10%, pasarías de{" "}
              <span className="font-bold text-green-600">{projections.customers}</span> a{" "}
              <span className="font-bold text-blue-600">{impactWith10}</span> clientes. Eso es{" "}
              <span className="font-bold">
                {(((impactWith10 - projections.customers) / projections.customers) * 100).toFixed(0)}%
              </span>{" "}
              más de ingresos potencial.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
