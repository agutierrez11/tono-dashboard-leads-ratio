
import { useMemo } from "react";
import { Lead, LeadStatus } from "@/utils/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Linkedin, Phone, Mail, Calendar, Building, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { es } from "date-fns/locale";

interface LeadPipelineProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
  onStatusChange?: (lead: Lead, newStatus: LeadStatus) => void;
}

const statusConfig: { status: LeadStatus; label: string; color: string; bgColor: string }[] = [
  { status: 'new', label: 'Nuevos', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  { status: 'contacted', label: 'Contactados', color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200' },
  { status: 'negotiation', label: 'Negociación', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
  { status: 'won', label: 'Ganados', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
  { status: 'lost', label: 'Perdidos', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
];

const channelIcons = {
  linkedin: Linkedin,
  phone: Phone,
  email: Mail,
};

const channelColors = {
  linkedin: 'text-linkedin',
  phone: 'text-phone',
  email: 'text-email',
};

export const LeadPipeline = ({ leads, onLeadClick, onStatusChange }: LeadPipelineProps) => {
  const groupedLeads = useMemo(() => {
    return statusConfig.reduce((acc, { status }) => {
      acc[status] = leads.filter(lead => lead.status === status);
      return acc;
    }, {} as Record<LeadStatus, Lead[]>);
  }, [leads]);

  const getFollowupBadge = (lead: Lead) => {
    if (!lead.next_followup_at) return null;
    
    const followupDate = new Date(lead.next_followup_at);
    
    if (isPast(followupDate) && !isToday(followupDate)) {
      return <Badge variant="destructive" className="text-xs">Atrasado</Badge>;
    }
    if (isToday(followupDate)) {
      return <Badge variant="default" className="text-xs bg-orange-500">Hoy</Badge>;
    }
    if (isTomorrow(followupDate)) {
      return <Badge variant="secondary" className="text-xs">Mañana</Badge>;
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statusConfig.map(({ status, label, color, bgColor }) => (
        <Card key={status} className={cn("min-h-[400px]", bgColor)}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-sm font-medium flex items-center justify-between", color)}>
              {label}
              <Badge variant="outline" className={color}>
                {groupedLeads[status]?.length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {groupedLeads[status]?.map(lead => {
              const ChannelIcon = channelIcons[lead.channel];
              return (
                <div
                  key={lead.id}
                  className="bg-background rounded-lg p-3 shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onLeadClick?.(lead)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ChannelIcon className={cn("h-4 w-4", channelColors[lead.channel])} />
                      <span className="font-medium text-sm truncate max-w-[120px]">{lead.name}</span>
                    </div>
                    {getFollowupBadge(lead)}
                  </div>
                  
                  {lead.company && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <Building className="h-3 w-3" />
                      <span className="truncate">{lead.company}</span>
                    </div>
                  )}
                  
                  {lead.next_followup_at && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(lead.next_followup_at), "d MMM", { locale: es })}</span>
                    </div>
                  )}

                  {status !== 'won' && status !== 'lost' && onStatusChange && (
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentIndex = statusConfig.findIndex(s => s.status === status);
                          if (currentIndex < statusConfig.length - 2) {
                            onStatusChange(lead, statusConfig[currentIndex + 1].status);
                          }
                        }}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
            
            {(!groupedLeads[status] || groupedLeads[status].length === 0) && (
              <div className="text-center text-sm text-muted-foreground py-8">
                Sin leads
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
