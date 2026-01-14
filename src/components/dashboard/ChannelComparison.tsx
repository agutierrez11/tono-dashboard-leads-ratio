
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Linkedin, Phone, Mail, ArrowRight, TrendingUp, TrendingDown, Clock, Users } from "lucide-react";
import { conversionRates, salesCycleTimes } from "@/utils/mock-data";
import { Channel } from "@/utils/types";
import { cn } from "@/lib/utils";

const channelIcons: Record<Channel, React.ReactNode> = {
  linkedin: <Linkedin className="h-5 w-5" />,
  phone: <Phone className="h-5 w-5" />,
  email: <Mail className="h-5 w-5" />
};

const channelLabels: Record<Channel, string> = {
  linkedin: "LinkedIn",
  phone: "Teléfono",
  email: "Email"
};

const channelBgColors: Record<Channel, string> = {
  linkedin: "bg-linkedin/10",
  phone: "bg-phone/10",
  email: "bg-email/10"
};

const channelTextColors: Record<Channel, string> = {
  linkedin: "text-linkedin",
  phone: "text-phone",
  email: "text-email"
};

interface ChannelComparisonProps {
  className?: string;
}

export const ChannelComparison = ({ className }: ChannelComparisonProps) => {
  const [channel1, setChannel1] = useState<Channel>("linkedin");
  const [channel2, setChannel2] = useState<Channel>("phone");

  const getChannelData = (channel: Channel) => {
    const conversion = conversionRates.find(c => c.channel === channel);
    const cycle = salesCycleTimes.find(c => c.channel === channel);
    return { conversion, cycle };
  };

  const data1 = getChannelData(channel1);
  const data2 = getChannelData(channel2);

  const conversionDiff = (data1.conversion?.rate || 0) - (data2.conversion?.rate || 0);
  const cycleDiff = (data1.cycle?.avgDays || 0) - (data2.cycle?.avgDays || 0);

  const getComparisonText = (diff: number, metric: "conversion" | "cycle") => {
    if (Math.abs(diff) < 0.1) return "Similar rendimiento";
    
    if (metric === "conversion") {
      if (diff > 0) return `${channelLabels[channel1]} convierte ${Math.abs(diff).toFixed(1)}% más`;
      return `${channelLabels[channel2]} convierte ${Math.abs(diff).toFixed(1)}% más`;
    } else {
      if (diff > 0) return `${channelLabels[channel1]} toma ${Math.abs(diff).toFixed(1)} días más`;
      return `${channelLabels[channel2]} toma ${Math.abs(diff).toFixed(1)} días más`;
    }
  };

  return (
    <Card className={cn("glass-card animate-slide-up", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Canal vs Canal
        </CardTitle>
        <CardDescription>
          Compara el rendimiento entre dos canales
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="flex-1 w-full">
            <Select value={channel1} onValueChange={(v) => setChannel1(v as Channel)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-lg">
                {(["linkedin", "phone", "email"] as Channel[]).map((ch) => (
                  <SelectItem key={ch} value={ch} disabled={ch === channel2}>
                    <div className="flex items-center gap-2">
                      {channelIcons[ch]}
                      {channelLabels[ch]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-center">
            <div className="bg-muted rounded-full p-2">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex-1 w-full">
            <Select value={channel2} onValueChange={(v) => setChannel2(v as Channel)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-lg">
                {(["linkedin", "phone", "email"] as Channel[]).map((ch) => (
                  <SelectItem key={ch} value={ch} disabled={ch === channel1}>
                    <div className="flex items-center gap-2">
                      {channelIcons[ch]}
                      {channelLabels[ch]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Channel 1 Stats */}
          <div className={cn("p-4 rounded-lg", channelBgColors[channel1])}>
            <div className="flex items-center gap-2 mb-3">
              <span className={channelTextColors[channel1]}>{channelIcons[channel1]}</span>
              <span className="font-semibold">{channelLabels[channel1]}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Conversión
                </span>
                <span className="font-medium">{data1.conversion?.rate || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Ciclo
                </span>
                <span className="font-medium">{data1.cycle?.avgDays || 0} días</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> Leads
                </span>
                <span className="font-medium">{data1.conversion?.leads || 0}</span>
              </div>
            </div>
          </div>

          {/* Channel 2 Stats */}
          <div className={cn("p-4 rounded-lg", channelBgColors[channel2])}>
            <div className="flex items-center gap-2 mb-3">
              <span className={channelTextColors[channel2]}>{channelIcons[channel2]}</span>
              <span className="font-semibold">{channelLabels[channel2]}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Conversión
                </span>
                <span className="font-medium">{data2.conversion?.rate || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Ciclo
                </span>
                <span className="font-medium">{data2.cycle?.avgDays || 0} días</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> Leads
                </span>
                <span className="font-medium">{data2.conversion?.leads || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Summary */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-2">
          <h4 className="font-medium text-sm">Resumen de Comparación</h4>
          <div className="flex items-center gap-2 text-sm">
            {conversionDiff > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : conversionDiff < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-muted-foreground">{getComparisonText(conversionDiff, "conversion")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {cycleDiff < 0 ? (
              <Clock className="h-4 w-4 text-green-500" />
            ) : cycleDiff > 0 ? (
              <Clock className="h-4 w-4 text-orange-500" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-muted-foreground">{getComparisonText(cycleDiff, "cycle")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
