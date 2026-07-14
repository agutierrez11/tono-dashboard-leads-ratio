import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSalesFunnelMetrics } from "@/hooks/useSalesFunnelMetrics";
import { useLeads } from "@/hooks/useLeads";

export interface CallFunnelMetrics {
  llamadasRealizadas: number;
  contestadas: number;
  conversaciones: number;
  reuniones: number;
}

export interface EmailFunnelMetrics {
  emailsEnviados: number;
  emailsAbiertos: number;
  emailsRespondidos: number;
  reuniones: number;
}

export interface ProspectFunnelMetrics {
  prospectosGenerados: number;
  prospectosContactados: number;
  reunionesGeneradas: number;
  reunionesRealizadas: number;
  ventas: number;
  ticketPromedio: number;
}

interface FunnelMetricsContextType {
  callMetrics: CallFunnelMetrics;
  setCallMetrics: (metrics: CallFunnelMetrics) => void;
  emailMetrics: EmailFunnelMetrics;
  setEmailMetrics: (metrics: EmailFunnelMetrics) => void;
  prospectMetrics: ProspectFunnelMetrics;
  setProspectMetrics: (metrics: ProspectFunnelMetrics) => void;
  isRealDataActive: boolean;
  setIsRealDataActive: (active: boolean) => void;
  resetToRealData: () => void;
}

const FunnelMetricsContext = createContext<FunnelMetricsContextType | undefined>(undefined);

const EMPTY_LEADS: any[] = [];

export const FunnelMetricsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { metrics, isLoading } = useSalesFunnelMetrics(0); // Fetch all-time baseline
  const { data: leadsData } = useLeads();
  const leads = leadsData || EMPTY_LEADS;
  const [isRealDataActive, setIsRealDataActive] = useState(true);

  const [callMetrics, setCallMetrics] = useState<CallFunnelMetrics>({
    llamadasRealizadas: 100,
    contestadas: 50,
    conversaciones: 10,
    reuniones: 1,
  });

  const [emailMetrics, setEmailMetrics] = useState<EmailFunnelMetrics>({
    emailsEnviados: 500,
    emailsAbiertos: 150,
    emailsRespondidos: 15,
    reuniones: 5,
  });

  const [prospectMetrics, setProspectMetrics] = useState<ProspectFunnelMetrics>({
    prospectosGenerados: 500,
    prospectosContactados: 100,
    reunionesGeneradas: 50,
    reunionesRealizadas: 35,
    ventas: 5,
    ticketPromedio: 15000,
  });

  // Calculate real values from Supabase metrics
  const realMetrics = React.useMemo(() => {
    if (!metrics || isLoading) return null;

    const totalCalls = metrics.weeklySummaries.reduce((sum, w) => sum + w.callsMade, 0);
    const totalConnects = metrics.weeklySummaries.reduce((sum, w) => sum + w.callsConnected, 0);
    const totalEmails = metrics.weeklySummaries.reduce((sum, w) => sum + w.emailsSent, 0);
    const totalLinkedin = metrics.weeklySummaries.reduce((sum, w) => sum + w.linkedinContacts, 0);

    const totalWon = leads.filter((l) => l.status === "won");
    const avgTicket = totalWon.length > 0
      ? totalWon.reduce((sum, l) => sum + (l.sale_value || 0), 0) / totalWon.length
      : 15000;

    const phoneLeadsCount = leads.filter((l) => l.channel === "phone").length;
    const phoneMeetingsCount = leads.filter(
      (l) => l.channel === "phone" && ["proposal", "won", "lost"].includes(l.status)
    ).length;

    const emailLeadsCount = leads.filter((l) => l.channel === "email").length;
    const emailMeetingsCount = leads.filter(
      (l) => l.channel === "email" && ["proposal", "won", "lost"].includes(l.status)
    ).length;

    const linkedinLeadsCount = leads.filter((l) => l.channel === "linkedin").length;
    const linkedinQualifiedCount = leads.filter(
      (l) => l.channel === "linkedin" && ["qualified", "proposal", "won", "lost"].includes(l.status)
    ).length;
    const linkedinMeetingsCount = leads.filter(
      (l) => l.channel === "linkedin" && ["proposal", "won", "lost"].includes(l.status)
    ).length;
    const linkedinSalesCount = leads.filter((l) => l.channel === "linkedin" && l.status === "won").length;

    return {
      call: {
        llamadasRealizadas: totalCalls || 100,
        contestadas: totalConnects || 50,
        conversaciones: phoneLeadsCount || 10,
        reuniones: phoneMeetingsCount || 1,
      },
      email: {
        emailsEnviados: totalEmails || 500,
        emailsAbiertos: Math.max(emailLeadsCount, Math.round(totalEmails * 0.4)) || 150,
        emailsRespondidos: emailLeadsCount || 15,
        reuniones: emailMeetingsCount || 5,
      },
      prospect: {
        prospectosGenerados: totalLinkedin || 500,
        prospectosContactados: linkedinLeadsCount || 100,
        reunionesGeneradas: linkedinQualifiedCount || 50,
        reunionesRealizadas: linkedinMeetingsCount || 35,
        ventas: linkedinSalesCount || 5,
        ticketPromedio: avgTicket || 15000,
      },
    };
  }, [metrics, isLoading, leads]);

  // Reset to database values
  const resetToRealData = () => {
    if (realMetrics) {
      setCallMetrics(realMetrics.call);
      setEmailMetrics(realMetrics.email);
      setProspectMetrics(realMetrics.prospect);
      setIsRealDataActive(true);
    }
  };

  // Sync state initially once database metrics are loaded
  useEffect(() => {
    if (realMetrics && isRealDataActive) {
      setCallMetrics(realMetrics.call);
      setEmailMetrics(realMetrics.email);
      setProspectMetrics(realMetrics.prospect);
    }
  }, [realMetrics, isRealDataActive]);

  return (
    <FunnelMetricsContext.Provider
      value={{
        callMetrics,
        setCallMetrics,
        emailMetrics,
        setEmailMetrics,
        prospectMetrics,
        setProspectMetrics,
        isRealDataActive,
        setIsRealDataActive,
        resetToRealData,
      }}
    >
      {children}
    </FunnelMetricsContext.Provider>
  );
};

export const useFunnelMetrics = () => {
  const context = useContext(FunnelMetricsContext);
  if (!context) {
    throw new Error("useFunnelMetrics must be used within a FunnelMetricsProvider");
  }
  return context;
};
