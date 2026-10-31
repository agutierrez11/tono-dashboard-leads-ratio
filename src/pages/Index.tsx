import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SalesforceCockpit } from "@/components/dashboard/SalesforceCockpit";
import { FunnelCalculator } from "@/components/dashboard/FunnelCalculator";
import { SalesCalculator } from "@/components/dashboard/SalesCalculator";
import { DataActions } from "@/components/dashboard/DataActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, Calculator, Layers, Building2, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useMeliCockpit } from "@/hooks/useMeliCockpit";

const Index: React.FC = () => {
  const { metrics, activeLeads, activateNextBatch } = useMeliCockpit();

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
            <Link to="/leads-list">
              <Button variant="outline" size="sm" className="text-xs">
                <Users className="h-4 w-4 mr-1.5" />
                Ver Pipeline Activo ({activeLeads.length})
              </Button>
            </Link>
            <Link to="/leads">
              <Button size="sm" className="text-xs">
                <PlusCircle className="h-4 w-4 mr-1.5" />
                Alta Manual
              </Button>
            </Link>
          </div>
        </div>

        {/* 1. Cockpit Central (Acciones Diarias, Lotes de 10, Velocidad, Pie de Industrias) */}
        <SalesforceCockpit />

        {/* 2. Acciones y Herramientas Complementarias */}
        <div className="pt-2">
          <Tabs defaultValue="tools" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="tools" className="text-xs">
                <Calculator className="h-3.5 w-3.5 mr-1.5" /> Calculadoras de Escenario
              </TabsTrigger>
              <TabsTrigger value="backup" className="text-xs">
                <Layers className="h-3.5 w-3.5 mr-1.5" /> Respaldo y Datos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tools" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FunnelCalculator />
                <SalesCalculator />
              </div>
            </TabsContent>

            <TabsContent value="backup" className="space-y-4 pt-4">
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
      </div>
    </DashboardLayout>
  );
};

export default Index;
