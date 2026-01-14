
import { useMemo } from "react";
import { Lead, Channel } from "@/utils/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

interface ChannelComparisonProps {
  leads: Lead[];
}

const channelLabels: Record<Channel, string> = {
  linkedin: 'LinkedIn',
  phone: 'Teléfono',
  email: 'Email',
};

const channelColors: Record<Channel, string> = {
  linkedin: 'hsl(201, 100%, 35%)',
  phone: 'hsl(150, 60%, 40%)',
  email: 'hsl(30, 80%, 50%)',
};

export const ChannelComparison = ({ leads }: ChannelComparisonProps) => {
  const data = useMemo(() => {
    const channels: Channel[] = ['linkedin', 'phone', 'email'];
    
    return channels.map(channel => {
      const channelLeads = leads.filter(l => l.channel === channel);
      const total = channelLeads.length;
      const won = channelLeads.filter(l => l.status === 'won').length;
      const lost = channelLeads.filter(l => l.status === 'lost').length;
      const inProgress = channelLeads.filter(l => !['won', 'lost'].includes(l.status)).length;
      const conversionRate = total > 0 ? (won / total) * 100 : 0;
      
      const avgCycleTime = channelLeads
        .filter(l => l.status === 'won' && l.sale_cycle_days)
        .reduce((sum, l, _, arr) => sum + (l.sale_cycle_days || 0) / arr.length, 0);

      const totalValue = channelLeads
        .filter(l => l.status === 'won' && l.sale_value)
        .reduce((sum, l) => sum + (l.sale_value || 0), 0);

      return {
        channel,
        name: channelLabels[channel],
        total,
        won,
        lost,
        inProgress,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        avgCycleTime: parseFloat(avgCycleTime.toFixed(1)),
        totalValue,
        color: channelColors[channel],
      };
    });
  }, [leads]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comparativa de Canales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover p-3 rounded-lg shadow-lg border">
                      <p className="font-semibold mb-2">{data.name}</p>
                      <div className="space-y-1 text-sm">
                        <p>Total: <span className="font-medium">{data.total}</span></p>
                        <p className="text-green-600">Ganados: <span className="font-medium">{data.won}</span></p>
                        <p className="text-yellow-600">En progreso: <span className="font-medium">{data.inProgress}</span></p>
                        <p className="text-red-600">Perdidos: <span className="font-medium">{data.lost}</span></p>
                        <p>Conversión: <span className="font-medium">{data.conversionRate}%</span></p>
                        {data.avgCycleTime > 0 && (
                          <p>Ciclo promedio: <span className="font-medium">{data.avgCycleTime} días</span></p>
                        )}
                      </div>
                    </div>
                  );
                }}
              />
              <Legend />
              <Bar dataKey="won" name="Ganados" stackId="a" fill="hsl(var(--chart-2))" />
              <Bar dataKey="inProgress" name="En Progreso" stackId="a" fill="hsl(var(--chart-4))" />
              <Bar dataKey="lost" name="Perdidos" stackId="a" fill="hsl(var(--chart-1))" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
          {data.map(item => (
            <div key={item.channel} className="text-center p-3 rounded-lg bg-muted/50">
              <p className="font-semibold" style={{ color: item.color }}>{item.name}</p>
              <div className="mt-2 space-y-1">
                <p className="text-lg font-bold">{item.conversionRate}%</p>
                <p className="text-xs text-muted-foreground">Conversión</p>
                {item.avgCycleTime > 0 && (
                  <>
                    <p className="text-sm font-medium">{item.avgCycleTime} días</p>
                    <p className="text-xs text-muted-foreground">Ciclo promedio</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
