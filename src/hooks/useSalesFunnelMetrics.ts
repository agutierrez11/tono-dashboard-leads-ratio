import { useMemo } from "react";
import { useLeads, DatabaseLead } from "./useLeads";
import { useRecentActivities } from "./useActivities";
import { startOfWeek, endOfWeek, subWeeks, format, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";

export interface FunnelStage {
  name: string;
  status: string[];
  count: number;
  percentage: number;
  conversionFromPrevious: number;
}

export interface WeeklySummary {
  weekStart: string;
  weekLabel: string;
  callsMade: number;
  callsConnected: number;
  emailsSent: number;
  linkedinContacts: number;
  leadsCreated: { phone: number; email: number; linkedin: number };
  meetingsScheduled: number;
  meetingsHeld: number;
  salesCount: number;
  revenue: number;
  rates: {
    phoneConnection: number;
    emailReply: number;
    linkedinConnect: number;
    closeRate: number;
  };
  starChannel: "linkedin" | "phone" | "email" | null;
}

export interface ChannelROI {
  phone: number;
  email: number;
  linkedin: number;
  bestChannel: "linkedin" | "phone" | "email";
}

export interface FunnelMetrics {
  stages: FunnelStage[];
  totalLeads: number;
  conversionRateByChannel: Record<string, number>;
  averageCycleTime: number;
  averageProspectingTime: number;
  averageClosingTime: number;
  bottlenecks: string[];
  recommendations: string[];
  projections: {
    if100Contacts: number;
    if100Contacted: number;
    if100Relevant: number;
    if100Opportunities: number;
  };
  weeklySummaries: WeeklySummary[];
  roi: ChannelROI;
}

export const useSalesFunnelMetrics = (daysRange: number = 30) => {
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: activities = [], isLoading: activitiesLoading } = useRecentActivities(90);

  const isLoading = leadsLoading || activitiesLoading;

  const metrics = useMemo((): FunnelMetrics => {
    if (leads.length === 0) {
      return {
        stages: [],
        totalLeads: 0,
        conversionRateByChannel: {},
        averageCycleTime: 0,
        averageProspectingTime: 0,
        averageClosingTime: 0,
        bottlenecks: [],
        recommendations: [],
        projections: {
          if100Contacts: 0,
          if100Contacted: 0,
          if100Relevant: 0,
          if100Opportunities: 0,
        },
        weeklySummaries: [],
        roi: { phone: 0, email: 0, linkedin: 0, bestChannel: "linkedin" },
      };
    }

    // Filter leads by date range if applicable
    const cutoffDate = daysRange > 0 ? (() => {
      const d = new Date();
      d.setDate(d.getDate() - daysRange);
      return d;
    })() : null;

    const filteredLeads = cutoffDate 
      ? leads.filter(l => new Date(l.created_at) >= cutoffDate)
      : leads;

    // Embudo de ventas estándar (usando datos del periodo seleccionado)
    const totalContacts = filteredLeads.length;
    const contacted = filteredLeads.filter(l => 
      ["contacted", "qualified", "proposal", "won", "lost"].includes(l.status)
    ).length;
    const relevant = filteredLeads.filter(l => 
      ["qualified", "proposal", "won", "lost"].includes(l.status)
    ).length;
    const opportunities = filteredLeads.filter(l => 
      ["proposal", "won", "lost"].includes(l.status)
    ).length;
    const customers = filteredLeads.filter(l => l.status === "won").length;

    const contactedRate = totalContacts > 0 ? (contacted / totalContacts) * 100 : 0;
    const relevantRate = contacted > 0 ? (relevant / contacted) * 100 : 0;
    const opportunityRate = relevant > 0 ? (opportunities / relevant) * 100 : 0;
    const customerRate = opportunities > 0 ? (customers / opportunities) * 100 : 0;

    const stages: FunnelStage[] = [
      {
        name: "Contactos Totales",
        status: ["new", "contacted", "qualified", "proposal", "won", "lost"],
        count: totalContacts,
        percentage: 100,
        conversionFromPrevious: 100,
      },
      {
        name: "Contactados",
        status: ["contacted", "qualified", "proposal", "won", "lost"],
        count: contacted,
        percentage: contactedRate,
        conversionFromPrevious: contactedRate,
      },
      {
        name: "Relevantes",
        status: ["qualified", "proposal", "won", "lost"],
        count: relevant,
        percentage: totalContacts > 0 ? (relevant / totalContacts) * 100 : 0,
        conversionFromPrevious: relevantRate,
      },
      {
        name: "Oportunidades",
        status: ["proposal", "won", "lost"],
        count: opportunities,
        percentage: totalContacts > 0 ? (opportunities / totalContacts) * 100 : 0,
        conversionFromPrevious: opportunityRate,
      },
      {
        name: "Clientes",
        status: ["won"],
        count: customers,
        percentage: totalContacts > 0 ? (customers / totalContacts) * 100 : 0,
        conversionFromPrevious: customerRate,
      },
    ];

    // Tasas de conversión por canal
    const channels = ["linkedin", "phone", "email"] as const;
    const conversionRateByChannel: Record<string, number> = {};

    channels.forEach(channel => {
      const channelLeads = filteredLeads.filter(l => l.channel === channel);
      const channelCustomers = channelLeads.filter(l => l.status === "won").length;
      conversionRateByChannel[channel] = 
        channelLeads.length > 0 ? (channelCustomers / channelLeads.length) * 100 : 0;
    });

    // Tiempos promedio de ciclo de venta
    const closedLeads = filteredLeads.filter(l => 
      (l.status === "won" || l.status === "lost") && l.closed_at
    );
    let totalDays = 0;
    closedLeads.forEach(lead => {
      if (lead.closed_at) {
        const createdAt = new Date(lead.created_at);
        const closedAt = new Date(lead.closed_at);
        totalDays += Math.max(0, Math.floor((closedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
      }
    });
    const averageCycleTime = closedLeads.length > 0 ? totalDays / closedLeads.length : 0;

    // Tiempo promedio de prospección (SDR: created_at -> contacted_at)
    const leadsWithContactTime = filteredLeads.filter(l => l.contacted_at);
    let totalProspectingDays = 0;
    leadsWithContactTime.forEach(lead => {
      const createdAt = new Date(lead.created_at);
      const contactedAt = new Date(lead.contacted_at!);
      totalProspectingDays += Math.max(0, Math.floor((contactedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
    });
    const averageProspectingTime = leadsWithContactTime.length > 0 ? totalProspectingDays / leadsWithContactTime.length : 0;

    // Tiempo promedio de cierre (AE: contacted_at -> closed_at)
    const leadsWithCloseTime = filteredLeads.filter(l => 
      l.contacted_at && l.closed_at && (l.status === "won" || l.status === "lost")
    );
    let totalAEDays = 0;
    leadsWithCloseTime.forEach(lead => {
      const contactedAt = new Date(lead.contacted_at!);
      const closedAt = new Date(lead.closed_at!);
      totalAEDays += Math.max(0, Math.floor((closedAt.getTime() - contactedAt.getTime()) / (1000 * 60 * 60 * 24)));
    });
    const averageClosingTime = leadsWithCloseTime.length > 0 ? totalAEDays / leadsWithCloseTime.length : 0;

    // Cuellos de botella y recomendaciones
    const bottlenecks: string[] = [];
    const recommendations: string[] = [];
    
    if (contactedRate < 40) {
      bottlenecks.push(`Baja tasa de contacto (${contactedRate.toFixed(1)}%).`);
      recommendations.push("🎯 Aumenta tu tasa de contacto: Llama en diferentes horarios o personaliza más tus correos.");
    }
    if (relevantRate < 50 && contacted > 0) {
      bottlenecks.push(`Baja calificación de leads (${relevantRate.toFixed(1)}%).`);
      recommendations.push("🔍 Revisa tu perfil de cliente ideal (ICP) para asegurar que prospectas personas relevantes.");
    }
    if (opportunityRate < 50 && relevant > 0) {
      bottlenecks.push(`Bajo porcentaje de propuestas enviadas (${opportunityRate.toFixed(1)}%).`);
      recommendations.push("💼 Agiliza el paso de la llamada de descubrimiento a la propuesta comercial.");
    }
    if (customerRate < 30 && opportunities > 0) {
      bottlenecks.push(`Bajo porcentaje de cierre de propuestas (${customerRate.toFixed(1)}%).`);
      recommendations.push("🤝 Trabaja en tus técnicas de negociación, seguimiento de propuestas y resolución de objeciones.");
    }

    // Proyecciones
    const projections = {
      if100Contacts: 100,
      if100Contacted: Math.round((contactedRate / 100) * 100),
      if100Relevant: Math.round((contactedRate / 100) * (relevantRate / 100) * 100),
      if100Opportunities: Math.round((contactedRate / 100) * (relevantRate / 100) * (opportunityRate / 100) * 100),
      if100Customers: Math.round((contactedRate / 100) * (relevantRate / 100) * (opportunityRate / 100) * (customerRate / 100) * 100),
    };

    // 12 Weeks Historical Calculation (Weekly Summaries)
    const weeklySummaries: WeeklySummary[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const weekDate = subWeeks(now, i);
      const start = startOfWeek(weekDate, { weekStartsOn: 1 });
      const end = endOfWeek(weekDate, { weekStartsOn: 1 });
      
      const weekActivities = activities.filter(act => {
        const actDate = new Date(act.activity_date + "T00:00:00");
        return isWithinInterval(actDate, { start, end });
      });
      
      const weekLeads = leads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return isWithinInterval(leadDate, { start, end });
      });
      
      const callsMade = weekActivities.reduce((sum, act) => sum + act.calls_made, 0);
      const callsConnected = weekActivities.reduce((sum, act) => sum + act.calls_connected, 0);
      const emailsSent = weekActivities.reduce((sum, act) => sum + act.emails_sent, 0);
      const linkedinContacts = weekActivities.reduce((sum, act) => sum + act.linkedin_contacts, 0);
      
      const phoneLeadsCount = weekLeads.filter(l => l.channel === "phone").length;
      const emailLeadsCount = weekLeads.filter(l => l.channel === "email").length;
      const linkedinLeadsCount = weekLeads.filter(l => l.channel === "linkedin").length;
      
      const meetingsScheduled = weekLeads.filter(l => ["proposal", "won", "lost"].includes(l.status)).length;
      const meetingsHeld = meetingsScheduled; // Estimación directa
      const salesCount = weekLeads.filter(l => l.status === "won").length;
      const revenue = weekLeads.filter(l => l.status === "won").reduce((sum, l) => sum + (l.sale_value || 0), 0);
      
      const rates = {
        phoneConnection: callsMade > 0 ? (callsConnected / callsMade) * 100 : 0,
        emailReply: emailsSent > 0 ? (emailLeadsCount / emailsSent) * 100 : 0,
        linkedinConnect: linkedinContacts > 0 ? (linkedinLeadsCount / linkedinContacts) * 100 : 0,
        closeRate: meetingsScheduled > 0 ? (salesCount / meetingsScheduled) * 100 : 0,
      };
      
      let starChannel: "linkedin" | "phone" | "email" | null = null;
      const leadsByChannel = [
        { channel: "phone" as const, count: phoneLeadsCount },
        { channel: "email" as const, count: emailLeadsCount },
        { channel: "linkedin" as const, count: linkedinLeadsCount }
      ];
      leadsByChannel.sort((a, b) => b.count - a.count);
      if (leadsByChannel[0].count > 0) {
        starChannel = leadsByChannel[0].channel;
      }
      
      weeklySummaries.push({
        weekStart: format(start, "yyyy-MM-dd"),
        weekLabel: `Semana ${format(start, "d MMM", { locale: es })}`,
        callsMade,
        callsConnected,
        emailsSent,
        linkedinContacts,
        leadsCreated: { phone: phoneLeadsCount, email: emailLeadsCount, linkedin: linkedinLeadsCount },
        meetingsScheduled,
        meetingsHeld,
        salesCount,
        revenue,
        rates,
        starChannel
      });
    }

    // ROI / Expected value per action
    const totalWon = leads.filter(l => l.status === "won");
    const averageTicket = totalWon.length > 0
      ? totalWon.reduce((sum, l) => sum + (l.sale_value || 0), 0) / totalWon.length
      : 15000;

    // Phone ROI
    const totalCalls = activities.reduce((sum, a) => sum + a.calls_made, 0);
    const totalConnects = activities.reduce((sum, a) => sum + a.calls_connected, 0);
    const phoneLeadsTotal = leads.filter(l => l.channel === "phone").length;
    const phoneSalesTotal = leads.filter(l => l.channel === "phone" && l.status === "won").length;
    
    // Benchmark fallbacks for ROI calculation if actuals are 0
    const connRate = totalCalls > 0 ? totalConnects / totalCalls : 0.40;
    const leadRate = totalConnects > 0 ? phoneLeadsTotal / totalConnects : 0.20;
    const dealCloseRate = phoneLeadsTotal > 0 ? phoneSalesTotal / phoneLeadsTotal : 0.15;
    const phoneValuePerDial = connRate * leadRate * dealCloseRate * averageTicket;

    // Email ROI
    const totalEmails = activities.reduce((sum, a) => sum + a.emails_sent, 0);
    const emailLeadsTotal = leads.filter(l => l.channel === "email").length;
    const emailSalesTotal = leads.filter(l => l.channel === "email" && l.status === "won").length;
    
    const eReplyRate = totalEmails > 0 ? emailLeadsTotal / totalEmails : 0.05;
    const eCloseRate = emailLeadsTotal > 0 ? emailSalesTotal / emailLeadsTotal : 0.15;
    const emailValuePerSent = eReplyRate * eCloseRate * averageTicket;

    // LinkedIn ROI
    const totalLinkedinContacts = activities.reduce((sum, a) => sum + a.linkedin_contacts, 0);
    const linkedinLeadsTotal = leads.filter(l => l.channel === "linkedin").length;
    const linkedinSalesTotal = leads.filter(l => l.channel === "linkedin" && l.status === "won").length;

    const liReplyRate = totalLinkedinContacts > 0 ? linkedinLeadsTotal / totalLinkedinContacts : 0.15;
    const liCloseRate = linkedinLeadsTotal > 0 ? linkedinSalesTotal / linkedinLeadsTotal : 0.15;
    const linkedinValuePerInvite = liReplyRate * liCloseRate * averageTicket;

    const roiValues = [
      { channel: "phone" as const, val: phoneValuePerDial },
      { channel: "email" as const, val: emailValuePerSent },
      { channel: "linkedin" as const, val: linkedinValuePerInvite }
    ];
    roiValues.sort((a, b) => b.val - a.val);

    return {
      stages,
      totalLeads: totalContacts,
      conversionRateByChannel,
      averageCycleTime: parseFloat(averageCycleTime.toFixed(1)),
      averageProspectingTime: parseFloat(averageProspectingTime.toFixed(1)),
      averageClosingTime: parseFloat(averageClosingTime.toFixed(1)),
      bottlenecks,
      recommendations,
      projections,
      weeklySummaries,
      roi: {
        phone: parseFloat(phoneValuePerDial.toFixed(1)),
        email: parseFloat(emailValuePerSent.toFixed(1)),
        linkedin: parseFloat(linkedinValuePerInvite.toFixed(1)),
        bestChannel: roiValues[0].channel
      }
    };
  }, [leads, activities, daysRange]);

  return { metrics, isLoading };
};

export const useSalesFunnelTrend = (days: number = 30) => {
  const { data: leads = [] } = useLeads();

  const trend = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentLeads = leads.filter(lead => 
      new Date(lead.created_at) >= cutoffDate
    );

    if (recentLeads.length === 0) {
      return {
        totalLeads: 0,
        conversionRate: 0,
        averageCycleTime: 0,
        topChannel: null,
      };
    }

    const customers = recentLeads.filter(l => l.status === "won").length;
    const conversionRate = (customers / recentLeads.length) * 100;

    const closedLeads = recentLeads.filter(l => 
      (l.status === "won" || l.status === "lost") && l.closed_at
    );
    let totalDays = 0;
    closedLeads.forEach(lead => {
      if (lead.closed_at) {
        const createdAt = new Date(lead.created_at);
        const closedAt = new Date(lead.closed_at);
        totalDays += Math.max(0, Math.floor((closedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
      }
    });
    const averageCycleTime = closedLeads.length > 0 ? totalDays / closedLeads.length : 0;

    const channelStats = {
      linkedin: {
        total: recentLeads.filter(l => l.channel === "linkedin").length,
        customers: recentLeads.filter(l => l.channel === "linkedin" && l.status === "won").length,
      },
      phone: {
        total: recentLeads.filter(l => l.channel === "phone").length,
        customers: recentLeads.filter(l => l.channel === "phone" && l.status === "won").length,
      },
      email: {
        total: recentLeads.filter(l => l.channel === "email").length,
        customers: recentLeads.filter(l => l.channel === "email" && l.status === "won").length,
      },
    };

    const topChannel = Object.entries(channelStats).sort(
      ([, a], [, b]) => (b.customers / b.total || 0) - (a.customers / a.total || 0)
    )[0]?.[0];

    return {
      totalLeads: recentLeads.length,
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      averageCycleTime: parseFloat(averageCycleTime.toFixed(1)),
      topChannel,
    };
  }, [leads, days]);

  return trend;
};
