
import { useEffect, useCallback, useState } from "react";
import { Lead } from "@/utils/types";
import { isToday, isTomorrow, isPast, differenceInMinutes } from "date-fns";
import { toast } from "sonner";

interface NotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
}

export const useFollowupNotifications = (leads: Lead[]) => {
  const [notificationState, setNotificationState] = useState<NotificationState>({
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied',
    isSupported: typeof Notification !== 'undefined',
  });
  const [notifiedLeads, setNotifiedLeads] = useState<Set<string>>(new Set());

  const requestPermission = useCallback(async () => {
    if (!notificationState.isSupported) {
      toast.error("Tu navegador no soporta notificaciones");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationState(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        toast.success("Notificaciones activadas");
        return true;
      } else {
        toast.error("Permiso de notificaciones denegado");
        return false;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [notificationState.isSupported]);

  const sendNotification = useCallback((title: string, body: string, lead?: Lead) => {
    if (notificationState.permission !== 'granted') return;

    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: lead?.id || 'followup',
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }, [notificationState.permission]);

  // Check for upcoming follow-ups and send notifications
  useEffect(() => {
    if (notificationState.permission !== 'granted') return;

    const checkFollowups = () => {
      const now = new Date();
      
      leads.forEach(lead => {
        if (!lead.next_followup_at || notifiedLeads.has(lead.id)) return;

        const followupDate = new Date(lead.next_followup_at);
        const minutesUntil = differenceInMinutes(followupDate, now);

        // Notify if follow-up is within 15 minutes and we haven't notified yet
        if (minutesUntil <= 15 && minutesUntil > 0) {
          sendNotification(
            "⏰ Seguimiento próximo",
            `${lead.name}${lead.company ? ` - ${lead.company}` : ''} en ${minutesUntil} minutos`,
            lead
          );
          setNotifiedLeads(prev => new Set(prev).add(lead.id));
        }

        // Notify if follow-up is right now
        if (minutesUntil <= 0 && minutesUntil > -5) {
          sendNotification(
            "🔔 Seguimiento ahora",
            `Es momento de contactar a ${lead.name}${lead.company ? ` de ${lead.company}` : ''}`,
            lead
          );
          setNotifiedLeads(prev => new Set(prev).add(lead.id));
        }
      });
    };

    // Check immediately and then every minute
    checkFollowups();
    const interval = setInterval(checkFollowups, 60000);

    return () => clearInterval(interval);
  }, [leads, notificationState.permission, notifiedLeads, sendNotification]);

  // Show toast notifications for overdue and today's follow-ups on mount
  useEffect(() => {
    const overdueCount = leads.filter(lead => {
      if (!lead.next_followup_at) return false;
      const date = new Date(lead.next_followup_at);
      return isPast(date) && !isToday(date);
    }).length;

    const todayCount = leads.filter(lead => {
      if (!lead.next_followup_at) return false;
      return isToday(new Date(lead.next_followup_at));
    }).length;

    if (overdueCount > 0) {
      toast.warning(`Tienes ${overdueCount} seguimiento${overdueCount > 1 ? 's' : ''} atrasado${overdueCount > 1 ? 's' : ''}`, {
        duration: 5000,
      });
    }

    if (todayCount > 0) {
      toast.info(`Tienes ${todayCount} seguimiento${todayCount > 1 ? 's' : ''} para hoy`, {
        duration: 5000,
      });
    }
  }, []); // Only run on mount

  const getFollowupSummary = useCallback(() => {
    const followupLeads = leads.filter(lead => lead.next_followup_at);
    
    const overdue = followupLeads.filter(lead => {
      const date = new Date(lead.next_followup_at!);
      return isPast(date) && !isToday(date);
    });

    const today = followupLeads.filter(lead => 
      isToday(new Date(lead.next_followup_at!))
    );

    const tomorrow = followupLeads.filter(lead => 
      isTomorrow(new Date(lead.next_followup_at!))
    );

    const upcoming = followupLeads.filter(lead => {
      const date = new Date(lead.next_followup_at!);
      return !isPast(date) && !isToday(date) && !isTomorrow(date);
    });

    return {
      overdue,
      today,
      tomorrow,
      upcoming,
      total: followupLeads.length,
    };
  }, [leads]);

  return {
    notificationState,
    requestPermission,
    sendNotification,
    getFollowupSummary,
  };
};
