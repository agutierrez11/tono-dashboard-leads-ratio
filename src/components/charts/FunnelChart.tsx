
import { useMemo } from "react";
import { FunnelData } from "@/utils/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FunnelChartProps {
  data: FunnelData[];
  title?: string;
}

const statusColors = {
  new: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  negotiation: 'bg-purple-500',
  won: 'bg-green-500',
  lost: 'bg-red-500',
};

export const FunnelChart = ({ data, title = "Embudo de Conversión" }: FunnelChartProps) => {
  const maxCount = useMemo(() => Math.max(...data.map(d => d.count), 1), [data]);

  // Filter out lost for the main funnel (show separately)
  const funnelData = data.filter(d => d.status !== 'lost');
  const lostData = data.find(d => d.status === 'lost');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {funnelData.map((item, index) => {
            const widthPercent = (item.count / maxCount) * 100;
            const minWidth = 30; // Minimum width for visibility
            const displayWidth = Math.max(widthPercent, item.count > 0 ? minWidth : 0);
            
            return (
              <div key={item.status} className="relative">
                <div className="flex items-center gap-3">
                  <div className="w-24 text-sm font-medium text-right">
                    {item.label}
                  </div>
                  <div className="flex-1 relative h-10">
                    <div
                      className={cn(
                        "absolute left-0 h-full rounded-r-lg flex items-center justify-end pr-3 transition-all duration-500",
                        statusColors[item.status]
                      )}
                      style={{ 
                        width: `${displayWidth}%`,
                        clipPath: index < funnelData.length - 1 
                          ? 'polygon(0 0, 95% 0, 100% 50%, 95% 100%, 0 100%)'
                          : undefined
                      }}
                    >
                      <span className="text-white font-bold text-sm">
                        {item.count}
                      </span>
                    </div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {item.percentage}%
                    </div>
                  </div>
                </div>
                {index < funnelData.length - 1 && (
                  <div className="ml-24 pl-3 text-xs text-muted-foreground py-1">
                    ↓ {funnelData[index + 1].count > 0 
                      ? ((funnelData[index + 1].count / Math.max(item.count, 1)) * 100).toFixed(0)
                      : 0}% pasan
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {lostData && lostData.count > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium text-right text-red-600">
                {lostData.label}
              </div>
              <div className="flex-1 relative h-8">
                <div
                  className={cn(
                    "absolute left-0 h-full rounded-lg flex items-center justify-end pr-3",
                    statusColors.lost
                  )}
                  style={{ width: `${(lostData.count / maxCount) * 100}%` }}
                >
                  <span className="text-white font-bold text-sm">
                    {lostData.count}
                  </span>
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {lostData.percentage}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">
              {funnelData.find(d => d.status === 'won')?.count || 0}
            </p>
            <p className="text-sm text-muted-foreground">Ganados</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {data.reduce((sum, d) => sum + d.count, 0) > 0
                ? (((funnelData.find(d => d.status === 'won')?.count || 0) / 
                    Math.max(funnelData.find(d => d.status === 'new')?.count || 1, 1)) * 100).toFixed(1)
                : 0}%
            </p>
            <p className="text-sm text-muted-foreground">Tasa de cierre</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
