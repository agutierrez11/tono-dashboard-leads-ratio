import { useMemo } from "react";
import { useLeads } from "./useLeads";
import { DatabaseLead } from "./useLeads";

export interface FunnelStage {
  name: string;
  status: string[];
  count: number;
  percentage: number;
  conversionFromPrevious: number;
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
}

/**
 * Embudo de ventas estándar:
 * 1. Contactos Totales: Todos los leads (new, contacted, qualified, proposal, won, lost)
 * 2. Contactados: Leads con status "contacted" o superior
 * 3. Relevantes: Leads con status "qualified" o superior
 * 4. Oportunidades: Leads con status "proposal" o superior
 * 5. Clientes: Leads con status "won"
 */

export const useSalesFunnelMetrics = () => {
  const { data: leads = [], isLoading } = useLeads();

  const metrics = useMemo(() => {
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
      };
    }

    // Definir etapas del embudo
    const totalContacts = leads.length;
    const contacted = leads.filter(l => 
      ["contacted", "qualified", "proposal", "won", "lost"].includes(l.status)
    ).length;
    const relevant = leads.filter(l => 
      ["qualified", "proposal", "won", "lost"].includes(l.status)
    ).length;
    const opportunities = leads.filter(l => 
      ["proposal", "won", "lost"].includes(l.status)
    ).length;
    const customers = leads.filter(l => l.status === "won").length;

    // Calcular tasas de conversión
    const contactedRate = totalContacts > 0 ? (contacted / totalContacts) * 100 : 0;
    const relevantRate = contacted > 0 ? (relevant / contacted) * 100 : 0;
    const opportunityRate = relevant > 0 ? (opportunities / relevant) * 100 : 0;
    const customerRate = opportunities > 0 ? (customers / opportunities) * 100 : 0;

    // Etapas del embudo
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
        percentage: (relevant / totalContacts) * 100,
        conversionFromPrevious: relevantRate,
      },
      {
        name: "Oportunidades",
        status: ["proposal", "won", "lost"],
        count: opportunities,
        percentage: (opportunities / totalContacts) * 100,
        conversionFromPrevious: opportunityRate,
      },
      {
        name: "Clientes",
        status: ["won"],
        count: customers,
        percentage: (customers / totalContacts) * 100,
        conversionFromPrevious: customerRate,
      },
    ];

    // Calcular tasas de conversión por canal
    const channels = ["linkedin", "phone", "email"] as const;
    const conversionRateByChannel: Record<string, number> = {};

    channels.forEach(channel => {
      const channelLeads = leads.filter(l => l.channel === channel);
      const channelCustomers = channelLeads.filter(l => l.status === "won").length;
      conversionRateByChannel[channel] = 
        channelLeads.length > 0 ? (channelCustomers / channelLeads.length) * 100 : 0;
    });

    // Calcular tiempo promedio de ciclo de venta
    const closedLeads = leads.filter(l => 
      (l.status === "won" || l.status === "lost") && l.closed_at
    );
    let totalDays = 0;
    closedLeads.forEach(lead => {
      if (lead.closed_at) {
        const createdAt = new Date(lead.created_at);
        const closedAt = new Date(lead.closed_at);
        const cycleTime = Math.floor(
          (closedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalDays += cycleTime;
      }
    });
    const averageCycleTime = closedLeads.length > 0 ? totalDays / closedLeads.length : 0;

    // Calcular tiempo promedio de prospección (SDR: created_at -> contacted_at)
    const leadsWithContactTime = leads.filter(l => l.contacted_at);
    let totalProspectingDays = 0;
    leadsWithContactTime.forEach(lead => {
      const createdAt = new Date(lead.created_at);
      const contactedAt = new Date(lead.contacted_at!);
      const diff = Math.floor(
        (contactedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      totalProspectingDays += Math.max(0, diff);
    });
    const averageProspectingTime = leadsWithContactTime.length > 0 ? totalProspectingDays / leadsWithContactTime.length : 0;

    // Calcular tiempo promedio de cierre (AE: contacted_at -> closed_at)
    const leadsWithCloseTime = leads.filter(l => 
      l.contacted_at && l.closed_at && (l.status === "won" || l.status === "lost")
    );
    let totalAEDays = 0;
    leadsWithCloseTime.forEach(lead => {
      const contactedAt = new Date(lead.contacted_at!);
      const closedAt = new Date(lead.closed_at!);
      const diff = Math.floor(
        (closedAt.getTime() - contactedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      totalAEDays += Math.max(0, diff);
    });
    const averageClosingTime = leadsWithCloseTime.length > 0 ? totalAEDays / leadsWithCloseTime.length : 0;

    // Identificar cuellos de botella
    const bottlenecks: string[] = [];
    if (contactedRate < 40) {
      bottlenecks.push(
        `Baja tasa de contacto (${contactedRate.toFixed(1)}%). Solo contactas el ${contactedRate.toFixed(1)}% de tus leads.`
      );
    }
    if (relevantRate < 50 && contacted > 0) {
      bottlenecks.push(
        `Baja calificación (${relevantRate.toFixed(1)}%). Solo calificas el ${relevantRate.toFixed(1)}% de contactados.`
      );
    }
    if (opportunityRate < 50 && relevant > 0) {
      bottlenecks.push(
        `Baja conversión a propuesta (${opportunityRate.toFixed(1)}%). Necesitas mejorar tu pitch.`
      );
    }
    if (customerRate < 50 && opportunities > 0) {
      bottlenecks.push(
        `Baja tasa de cierre (${customerRate.toFixed(1)}%). Necesitas mejorar tu negociación.`
      );
    }

    // Generar recomendaciones
    const recommendations: string[] = [];
    
    if (contactedRate < 40) {
      recommendations.push("🎯 Aumenta tu tasa de contacto: Dedica más tiempo a llamadas/emails iniciales.");
    }
    if (relevantRate < 50 && contacted > 0) {
      recommendations.push("🔍 Mejora tu calificación: Establece criterios claros para identificar leads relevantes.");
    }
    if (opportunityRate < 50 && relevant > 0) {
      recommendations.push("💼 Refuerza tu propuesta: Personaliza más tus presentaciones y propuestas.");
    }
    if (customerRate < 50 && opportunities > 0) {
      recommendations.push("🤝 Mejora tu cierre: Trabaja en objeciones y técnicas de negociación.");
    }

    // Identificar canal más efectivo
    const bestChannel = Object.entries(conversionRateByChannel).sort(
      ([, a], [, b]) => b - a
    )[0];
    if (bestChannel) {
      recommendations.push(
        `✨ Tu mejor canal es ${bestChannel[0].toUpperCase()} (${bestChannel[1].toFixed(1)}% conversión). Enfócate ahí.`
      );
    }

    // Proyecciones: Si tuvieras 100 contactos, cuántos llegarían a cada etapa
    const projections = {
      if100Contacts: 100,
      if100Contacted: Math.round((contactedRate / 100) * 100),
      if100Relevant: Math.round((contactedRate / 100) * (relevantRate / 100) * 100),
      if100Opportunities: Math.round(
        (contactedRate / 100) * (relevantRate / 100) * (opportunityRate / 100) * 100
      ),
      if100Customers: Math.round(
        (contactedRate / 100) * (relevantRate / 100) * (opportunityRate / 100) * (customerRate / 100) * 100
      ),
    };

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
    };
  }, [leads]);

  return { metrics, isLoading };
};

/**
 * Hook adicional para análisis por período (últimos 30 días, 90 días, etc.)
 */
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
        const cycleTime = Math.floor(
          (closedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalDays += cycleTime;
      }
    });
    const averageCycleTime = closedLeads.length > 0 ? totalDays / closedLeads.length : 0;

    // Encontrar canal con más conversiones
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
