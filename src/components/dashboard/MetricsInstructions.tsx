
import { Info, TrendingUp, Clock, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface MetricsInstructionsProps {
  className?: string;
}

export const MetricsInstructions = ({ className }: MetricsInstructionsProps) => {
  return (
    <Card className={cn("glass-card animate-slide-up", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <CardTitle>¿Cómo se calculan las métricas?</CardTitle>
        </div>
        <CardDescription>
          Explicación detallada de cada métrica y cómo interpretarla
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="conversion">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>Tasa de Conversión</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Fórmula:</strong> (Leads Cerrados / Total de Leads) × 100
                </p>
                <p>
                  <strong className="text-foreground">¿Qué mide?</strong> El porcentaje de leads que se convierten 
                  en clientes pagos. Un lead se considera "cerrado" cuando su estado cambia a "closed".
                </p>
                <p>
                  <strong className="text-foreground">Interpretación:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><span className="text-green-500">Alta ({">"} 25%)</span>: Excelente rendimiento del canal</li>
                  <li><span className="text-yellow-500">Media (10-25%)</span>: Rendimiento aceptable</li>
                  <li><span className="text-red-500">Baja ({"<"} 10%)</span>: Revisar estrategia del canal</li>
                </ul>
                <div className="bg-muted p-3 rounded-lg mt-3">
                  <p className="text-xs">
                    <strong>Ejemplo:</strong> Si tienes 100 leads de LinkedIn y 20 cerraron como clientes, 
                    tu tasa de conversión es del 20%.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="cycle">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Ciclo de Venta</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Fórmula:</strong> Suma de (Fecha Cierre - Fecha Creación) / 
                  Número de Leads Cerrados
                </p>
                <p>
                  <strong className="text-foreground">¿Qué mide?</strong> El tiempo promedio en días que toma 
                  convertir un lead desde el primer contacto hasta el cierre de la venta.
                </p>
                <p>
                  <strong className="text-foreground">Interpretación:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><span className="text-green-500">Corto ({"<"} 15 días)</span>: Proceso de venta ágil</li>
                  <li><span className="text-yellow-500">Medio (15-30 días)</span>: Tiempo normal para B2B</li>
                  <li><span className="text-red-500">Largo ({">"} 30 días)</span>: Considerar optimizar proceso</li>
                </ul>
                <div className="bg-muted p-3 rounded-lg mt-3">
                  <p className="text-xs">
                    <strong>Nota:</strong> Solo se consideran leads con estado "closed" o "lost" que tengan 
                    fecha de cierre registrada.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="channel-comparison">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <span>Comparación entre Canales</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">¿Cómo comparar canales?</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    <strong>LinkedIn vs Teléfono:</strong> LinkedIn suele tener ciclos más largos pero 
                    mayor calidad. Teléfono es más directo pero puede tener menor conversión.
                  </li>
                  <li>
                    <strong>Email vs LinkedIn:</strong> Email tiene mayor alcance pero menor 
                    engagement. LinkedIn permite mejor targeting.
                  </li>
                  <li>
                    <strong>Teléfono vs Email:</strong> Teléfono es más personal y efectivo para 
                    urgencias. Email escala mejor.
                  </li>
                </ul>
                <div className="bg-muted p-3 rounded-lg mt-3">
                  <p className="text-xs">
                    <strong>Recomendación:</strong> No solo compares tasas de conversión. Considera también 
                    el costo por lead, tiempo invertido y valor promedio de venta por canal.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};
