import React, { useState } from "react";
import { useMeliCockpit } from "@/hooks/useMeliCockpit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
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
  const [activeSubTab, setActiveSubTab] = useState<"industry" | "product">("industry");

  const dailyTouchGoal = 15;
  const touchProgress = Math.min(100, Math.round((metrics.totalTouchesToday / dailyTouchGoal) * 100));

  const dailyLeadGoal = 10;
  const leadProgress = Math.min(100, Math.round((metrics.leadsToday / dailyLeadGoal) * 100));

  return (
    <div className="space-y-6">
      {/* 1. Alerta de Inactividad (+7 Días sin toques) */}
      {metrics.staleLeads.length > 0 && (
        <div className="bg-destructive/10 border-2 border-destructive/30 rounded-xl p-4 flex items-center justify-between text-destructive">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 animate-pulse text-destructive" />
            <div>
              <p className="font-semibold text-sm">
                🚨 {metrics.staleLeads.length} cuentas con más de 7 días sin actividad
              </p>
              <p className="text-xs opacity-90">
                Estas cuentas están en riesgo de enfriarse o perder tracción frente a Clip/bancos.
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

      {/* 2. Barra de Control de Pacing: Lotes de 10 vs Alta Manual */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-background">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  🎯 Disciplina Diaria MELI
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Banco de reserva: <strong>{metrics.stagingCount} leads listos</strong>
                </span>
              </div>
              <h3 className="text-lg font-bold">
                Leads Activados Hoy: {metrics.leadsToday} / {dailyLeadGoal}
              </h3>
              <p className="text-xs text-muted-foreground">
                Sube de 10 en 10 para garantizar el seguimiento y no saturar tu tablero.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button
                onClick={() => activateNextBatch(10)}
                className="flex-1 md:flex-none bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Layers className="h-4 w-4 mr-2" />
                Activar Siguiente Lote de 10
              </Button>
              <Link to="/leads" className="flex-1 md:flex-none">
                <Button variant="outline" className="w-full">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Alta Manual en Calle
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Ritmo de Prospección Diaria</span>
              <span>{leadProgress}% de la meta (8-10 leads)</span>
            </div>
            <Progress value={leadProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* 3. Panel de Acciones del Día (Salesforce Cadence Tracker) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3 text-center border-emerald-500/20 bg-emerald-500/5">
          <div className="flex justify-center mb-1">
            <MessageSquare className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.whatsappsToday}
          </div>
          <div className="text-[11px] text-muted-foreground">WhatsApps Hoy</div>
        </Card>

        <Card className="p-3 text-center border-blue-500/20 bg-blue-500/5">
          <div className="flex justify-center mb-1">
            <Phone className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {metrics.callsToday}
          </div>
          <div className="text-[11px] text-muted-foreground">Llamadas Hoy</div>
        </Card>

        <Card className="p-3 text-center border-purple-500/20 bg-purple-500/5">
          <div className="flex justify-center mb-1">
            <Building2 className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {metrics.visitsToday}
          </div>
          <div className="text-[11px] text-muted-foreground">Visitas en Campo</div>
        </Card>

        <Card className="p-3 text-center border-amber-500/20 bg-amber-500/5">
          <div className="flex justify-center mb-1">
            <Mail className="h-5 w-5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {metrics.emailsToday}
          </div>
          <div className="text-[11px] text-muted-foreground">Correos Hoy</div>
        </Card>

        <Card className="p-3 text-center col-span-2 md:col-span-1 border-primary/20 bg-primary/5">
          <div className="flex justify-center mb-1">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold text-primary">
            {metrics.totalTouchesToday} / {dailyTouchGoal}
          </div>
          <div className="text-[11px] text-muted-foreground">Toques Totales Hoy</div>
        </Card>
      </div>

      {/* 4. Métricas de Entrada: Día, Semana, Mes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Leads Subidos Hoy</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              {metrics.leadsToday}
              <Badge variant="secondary" className="text-xs">Meta: 8-10</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Ritmo óptimo para alimentar tu embudo diario.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Leads Esta Semana</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              {metrics.leadsThisWeek}
              <Badge variant="secondary" className="text-xs">Meta: 40-50</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Cuentas activas en proceso de contacto inicial.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Cierres Ganados en Noviembre</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              {metrics.wonLeadsCount} cuentas
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                ${(metrics.totalWonTpv / 1000).toFixed(0)}k TPV
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Terminales colocadas y transaccionando.</p>
          </CardContent>
        </Card>
      </div>

      {/* 5. Métrica Reina: Velocidad de Cierre General & Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
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
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.velocityBins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Tratos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              💡 La mayoría de tus cuentas de alto TPV deben cerrar entre 4 y 7 días para evitar fricción.
            </p>
          </CardContent>
        </Card>

        {/* 6. Gráfica de Pastel de Industrias (Salesforce Style) */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <PieIcon className="h-5 w-5 text-primary" />
                  Distribución por Industria
                </CardTitle>
                <CardDescription className="text-xs">
                  Porcentaje de cuentas en tu pipeline por vertical de negocio
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            {metrics.pieIndustryData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
                Activa tu primer lote de leads para visualizar la distribución por industria.
              </div>
            ) : (
              <div className="h-[220px] w-full flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.pieIndustryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
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

      {/* 7. Sub-productos: Análisis por Industria y Producto */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Sub-productos de Velocidad: Industria vs Producto
              </CardTitle>
              <CardDescription className="text-xs">
                Compara en qué sector cierras más rápido y qué solución tiene mayor tracción
              </CardDescription>
            </div>
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              <Button
                variant={activeSubTab === "industry" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveSubTab("industry")}
              >
                Por Industria
              </Button>
              <Button
                variant={activeSubTab === "product" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveSubTab("product")}
              >
                Por Producto
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeSubTab === "industry" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="p-2 font-medium">Vertical / Industria</th>
                    <th className="p-2 font-medium text-center">Cuentas Activas</th>
                    <th className="p-2 font-medium text-center">Cierres Ganados</th>
                    <th className="p-2 font-medium text-center">Velocidad Promedio</th>
                    <th className="p-2 font-medium text-right">TPV Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {metrics.pieIndustryData.map((ind) => (
                    <tr key={ind.name} className="hover:bg-muted/10">
                      <td className="p-2 font-medium">{ind.name}</td>
                      <td className="p-2 text-center">{ind.value}</td>
                      <td className="p-2 text-center text-emerald-600 font-semibold">{ind.won}</td>
                      <td className="p-2 text-center">
                        {ind.avgDays > 0 ? `${ind.avgDays} días` : "--"}
                      </td>
                      <td className="p-2 text-right font-medium">
                        ${(ind.tpv / 1000).toLocaleString()}k
                      </td>
                    </tr>
                  ))}
                  {metrics.pieIndustryData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        Sin datos en el pipeline.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="p-2 font-medium">Solución / Producto</th>
                    <th className="p-2 font-medium text-center">Cuentas</th>
                    <th className="p-2 font-medium text-center">Ganados</th>
                    <th className="p-2 font-medium text-center">Velocidad</th>
                    <th className="p-2 font-medium text-right">TPV Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {metrics.productBreakdown.map((prod) => (
                    <tr key={prod.name} className="hover:bg-muted/10">
                      <td className="p-2 font-medium">{prod.name}</td>
                      <td className="p-2 text-center">{prod.count}</td>
                      <td className="p-2 text-center text-emerald-600 font-semibold">{prod.won}</td>
                      <td className="p-2 text-center">
                        {prod.avgDays > 0 ? `${prod.avgDays} días` : "--"}
                      </td>
                      <td className="p-2 text-right font-medium">
                        ${(prod.tpv / 1000).toLocaleString()}k
                      </td>
                    </tr>
                  ))}
                  {metrics.productBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        Sin productos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
