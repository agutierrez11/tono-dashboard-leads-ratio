import React from "react";
import { useMeliCockpit } from "@/hooks/useMeliCockpit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Phone,
  MessageSquare,
  Building2,
  Mail,
  Zap,
  Clock,
  TrendingUp,
  AlertTriangle,
  Layers,
  PlusCircle,
  PieChart as PieIcon,
  CheckCircle2,
  ArrowRight,
  Calculator,
  Compass,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Link } from "react-router-dom";
import { QuickOutreachLogger } from "@/components/dashboard/QuickOutreachLogger";
import { SalesforceGauge } from "@/components/dashboard/SalesforceGauge";
import { FourStageFunnel } from "@/components/dashboard/FourStageFunnel";
import { ActivePipelineManager } from "@/components/dashboard/ActivePipelineManager";

const PIE_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#64748b", // Slate
];

export const SalesforceCockpit: React.FC = () => {
  const { metrics, activateNextBatch } = useMeliCockpit();

  const dailyTouchGoal = 15;
  const dailyLeadGoal = 10;
  const leadProgress = Math.min(
    100,
    Math.round((metrics.leadsToday / dailyLeadGoal) * 100)
  );

  // Copiloto de Pacing Predictivo Automático (Sin calculadoras estáticas manuales)
  const remainingWorkDays = 21; // Días laborales de Noviembre
  const meliMonthlyGoal = 2; // Meta de 2 cierres de arranque en Noviembre
  const currentPacingTouches = metrics.totalTouchesToday || 8;
  const projectedMonthlyClosures = Math.min(
    2,
    Math.max(1, Math.round(((currentPacingTouches * 0.04) * remainingWorkDays) + metrics.wonLeadsCount))
  );
  const requiredDailyTouches = 8;

  return (
    <div className="space-y-6">
      {/* 1. Alerta de Inactividad (+7 Días sin toques) */}
      {metrics.staleLeads.length > 0 && (
        <div className="bg-destructive/10 border-2 border-destructive/30 rounded-xl p-4 flex items-center justify-between text-destructive shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 animate-pulse text-destructive" />
            <div>
              <p className="font-semibold text-sm">
                🚨 {metrics.staleLeads.length} cuentas con más de 7 días sin actividad
              </p>
              <p className="text-xs opacity-90">
                Estas cuentas están en riesgo de enfriarse o perder tracción en campo.
              </p>
            </div>
          </div>
          <Link to="/leads-list?filter=stale">
            <Button size="sm" variant="destructive" className="text-xs">
              Atacar Cuentas Estancadas <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* 2. Hero Section: Tacómetro de Adopción (Salesforce Style) + Cadencia de Canales + Copiloto Pacing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Tacómetro / Gauge (4 columnas) */}
        <div className="lg:col-span-4">
          <SalesforceGauge
            value={metrics.totalTouchesToday}
            target={dailyTouchGoal}
            label="Meta de Actividad Diaria"
            sublabel="Mínimo 8 para ritmo base • 12-15 para alta conversión"
          />
        </div>

        {/* Canales y Pacing Predictivo (8 columnas) */}
        <div className="lg:col-span-8 flex flex-col justify-between gap-3">
          {/* Contador de Canales de Hoy */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Card className="p-3 text-center border-purple-500/20 bg-purple-500/5">
              <div className="flex justify-center mb-1">
                <MapPin className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
                {metrics.cambaceoToday || metrics.visitsToday}
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">Cambaceo en Calle</div>
            </Card>

            <Card className="p-3 text-center border-emerald-500/20 bg-emerald-500/5">
              <div className="flex justify-center mb-1">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {metrics.whatsappsToday}
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">WhatsApps Hoy</div>
            </Card>

            <Card className="p-3 text-center border-blue-500/20 bg-blue-500/5">
              <div className="flex justify-center mb-1">
                <Phone className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                {metrics.callsToday}
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">Llamadas Hoy</div>
            </Card>

            <Card className="p-3 text-center border-amber-500/20 bg-amber-500/5">
              <div className="flex justify-center mb-1">
                <Mail className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                {metrics.emailsToday}
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">Correos Hoy</div>
            </Card>
          </div>

          {/* Copiloto de Pacing Predictivo (La calculadora convertida en inteligencia ejecutiva) */}
          <div className="p-3.5 rounded-xl border bg-gradient-to-r from-blue-500/5 via-card to-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Copiloto de Pacing • Meta Mensual MELI
                  </h4>
                  <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                    Objetivo: 2 Cierres
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Proyección al ritmo actual: <strong className="text-foreground">{projectedMonthlyClosures} cierres ganados</strong> (~${((projectedMonthlyClosures * 450000) / 1000).toLocaleString()}k TPV). Cadencia recomendada: <strong>{requiredDailyTouches} toques diarios</strong> para asegurar tus aperturas del mes.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => activateNextBatch(10)}
              className="text-xs h-8 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              Activar Lote de 10
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Embudo de Conversión de 4 Etapas (Al día, por semana y por mes) */}
      <FourStageFunnel />

      {/* 4. Pipeline Activo en Gestión (Tus Cuentas de Hoy - Mueve etapas y toques en 1 clic) */}
      <ActivePipelineManager />

      {/* 5. Registro Rápido de Acciones en Campo (1-Clic, Local-First) */}
      <QuickOutreachLogger />

      {/* 5. Métrica Reina: Velocidad de Cierre General & Concentración por Industria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Velocidad */}
        <Card className="flex flex-col border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Velocidad de Cierre General
                </CardTitle>
                <CardDescription className="text-xs">
                  Tiempo promedio desde el primer contacto hasta el cierre ganado
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-primary">
                  {metrics.avgDaysToClose || 0}
                </span>
                <span className="text-xs text-muted-foreground block">días promedio</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-end">
            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.velocityBins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0176D3" radius={[4, 4, 0, 0]} name="Cuentas Cerradas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              Distribución de días de ciclo de venta (frecuencia de cierres rápidos vs lentos).
            </p>
          </CardContent>
        </Card>

        {/* Concentración de Pipeline por Industria */}
        <Card className="flex flex-col border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-primary" />
              Concentración de Pipeline por Industria
            </CardTitle>
            <CardDescription className="text-xs">
              Diversificación de tus cuentas en Quintana Roo
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            {metrics.pieIndustryData.length === 0 ? (
              <div className="h-[210px] flex items-center justify-center text-muted-foreground text-xs">
                Sin cuentas en el pipeline activo todavía. Activa un lote de 10 para comenzar.
              </div>
            ) : (
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.pieIndustryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      label={({ name, percent }) => `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`}
                    >
                      {metrics.pieIndustryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex flex-wrap gap-2 justify-center mt-2 text-[11px]">
              {metrics.pieIndustryData.slice(0, 4).map((ind, idx) => (
                <span key={ind.name} className="flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-full inline-block"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  {ind.name.split("(")[0]} ({ind.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 6. Tabla Ejecutiva: Velocidad y Desempeño por Industria */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Velocidad y Desempeño por Industria / Vertical
          </CardTitle>
          <CardDescription className="text-xs">
            Compara en qué sector cierras más rápido y qué industrias generan mayor volumen de TPV
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="p-2.5 font-medium">Vertical / Industria</th>
                  <th className="p-2.5 font-medium text-center">Cuentas Activas</th>
                  <th className="p-2.5 font-medium text-center">Cierres Ganados</th>
                  <th className="p-2.5 font-medium text-center">Velocidad Promedio</th>
                  <th className="p-2.5 font-medium text-right">TPV Ganado (Cerrado)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {metrics.pieIndustryData.map((ind) => (
                  <tr key={ind.name} className="hover:bg-muted/10 transition-colors">
                    <td className="p-2.5 font-medium">{ind.name}</td>
                    <td className="p-2.5 text-center">{ind.value}</td>
                    <td className="p-2.5 text-center text-emerald-600 font-semibold">{ind.won}</td>
                    <td className="p-2.5 text-center">
                      {ind.avgDays > 0 ? `${ind.avgDays} días` : "--"}
                    </td>
                    <td className="p-2.5 text-right font-medium">
                      {ind.won > 0 ? `$${(ind.tpv / 1000).toLocaleString()}k MXN` : "$0 MXN"}
                    </td>
                  </tr>
                ))}
                {metrics.pieIndustryData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      Sin datos en el pipeline activo. Usa el botón "Activar Siguiente Lote de 10" para empezar tu día.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
