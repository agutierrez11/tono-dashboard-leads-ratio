import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Calendar, Linkedin, Phone, Mail, AlertTriangle, Clock } from "lucide-react";
import { useLeadsStore } from "@/hooks/useLeadsStore";
import { Lead, Channel } from "@/utils/types";
import { cn } from "@/lib/utils";

interface FollowUpRemindersProps {
  className?: string;
}

const channelIcons: Record<Channel, React.ReactNode> = {
  linkedin: <Linkedin className="h-3 w-3 sm:h-4 sm:w-4" />,
  phone: <Phone className="h-3 w-3 sm:h-4 sm:w-4" />,
  email: <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
};

const channelColors: Record<Channel, string> = {
  linkedin: "bg-linkedin/10 text-linkedin",
  phone: "bg-phone/10 text-phone",
  email: "bg-email/10 text-email"
};

const getDaysSinceContact = (date: Date): number => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getUrgencyLevel = (days: number): { label: string; color: string; icon: React.ReactNode } => {
  if (days >= 14) {
    return { 
      label: "Urgente", 
      color: "bg-destructive text-destructive-foreground",
      icon: <AlertTriangle className="h-3 w-3" />
    };
  }
  if (days >= 7) {
    return { 
      label: "Pendiente", 
      color: "bg-email text-white",
      icon: <Clock className="h-3 w-3" />
    };
  }
  return { 
    label: "Reciente", 
    color: "bg-phone text-white",
    icon: <Calendar className="h-3 w-3" />
  };
};

export const FollowUpReminders = ({ className }: FollowUpRemindersProps) => {
  const { leads } = useLeadsStore();

  const pendingFollowUps = useMemo(() => {
    const activeStatuses = ['new', 'contacted', 'qualified', 'proposal'];
    
    return leads
      .filter(lead => activeStatuses.includes(lead.status))
      .map(lead => ({
        ...lead,
        daysSinceContact: getDaysSinceContact(lead.date),
        urgency: getUrgencyLevel(getDaysSinceContact(lead.date))
      }))
      .sort((a, b) => b.daysSinceContact - a.daysSinceContact)
      .slice(0, 10);
  }, [leads]);

  const urgentCount = pendingFollowUps.filter(l => l.daysSinceContact >= 14).length;
  const pendingCount = pendingFollowUps.filter(l => l.daysSinceContact >= 7 && l.daysSinceContact < 14).length;

  return (
    <Card className={cn("glass-card animate-slide-up", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              Seguimientos
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Leads pendientes de contactar</CardDescription>
          </div>
          <div className="flex gap-1 sm:gap-2">
            {urgentCount > 0 && (
              <Badge variant="destructive" className="text-[10px] sm:text-xs">
                {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
              </Badge>
            )}
            {pendingCount > 0 && (
              <Badge className="bg-email text-white text-[10px] sm:text-xs">
                {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {pendingFollowUps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              No hay seguimientos pendientes
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[200px] sm:h-[280px]">
            <div className="space-y-2 sm:space-y-3 pr-2 sm:pr-4">
              {pendingFollowUps.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className={cn("p-1.5 sm:p-2 rounded-full shrink-0", channelColors[lead.channel])}>
                      {channelIcons[lead.channel]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs sm:text-sm truncate">{lead.name}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{lead.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-2">
                    <Badge className={cn("text-[10px] sm:text-xs flex items-center gap-1", lead.urgency.color)}>
                      {lead.urgency.icon}
                      <span className="hidden sm:inline">{lead.daysSinceContact}d</span>
                      <span className="sm:hidden">{lead.daysSinceContact}</span>
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
