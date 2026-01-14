import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeadsStore, calculateConversionRates, calculateSalesCycleTimes } from "@/hooks/useLeadsStore";
import { Channel } from "@/utils/types";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChannelComparisonProps {
  className?: string;
}

const channelColors: Record<Channel, string> = {
  linkedin: "#0A66C2",
  phone: "#34D399",
  email: "#F59E0B"
};

const channelLabels: Record<Channel, string> = {
  linkedin: "LinkedIn",
  phone: "Teléfono",
  email: "Email"
};

export const ChannelComparison = ({ className }: ChannelComparisonProps) => {
  const { leads } = useLeadsStore();
  const isMobile = useIsMobile();

  const pieData = useMemo(() => {
    const channels: Channel[] = ['linkedin', 'phone', 'email'];
    return channels.map(channel => ({
      name: channelLabels[channel],
      value: leads.filter(lead => lead.channel === channel).length,
      channel
    })).filter(item => item.value > 0);
  }, [leads]);

  const radarData = useMemo(() => {
    const conversionRates = calculateConversionRates(leads);
    const cycleTimes = calculateSalesCycleTimes(leads);
    
    const channels: Channel[] = ['linkedin', 'phone', 'email'];
    
    // Normalize values for radar chart (0-100 scale)
    const maxLeads = Math.max(...channels.map(c => leads.filter(l => l.channel === c).length), 1);
    const maxConversion = Math.max(...conversionRates.map(c => c.rate), 1);
    const maxCycle = Math.max(...cycleTimes.map(c => c.avgDays), 1);
    
    return channels.map(channel => {
      const channelLeads = leads.filter(l => l.channel === channel).length;
      const conversion = conversionRates.find(c => c.channel === channel)?.rate || 0;
      const cycle = cycleTimes.find(c => c.channel === channel)?.avgDays || 0;
      
      return {
        channel: channelLabels[channel],
        leads: (channelLeads / maxLeads) * 100,
        conversion: (conversion / maxConversion) * 100,
        speed: maxCycle > 0 ? ((maxCycle - cycle) / maxCycle) * 100 : 0, // Inverted: faster is better
        fullMark: 100
      };
    });
  }, [leads]);

  return (
    <Card className={cn("glass-card animate-slide-up", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">Comparativa de Canales</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Distribución y rendimiento por canal</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="distribution">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="distribution" className="text-xs sm:text-sm">Distribución</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs sm:text-sm">Rendimiento</TabsTrigger>
          </TabsList>
          
          <TabsContent value="distribution" className="mt-0">
            <div className="h-[200px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 40 : 60}
                    outerRadius={isMobile ? 70 : 90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => isMobile ? `${(percent * 100).toFixed(0)}%` : `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry) => (
                      <Cell 
                        key={`cell-${entry.channel}`} 
                        fill={channelColors[entry.channel]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} leads`, 'Cantidad']}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs sm:text-sm">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="mt-0">
            <div className="h-[200px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis 
                    dataKey="channel" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]}
                    tick={{ fontSize: isMobile ? 8 : 10 }}
                  />
                  <Radar
                    name="Leads"
                    dataKey="leads"
                    stroke={channelColors.linkedin}
                    fill={channelColors.linkedin}
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Conversión"
                    dataKey="conversion"
                    stroke={channelColors.phone}
                    fill={channelColors.phone}
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Velocidad"
                    dataKey="speed"
                    stroke={channelColors.email}
                    fill={channelColors.email}
                    fillOpacity={0.3}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    formatter={(value) => <span className="text-xs sm:text-sm">{value}</span>}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
