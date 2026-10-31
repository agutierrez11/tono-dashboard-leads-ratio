import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SalesforceCockpit } from "@/components/dashboard/SalesforceCockpit";
import { ExecutiveHistoryDashboard } from "@/components/dashboard/ExecutiveHistoryDashboard";
import { GoogleSheetSyncManager } from "@/components/dashboard/GoogleSheetSyncManager";
import { DataActions } from "@/components/dashboard/DataActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Building2,
  PlusCircle,
  FileSpreadsheet,
  Gauge,
  History,
  Layers,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useMeliCockpit } from "@/hooks/useMeliCockpit";

const Index: React.FC = () => {
  const { activeLeads, stagingLeads } = useMeliCockpit();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "cockpit";

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header Superior Ejecutivo */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              <Building2 className="h-7 w-7 text-primary" />
              Sales Cockpit • Mercado Pago
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tablero táctico personal • Quintana Roo • Metas Diarias, Conversión de 4 Etapas y Tendencias Históricas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={currentTab === "gsheet" ? "default" : "outline"}
              size="sm"
              className="text-xs h-9"
              onClick={() => handleTabChange("gsheet")}
            >
              <FileSpreadsheet className="h-4 w-4 mr-1.5" />
              Banco Google Sheets ({stagingLeads.length})
            </Button>
            <Link to="/leads-list">
              <Button variant="outline" size="sm" className="text-xs h-9">
                <Users className="h-4 w-4 mr-1.5" />
                Pipeline Activo ({activeLeads.length})
              </Button>
            </Link>
            <Link to="/leads">
              <Button size="sm" className="text-xs h-9">
                <PlusCircle className="h-4 w-4 mr-1.5" />
                Alta Manual en Calle
              </Button>
            </Link>
          </div>
        </div>

        {/* Pestañas Principales Estilo Salesforce / Enterprise */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="cockpit" className="text-xs flex items-center gap-1.5 font-medium">
              <Gauge className="h-3.5 w-3.5" /> Cockpit Diario
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs flex items-center gap-1.5 font-medium">
              <History className="h-3.5 w-3.5" /> Histórico W vs W-1
            </TabsTrigger>
            <TabsTrigger value="gsheet" className="text-xs flex items-center gap-1.5 font-medium">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Banco Leads ({stagingLeads.length})
            </TabsTrigger>
            <TabsTrigger value="backup" className="text-xs flex items-center gap-1.5 font-medium">
              <Layers className="h-3.5 w-3.5" /> Respaldo
            </TabsTrigger>
          </TabsList>

          {/* 1. Cockpit Diario (Tacómetro, Cadencia de Canales, Pacing Predictivo, Embudo 4 Fases, Industrias) */}
          <TabsContent value="cockpit" className="pt-4 space-y-6">
            <SalesforceCockpit />
          </TabsContent>

          {/* 2. Tablero Ejecutivo: Histórico Semana vs Semana / Mes vs Mes / Calidad de Datos */}
          <TabsContent value="history" className="pt-4 space-y-6">
            <ExecutiveHistoryDashboard />
          </TabsContent>

          {/* 3. Conexión Google Sheets & Selector de Leads por Lote o Manual */}
          <TabsContent value="gsheet" className="pt-4 space-y-6">
            <GoogleSheetSyncManager />
          </TabsContent>

          {/* 4. Respaldo y Datos */}
          <TabsContent value="backup" className="pt-4 space-y-6">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Respaldo y Exportación de Datos</CardTitle>
                <CardDescription className="text-xs">
                  Tus datos se guardan 100% en tu navegador (privado, local y seguro). Descarga una copia en JSON o Excel cuando lo requieras.
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
