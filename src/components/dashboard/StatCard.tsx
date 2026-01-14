
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Channel } from "@/utils/types";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  channel?: Channel;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard = ({ 
  title, 
  value, 
  icon, 
  description, 
  channel, 
  trend, 
  className 
}: StatCardProps) => {
  const getChannelColor = (channel?: Channel): string => {
    switch (channel) {
      case "linkedin":
        return "bg-linkedin/10 text-linkedin border-linkedin/20";
      case "phone":
        return "bg-phone/10 text-phone border-phone/20";
      case "email":
        return "bg-email/10 text-email border-email/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <Card className={cn(
      "glass-card overflow-hidden transition-all duration-300 hover:shadow-xl animate-scale-in",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn(
          "p-2 rounded-full",
          channel ? getChannelColor(channel) : "bg-primary/10 text-primary"
        )}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <span className={cn(
              "text-xs font-medium mr-1",
              trend.isPositive ? "text-phone" : "text-destructive"
            )}>
              {trend.isPositive ? "+" : "-"}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">vs anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
