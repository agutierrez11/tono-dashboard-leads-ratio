
import { Lead } from "@/utils/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Linkedin, Phone, Mail, Clock, Bell, ChevronRight, Building, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { useFollowupNotifications } from "@/hooks/useNotifications";

interface FollowupRemindersProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
}

const channelIcons = {
  linkedin: Linkedin,
  phone: Phone,
  email: Mail,
};

const channelColors = {
  linkedin: 'text-linkedin bg-linkedin/10',
  phone: 'text-phone bg-phone/10',
  email: 'text-email bg-email/10',
};

export const FollowupReminders = ({ leads, onLeadClick }: FollowupRemindersProps) => {
  const { notificationState, requestPermission, getFollowupSummary } = useFollowupNotifications(leads);
  
  const followupLeads = leads
    .filter(lead => lead.next_followup_at)
    .sort((a, b) => new Date(a.next_followup_at!).getTime() - new Date(b.next_followup_at!).getTime());

  const overdueLeads = followupLeads.filter(lead => {
    const date = new Date(lead.next_followup_at!);
    return isPast(date) && !isToday(date);
  });

  const todayLeads = followupLeads.filter(lead => isToday(new Date(lead.next_followup_at!)));
  const tomorrowLeads = followupLeads.filter(lead => isTomorrow(new Date(lead.next_followup_at!)));
  const upcomingLeads = followupLeads.filter(lead => {
    const date = new Date(lead.next_followup_at!);
    return !isPast(date) && !isToday(date) && !isTomorrow(date);
  });

  const getTimeLabel = (lead: Lead) => {
    const date = new Date(lead.next_followup_at!);
    if (isPast(date) && !isToday(date)) {
      const days = differenceInDays(new Date(), date);
      return `Hace ${days} día${days > 1 ? 's' : ''}`;
    }
    if (isToday(date)) return "Hoy";
    if (isTomorrow(date)) return "Mañana";
    return format(date, "d MMM", { locale: es });
  };

  const renderLeadCard = (lead: Lead, urgency: 'overdue' | 'today' | 'tomorrow' | 'upcoming') => {
    const ChannelIcon = channelIcons[lead.channel];
    
    const urgencyStyles = {
      overdue: 'border-l-4 border-l-red-500 bg-red-50/50',
      today: 'border-l-4 border-l-orange-500 bg-orange-50/50',
      tomorrow: 'border-l-4 border-l-yellow-500 bg-yellow-50/50',
      upcoming: 'border-l-4 border-l-blue-500 bg-blue-50/50',
    };

    return (
      <div
        key={lead.id}
        className={cn(
          "p-3 rounded-lg cursor-pointer hover:shadow-md transition-shadow",
          urgencyStyles[urgency]
        )}
        onClick={() => onLeadClick?.(lead)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded", channelColors[lead.channel])}>
              <ChannelIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-sm">{lead.name}</p>
              {lead.company && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {lead.company}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={urgency === 'overdue' ? 'destructive' : urgency === 'today' ? 'default' : 'secondary'}
              className={cn(
                "text-xs",
                urgency === 'today' && "bg-orange-500"
              )}
            >
              {getTimeLabel(lead)}
            </Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  };

  if (followupLeads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            Próximos Seguimientos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No hay seguimientos programados</p>
            <p className="text-sm">Agenda fechas de follow-up en tus leads</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Próximos Seguimientos
          </span>
          <div className="flex items-center gap-2">
            {notificationState.isSupported && notificationState.permission !== 'granted' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={requestPermission}
              >
                <BellRing className="h-3 w-3 mr-1" />
                Activar alertas
              </Button>
            )}
            {notificationState.permission === 'granted' && (
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                <BellRing className="h-3 w-3 mr-1" />
                Activas
              </Badge>
            )}
            <Badge variant="outline">{followupLeads.length}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {overdueLeads.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Atrasados</p>
            {overdueLeads.slice(0, 3).map(lead => renderLeadCard(lead, 'overdue'))}
          </div>
        )}

        {todayLeads.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Hoy</p>
            {todayLeads.map(lead => renderLeadCard(lead, 'today'))}
          </div>
        )}

        {tomorrowLeads.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-yellow-600 uppercase tracking-wide">Mañana</p>
            {tomorrowLeads.map(lead => renderLeadCard(lead, 'tomorrow'))}
          </div>
        )}

        {upcomingLeads.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Próximos</p>
            {upcomingLeads.slice(0, 5).map(lead => renderLeadCard(lead, 'upcoming'))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
