import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesCalculator } from "./SalesCalculator";
import { CallFunnelCalculator } from "./CallFunnelCalculator";
import { EmailFunnelCalculator } from "./EmailFunnelCalculator";
import { ProspectFunnelCalculator } from "./ProspectFunnelCalculator";
import { TimeBlockingStrategy } from "./TimeBlockingStrategy";
import { SalesDataAnalyzer } from "./SalesDataAnalyzer";
import { Calculator, Phone, Mail, Linkedin, Calendar, Sparkles } from "lucide-react";

export const FunnelCalculator: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <Card className="border border-border bg-card relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Herramientas de Planificación</span>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground tracking-tight mt-1">
            Simuladores de Conversión y Cuotas
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Haz simulaciones dinámicas y predice tus requerimientos operativos por canal de prospección. 
            Mueve los deslizadores para ver el impacto en tu pipeline comercial y exporta tu estrategia semanal.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Sales Data Analyzer - IA Real Baseline */}
      <SalesDataAnalyzer />

      {/* Accordion Stack of Calculators */}
      <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
        <Accordion type="single" collapsible defaultValue="sales" className="w-full">

          {/* 1. General Sales Funnel */}
          <AccordionItem value="sales" className="border-b border-border px-6 hover:bg-muted/10">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground hover:text-primary transition-colors">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  <Calculator className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">1. Calculadora de Ventas (General y Cuotas)</h4>
                  <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                    Calcula los leads y oportunidades globales que necesitas para lograr tus metas financieras.
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6 border-t border-border/50">
              <SalesCalculator />
            </AccordionContent>
          </AccordionItem>

          {/* 2. Phone Funnel */}
          <AccordionItem value="phone" className="border-b border-border px-6 hover:bg-muted/10">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground hover:text-amber-500 transition-colors">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">2. Embudo de Llamadas (Teléfono)</h4>
                  <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                    Simula marcaciones, tasas de contacto efectivo y reuniones agendadas por canal telefónico.
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6 border-t border-border/50">
              <CallFunnelCalculator />
            </AccordionContent>
          </AccordionItem>

          {/* 3. Email Funnel */}
          <AccordionItem value="email" className="border-b border-border px-6 hover:bg-muted/10">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground hover:text-purple-500 transition-colors">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">3. Embudo de Correo (Email)</h4>
                  <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                    Analiza aperturas, respuestas comerciales y reuniones obtenidas a través de campañas de correo.
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6 border-t border-border/50">
              <EmailFunnelCalculator />
            </AccordionContent>
          </AccordionItem>

          {/* 4. LinkedIn Funnel */}
          <AccordionItem value="linkedin" className="border-b border-border px-6 hover:bg-muted/10">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground hover:text-blue-500 transition-colors">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <Linkedin className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">4. Embudo de LinkedIn (Prospección)</h4>
                  <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                    Simula invitaciones, tasas de aceptación, conversaciones iniciadas y oportunidades ganadas.
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6 border-t border-border/50">
              <ProspectFunnelCalculator />
            </AccordionContent>
          </AccordionItem>

          {/* 5. Time Blocking Strategy */}
          <AccordionItem value="timeblocking" className="border-b-0 px-6 hover:bg-muted/10">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground hover:text-emerald-500 transition-colors">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">5. Calendario y Estrategia de Bloqueo de Tiempo</h4>
                  <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                    Crea y agenda tus bloques de prospección semanal y exporta el cronograma operativo en PDF.
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6 border-t border-border/50">
              <TimeBlockingStrategy />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

