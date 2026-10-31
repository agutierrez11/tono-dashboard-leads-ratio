import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  History,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from "lucide-react";
import { useMeliCockpit } from "@/hooks/useMeliCockpit";

const DONUT_COLORS_GOOD = ["#10b981", "#e2e8f0"];
const DONUT_COLORS_WARN = ["#f59e0b", "#e2e8f0"];

export const ExecutiveHistoryDashboard: React.FC = () => {
  const { activeLeads, metrics } = useMeliCockpit();
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

  // Real data computation (Zero fake fallbacks)
  const comparisonData = useMemo(() => {
    // Current Real Metrics
    const realTouches = metrics.totalTouchesToday;
    const realProspects = activeLeads.length;
    const realNegotiation = activeLeads.filter(
      (l) => l.stage === "visit" || l.stage === "proposal" || l.stage === "negotiation"
    ).length;
    const realClosed = metrics.wonLeadsCount;
    const realTpv = metrics.totalWonTpv / 1000;

    // Previous Period Historical (Read from localStorage or initialize at 0 for Nov 2 kickoff)
    let previousTouches = 0;
    let previousProspects = 0;
    let previousNegotiation = 0;
    let previousClosed = 0;
    let previousTpv = 0;

    try {
      const savedHistory = localStorage.getItem("meli_previous_period_snapshot");
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        previousTouches = parsed.touches || 0;
        previousProspects = parsed.prospects || 0;
        previousNegotiation = parsed.negotiation || 0;
        previousClosed = parsed.closed || 0;
        previousTpv = parsed.tpv || 0;
      }
    } catch {
      // clean start
    }

    const current = {
      label: viewMode === "week" ? "Semana Actual (W)" : "Noviembre 2026 (M)",
      touches: realTouches,
      prospects: realProspects,
      negotiation: realNegotiation,
      closed: realClosed,
      tpv: realTpv,
    };

    const previous = {
      label: viewMode === "week" ? "Semana Anterior (W-1)" : "Mes Anterior (M-1)",
      touches: previousTouches,
      prospects: previousProspects,
      negotiation: previousNegotiation,
      closed: previousClosed,
      tpv: previousTpv,
    };

    const calcDelta = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    };

    const hasPreviousData = previousTouches > 0 || previousProspects > 0;

    return {
      current,
      previous,
      hasPreviousData,
      deltas: {
        touches: calcDelta(current.touches, previous.touches),
        prospects: calcDelta(current.prospects, previous.prospects),
        negotiation: calcDelta(current.negotiation, previous.negotiation),
        closed: calcDelta(current.closed, previous.closed),
        tpv: calcDelta(current.tpv, previous.tpv),
      },
      chartData: [
        { name: "Toques Comerciales", "Período Actual": current.touches, "Período Anterior": previous.touches },
        { name: "Prospectos Activos", "Período Actual": current.prospects, "Período Anterior": previous.prospects },
        { name: "En Negociación", "Período Actual": current.negotiation, "Período Anterior": previous.negotiation },
        { name: "Cierres Ganados", "Período Actual": current.closed, "Período Anterior": previous.closed },
      ],
    };
  }, [viewMode, metrics, activeLeads]);

  // Data Quality Metrics (Salesforce Screenshot 2 Style)
  const qualityData = useMemo(() => {
    const total = activeLeads.length;

    if (total === 0) {
      return {
        phoneScore: 100,
        withPhone: 0,
        missingPhone: 0,
        addressScore: 100,
        withAddress: 0,
        missingAddress: 0,
        healthScore: 100,
        activeHealthyCount: 0,
        staleCount: 0,
        isEmpty: true,
      };
    }

    // 1. Phone / Contact Quality
    const withPhone = activeLeads.filter((l) => l.phone && l.phone.length >= 10).length;
    const phoneScore = Math.round((withPhone / total) * 100);

    // 2. Structured Address Quality (Requisito MELI 90% rechazo)
    const withAddress = activeLeads.filter(
      (l) => l.street_and_number && l.postal_code && l.postal_code.length === 5
    ).length;
    const addressScore = Math.round((withAddress / total) * 100);

    // 3. Stale vs Active Quality (+7 days)
    const staleCount = metrics.staleLeads.length;
    const activeHealthyCount = Math.max(0, total - staleCount);
    const healthScore = Math.round((activeHealthyCount / total) * 100);

    return {
      phoneScore,
      withPhone,
      missingPhone: total - withPhone,
      addressScore,
      withAddress,
      missingAddress: total - withAddress,
      healthScore,
      activeHealthyCount,
      staleCount,
      isEmpty: false,
    };
  }, [activeLeads, metrics]);

  return (
    <div className="space-y-6">
      {/* Header Superior del Tablero Histórico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card shadow-sm">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Tablero de Tendencias & Histórico Ejecutivo
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Análisis comparativo de rendimiento (W vs W-1 / M vs M-1) y auditoría de calidad de datos.
          </p>
        </div>

        {/* Selector de Comparativa */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <Button
            variant={viewMode === "week" ? "default" : "ghost"}
            size="sm"
            className="h-8 text-xs px-3"
            onClick={() => setViewMode("week")}
          >
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Semana vs Semana (W vs W-1)
          </Button>
          <Button
            variant={viewMode === "month" ? "default" : "ghost"}
            size="sm"
            className="h-8 text-xs px-3"
            onClick={() => setViewMode("month")}
          >
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Mes vs Mes (M vs M-1)
          </Button>
        </div>
      </div>

      {/* 1. Tarjetas de KPI con Datos Reales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Toques */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Toques Comerciales</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-baseline justify-between">
              {comparisonData.current.touches}
              {comparisonData.hasPreviousData && (
                <span
                  className={`text-xs font-semibold flex items-center ${
                    comparisonData.deltas.touches >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {comparisonData.deltas.touches >= 0 ? (
                    <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                  )}
                  {Math.abs(comparisonData.deltas.touches)}%
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-muted-foreground">
              {comparisonData.hasPreviousData
                ? `vs ${comparisonData.previous.touches} en ${comparisonData.previous.label}`
                : "Semana de arranque: 2 de Noviembre"}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Prospectos Activados */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Prospectos Activados</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-baseline justify-between">
              {comparisonData.current.prospects}
              {comparisonData.hasPreviousData && (
                <span
                  className={`text-xs font-semibold flex items-center ${
                    comparisonData.deltas.prospects >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {comparisonData.deltas.prospects >= 0 ? (
                    <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                  )}
                  {Math.abs(comparisonData.deltas.prospects)}%
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-muted-foreground">
              {comparisonData.hasPreviousData
                ? `vs ${comparisonData.previous.prospects} en ${comparisonData.previous.label}`
                : "En gestión activa en tu CRM"}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: En Negociación */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Cuentas en Negociación</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-baseline justify-between">
              {comparisonData.current.negotiation}
              {comparisonData.hasPreviousData && (
                <span
                  className={`text-xs font-semibold flex items-center ${
                    comparisonData.deltas.negotiation >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {comparisonData.deltas.negotiation >= 0 ? (
                    <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                  )}
                  {Math.abs(comparisonData.deltas.negotiation)}%
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-muted-foreground">
              {comparisonData.hasPreviousData
                ? `vs ${comparisonData.previous.negotiation} en ${comparisonData.previous.label}`
                : "Citas y propuestas entregadas"}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Cierres Ganados */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Cierres Ganados</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-baseline justify-between text-emerald-600">
              {comparisonData.current.closed}
              {comparisonData.hasPreviousData && (
                <span
                  className={`text-xs font-semibold flex items-center ${
                    comparisonData.deltas.closed >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {comparisonData.deltas.closed >= 0 ? (
                    <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                  )}
                  {Math.abs(comparisonData.deltas.closed)}%
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-muted-foreground">
              TPV Acumulado: ${(comparisonData.current.tpv).toLocaleString()}k MXN
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Gráfico de Barras Agrupadas Comparativo */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Evolución Comparativa: {comparisonData.current.label}
              </CardTitle>
              <CardDescription className="text-xs">
                Métricas reales acumuladas semana a semana en tu gestión comercial.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              Historial Real
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData.chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                {/* Azul Salesforce oficial */}
                <Bar dataKey="Período Actual" fill="#0176D3" radius={[4, 4, 0, 0]} />
                {/* Gris neutro corporativo */}
                <Bar dataKey="Período Anterior" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3. Calidad de Datos (Inspirado en Salesforce Data Quality) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Donut 1: Calidad de Teléfonos */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Calidad de Contacto (Teléfono)</span>
              <Badge variant="outline" className="text-[10px]">
                {qualityData.phoneScore}%
              </Badge>
            </CardTitle>
            <CardDescription className="text-[11px]">
              Prospectos con teléfono verificado de 10 dígitos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-32 w-32 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Con Teléfono", value: qualityData.withPhone || 1 },
                      { name: "Sin Teléfono", value: qualityData.missingPhone },
                    ]}
                    innerRadius={38}
                    outerRadius={50}
                    dataKey="value"
                  >
                    <Cell fill={qualityData.isEmpty ? "#e2e8f0" : DONUT_COLORS_GOOD[0]} />
                    <Cell fill={DONUT_COLORS_GOOD[1]} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <span className="absolute text-base font-bold">
                {qualityData.isEmpty ? "0%" : `${qualityData.phoneScore}%`}
              </span>
            </div>
            <div className="w-full flex justify-between text-[11px] text-muted-foreground mt-2 border-t pt-2">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> {qualityData.withPhone} Con Datos
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-slate-300" /> {qualityData.missingPhone} Faltantes
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Donut 2: Calidad de Dirección Estructurada MELI */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Direcciones Estructuradas (MELI)</span>
              <Badge variant="outline" className="text-[10px]">
                {qualityData.addressScore}%
              </Badge>
            </CardTitle>
            <CardDescription className="text-[11px]">
              Evita el 90% de rechazos al dar de alta en CRM MELI.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-32 w-32 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Estructurada", value: qualityData.withAddress || 1 },
                      { name: "Pendiente Validar", value: qualityData.missingAddress },
                    ]}
                    innerRadius={38}
                    outerRadius={50}
                    dataKey="value"
                  >
                    <Cell fill={qualityData.isEmpty ? "#e2e8f0" : DONUT_COLORS_WARN[0]} />
                    <Cell fill={DONUT_COLORS_WARN[1]} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <span className="absolute text-base font-bold">
                {qualityData.isEmpty ? "0%" : `${qualityData.addressScore}%`}
              </span>
            </div>
            <div className="w-full flex justify-between text-[11px] text-muted-foreground mt-2 border-t pt-2">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> {qualityData.withAddress} Listos MELI
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-slate-300" /> {qualityData.missingAddress} Por Validar
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Donut 3: Salud del Pipeline */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Salud del Pipeline (&lt;7 días)</span>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  qualityData.staleCount > 0 ? "text-rose-600 border-rose-300" : "text-emerald-600"
                }`}
              >
                {qualityData.staleCount > 0 ? `🚨 ${qualityData.staleCount} Estancados` : "100% Al Día"}
              </Badge>
            </CardTitle>
            <CardDescription className="text-[11px]">
              Cuentas activas con seguimiento reciente vs abandonadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-32 w-32 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Al Día", value: qualityData.activeHealthyCount || 1 },
                      { name: "Estancadas (+7d)", value: qualityData.staleCount },
                    ]}
                    innerRadius={38}
                    outerRadius={50}
                    dataKey="value"
                  >
                    <Cell fill={qualityData.isEmpty ? "#e2e8f0" : DONUT_COLORS_GOOD[0]} />
                    <Cell fill={qualityData.staleCount > 0 ? "#ef4444" : "#e2e8f0"} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <span className="absolute text-base font-bold">
                {qualityData.isEmpty ? "100%" : `${qualityData.healthScore}%`}
              </span>
            </div>
            <div className="w-full flex justify-between text-[11px] text-muted-foreground mt-2 border-t pt-2">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> {qualityData.activeHealthyCount} Activas
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> {qualityData.staleCount} En Riesgo
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
