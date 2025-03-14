
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import { Channel } from "@/utils/types";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { dailyData } from "@/utils/mock-data";
import { cn } from "@/lib/utils";

interface ChannelPageProps {
  channel: Channel;
  title: string;
  description: string;
  icon: React.ReactNode;
  count: number;
  trend: { value: number; isPositive: boolean };
}

export const ChannelPage = ({ 
  channel, 
  title, 
  description, 
  icon, 
  count, 
  trend 
}: ChannelPageProps) => {
  const channelColors: Record<Channel, string> = {
    linkedin: "#0A66C2",
    phone: "#34D399",
    email: "#F59E0B"
  };
  
  const color = channelColors[channel];
  
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              {icon}
              <span>{title}</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              {description}
            </p>
          </div>
          <Button size="sm" className="animate-fade-in" asChild>
            <Link to="/leads">
              <PlusCircle className="h-4 w-4 mr-2" />
              Agregar Lead
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title={`Leads vía ${title}`}
            value={count}
            icon={icon}
            description="Total acumulado"
            channel={channel}
            trend={trend}
            className="md:col-span-1"
          />
          
          <Card className={cn(
            "glass-card overflow-hidden animate-scale-in md:col-span-2",
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base font-medium">Tendencia reciente</CardTitle>
                <CardDescription>Últimos 14 días</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailyData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id={`color${channel}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey={channel} 
                    stroke={color} 
                    fillOpacity={1} 
                    fill={`url(#color${channel})`}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};
