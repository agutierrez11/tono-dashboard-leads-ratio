import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLeadsStore } from "@/hooks/useLeadsStore";
import { cn } from "@/lib/utils";

interface FunnelChartProps {
  className?: string;
}

const statusLabels: Record<string, string> = {
  new: "Nuevos",
  contacted: "Contactados",
  qualified: "Calificados",
  proposal: "Propuesta",
  closed: "Cerrados",
  lost: "Perdidos"
};

const statusColors: Record<string, string> = {
  new: "bg-primary",
  contacted: "bg-linkedin",
  qualified: "bg-phone",
  proposal: "bg-email",
  closed: "bg-green-500",
  lost: "bg-destructive"
};

export const FunnelChart = ({ className }: FunnelChartProps) => {
  const { leads } = useLeadsStore();

  const funnelData = useMemo(() => {
    const statuses = ['new', 'contacted', 'qualified', 'proposal', 'closed'];
    const counts = statuses.map(status => ({
      status,
      count: leads.filter(lead => lead.status === status).length,
      label: statusLabels[status]
    }));
    
    const maxCount = Math.max(...counts.map(c => c.count), 1);
    
    return counts.map((item, index) => ({
      ...item,
      percentage: (item.count / maxCount) * 100,
      conversionRate: index > 0 && counts[index - 1].count > 0 
        ? ((item.count / counts[index - 1].count) * 100).toFixed(1)
        : null
    }));
  }, [leads]);

  const lostCount = leads.filter(lead => lead.status === 'lost').length;

  return (
    <Card className={cn("glass-card animate-slide-up", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">Embudo de Ventas</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Progresión de leads por etapa</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {funnelData.map((item, index) => (
            <div key={item.status} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs sm:text-sm font-medium">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold">{item.count}</span>
                  {item.conversionRate && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      ({item.conversionRate}%)
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-6 sm:h-8 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500 flex items-center justify-center",
                    statusColors[item.status]
                  )}
                  style={{ 
                    width: `${Math.max(item.percentage, 10)}%`,
                    marginLeft: `${(100 - Math.max(item.percentage, 10)) / 2}%`
                  }}
                >
                  {item.count > 0 && (
                    <span className="text-[10px] sm:text-xs text-white font-medium">
                      {item.count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {lostCount > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-destructive">Perdidos</span>
              <span className="text-xs sm:text-sm font-bold text-destructive">{lostCount}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
