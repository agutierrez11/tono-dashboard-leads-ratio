
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import { Channel, TimeframeData, Timeframe } from "@/utils/types";
import { dailyData, weeklyData, monthlyData } from "@/utils/mock-data";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const channelColors: Record<Channel, string> = {
  linkedin: "#0A66C2",
  phone: "#34D399",
  email: "#F59E0B"
};

interface LeadChartProps {
  className?: string;
}

export const LeadChart = ({ className }: LeadChartProps) => {
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>("daily");
  const [activeData, setActiveData] = useState<TimeframeData[]>(dailyData);
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const isMobile = useIsMobile();

  useEffect(() => {
    switch (activeTimeframe) {
      case "daily":
        setActiveData(dailyData);
        break;
      case "weekly":
        setActiveData(weeklyData);
        break;
      case "monthly":
        setActiveData(monthlyData);
        break;
    }
  }, [activeTimeframe]);

  const getTimeframeLabel = (timeframe: Timeframe): string => {
    switch (timeframe) {
      case "daily": return "Diario";
      case "weekly": return "Semanal";
      case "monthly": return "Mensual";
    }
  };

  return (
    <Card className={cn("glass-card animate-slide-up", className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div>
            <CardTitle>Desempeño por Canal</CardTitle>
            <CardDescription>Seguimiento a leads por canal a través del tiempo</CardDescription>
          </div>
          <div className="flex gap-2">
            <Tabs value={chartType} onValueChange={(v) => setChartType(v as "bar" | "line")}>
              <TabsList className="grid grid-cols-2 w-[160px]">
                <TabsTrigger value="bar">Barras</TabsTrigger>
                <TabsTrigger value="line">Líneas</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <Tabs value={activeTimeframe} onValueChange={(v) => setActiveTimeframe(v as Timeframe)}>
          <TabsList className="grid grid-cols-3 w-full md:w-[300px]">
            <TabsTrigger value="daily">{getTimeframeLabel("daily")}</TabsTrigger>
            <TabsTrigger value="weekly">{getTimeframeLabel("weekly")}</TabsTrigger>
            <TabsTrigger value="monthly">{getTimeframeLabel("monthly")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-1 h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart
              data={activeData}
              margin={{
                top: 20,
                right: 30,
                left: isMobile ? 0 : 20,
                bottom: 30,
              }}
              barGap={isMobile ? 2 : 8}
              barCategoryGap={isMobile ? 10 : 20}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={{ stroke: "#eaeaea" }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={isMobile ? 30 : 40}
              />
              <Tooltip 
                cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                contentStyle={{ borderRadius: "8px" }}
              />
              <Legend 
                verticalAlign="top" 
                height={40}
                iconType="circle"
                formatter={(value) => <span className="text-sm capitalize">{value}</span>}
              />
              <Bar
                dataKey="linkedin"
                name="LinkedIn"
                fill={channelColors.linkedin}
                radius={[4, 4, 0, 0]}
                className="animate-fade-in"
                animationDuration={1000}
              />
              <Bar
                dataKey="phone"
                name="Teléfono"
                fill={channelColors.phone}
                radius={[4, 4, 0, 0]}
                className="animate-fade-in"
                animationDuration={1500}
              />
              <Bar
                dataKey="email"
                name="Email"
                fill={channelColors.email}
                radius={[4, 4, 0, 0]}
                className="animate-fade-in"
                animationDuration={2000}
              />
            </BarChart>
          ) : (
            <LineChart
              data={activeData}
              margin={{
                top: 20,
                right: 30,
                left: isMobile ? 0 : 20,
                bottom: 30,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={{ stroke: "#eaeaea" }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={isMobile ? 30 : 40}
              />
              <Tooltip 
                contentStyle={{ borderRadius: "8px" }}
              />
              <Legend 
                verticalAlign="top" 
                height={40}
                iconType="circle"
                formatter={(value) => <span className="text-sm capitalize">{value}</span>}
              />
              <Line
                type="monotone"
                dataKey="linkedin"
                name="LinkedIn"
                stroke={channelColors.linkedin}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                className="animate-fade-in"
                animationDuration={1000}
              />
              <Line
                type="monotone"
                dataKey="phone"
                name="Teléfono"
                stroke={channelColors.phone}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                className="animate-fade-in"
                animationDuration={1500}
              />
              <Line
                type="monotone"
                dataKey="email"
                name="Email"
                stroke={channelColors.email}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                className="animate-fade-in"
                animationDuration={2000}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
