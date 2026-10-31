import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SalesforceCockpit } from "@/components/dashboard/SalesforceCockpit";
import { GoogleSheetSyncManager } from "@/components/dashboard/GoogleSheetSyncManager";
import { FunnelCalculator } from "@/components/dashboard/FunnelCalculator";
import { SalesCalculator } from "@/components/dashboard/SalesCalculator";
import { DataActions } from "@/components/dashboard/DataActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  TrendingUp,
  Calculator,
  Layers,
  Building2,
  PlusCircle,
  FileSpreadsheet,
  Gauge,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useMeliCockpit } from "@/hooks/useMeliCockpit";

const Index: React.FC = () => {
  const { metrics, activeLeads, stagingLeads } = useMeliCockpit();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "cockpit";

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header Superior */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              Sales Cockpit • Mercado Pago
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Tablero táctico personal • Quintana Roo • Medición de Velocidad, Toques y Pacing Diario.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={currentTab === "gsheet" ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => handleTabChange("gsheet")}
            >
              <FileSpreadsheet className="h-4 w-4 mr-1.5" />
              Banco Google Sheets ({stagingLeads.length})
            </Button>
            <Link to="/leads-list">
              <Button variant="outline" size="sm" className="text-xs">
                <Users className="h-4 w-4 mr-1.5" />
                Pipeline Activo ({activeLeads.length})
              </Button>
            </Link>
            <Link to="/leads">
              <Button size="sm" className="text-xs">
                <PlusCircle className="h-4 w-4 mr-1.5" />
                Alta Manual en Calle
              </Button>
            </Link>
          </div>
        </div>

        {/* Pestañas Principales */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-muted/60 p-1">
            <TabsTrigger value="cockpit" className="text-xs flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5" /> Cockpit Diario
            </TabsTrigger>
            <TabsTrigger value="gsheet" className="text-xs flex items-center gap-1.5">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Google Sheets / Banco
            </TabsTrigger>
            <TabsTrigger value="tools" className="text-xs flex items-center gap-1.5">
              <Calculator className="h-3.5 w-3.5" /> Calculadoras
            </TabsTrigger>
            <TabsTrigger value="backup" className="text-xs flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" /> Respaldo
            </TabsTrigger>
          </TabsList>

          {/* 1. Cockpit Diario (Velocidad, Toques, Cambaceo, Lotes de 10) */}
          <TabsContent value="cockpit" className="pt-4 space-y-6">
            <SalesforceCockpit />
          </TabsContent>

          {/* 2. Conexión Google Sheets & Selector de Leads */}
          <TabsContent value="gsheet" className="pt-4 space-y-6">
            <GoogleSheetSyncManager />
          </TabsContent>

          {/* 3. Calculadoras de Escenario */}
          <TabsContent value="tools" className="pt-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FunnelCalculator />
              <SalesCalculator />
            </div>
          </TabsContent>

          {/* 4. Respaldo y Datos */}
          <TabsContent value="backup" className="pt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Respaldo y Exportación</CardTitle>
                <CardDescription className="text-xs">
                  Tus datos se guardan 100% en tu navegador (privado y seguro). Descarga una copia cuando quieras.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataActions />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Index;
