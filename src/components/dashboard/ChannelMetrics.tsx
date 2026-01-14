
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Linkedin, Phone, Mail, Clock, TrendingUp } from "lucide-react";
import { Channel, Lead } from "@/utils/types";
import { cn } from "@/lib/utils";
import { calculateConversionRates, calculateSalesCycleTimes } from "@/hooks/useLeads";

const channelIcons: Record<Channel, React.ReactNode> = {
  linkedin: <Linkedin className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />
};

const channelColors: Record<Channel, string> = {
  linkedin: "text-linkedin",
  phone: "text-phone",
  email: "text-email"
};

const channelLabels: Record<Channel, string> = {
  linkedin: "LinkedIn",
  phone: "Teléfono",
  email: "Email"
};

interface ChannelMetricsProps {
  className?: string;
  leads?: Lead[];
}

export const ChannelMetrics = ({ className, leads = [] }: ChannelMetricsProps) => {
  const conversionRates = useMemo(() => calculateConversionRates(leads), [leads]);
  const salesCycleTimes = useMemo(() => calculateSalesCycleTimes(leads), [leads]);
  
  return (
    <Card className={cn("glass-card animate-slide-up", className)}>
      <CardHeader>
        <Tabs defaultValue="conversion">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <CardTitle>Métricas por Canal</CardTitle>
              <CardDescription>Tasa de conversión y ciclo de venta por canal</CardDescription>
            </div>
            <TabsList>
              <TabsTrigger value="conversion" className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Conversión</span>
              </TabsTrigger>
              <TabsTrigger value="cycle" className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Ciclo de Venta</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="conversion" className="mt-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead>
                    <TableHead>Tasa de Conversión</TableHead>
                    <TableHead className="text-right">Cerrados / Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversionRates.map((item) => (
                    <TableRow key={item.channel}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className={cn("p-1.5 rounded-full", 
                            item.channel === "linkedin" ? "bg-linkedin/10" : 
                            item.channel === "phone" ? "bg-phone/10" : "bg-email/10"
                          )}>
                            {channelIcons[item.channel]}
                          </span>
                          {channelLabels[item.channel]}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-full max-w-[180px] bg-muted rounded-full h-2">
                            <div 
                              className={cn(
                                "h-2 rounded-full",
                                item.channel === "linkedin" ? "bg-linkedin" :
                                item.channel === "phone" ? "bg-phone" : "bg-email"
                              )}
                              style={{ width: `${Math.min(item.rate, 100)}%` }}
                            />
                          </div>
                          <span className={cn("font-medium", channelColors[item.channel])}>
                            {item.rate}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.closed} / {item.leads}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </TabsContent>

          <TabsContent value="cycle" className="mt-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead>
                    <TableHead>Tiempo Promedio</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesCycleTimes.map((item) => (
                    <TableRow key={item.channel}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className={cn("p-1.5 rounded-full", 
                            item.channel === "linkedin" ? "bg-linkedin/10" : 
                            item.channel === "phone" ? "bg-phone/10" : "bg-email/10"
                          )}>
                            {channelIcons[item.channel]}
                          </span>
                          {channelLabels[item.channel]}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className={cn("font-medium", channelColors[item.channel])}>
                            {item.avgDays} días
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.count} leads
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </TabsContent>
        </Tabs>
      </CardHeader>
    </Card>
  );
};
