
import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Lead, ConversionData, SalesCycleData, TimeframeData } from "@/utils/types";
import { generateMockLeads } from "@/utils/mock-data";

interface LeadsStore {
  leads: Lead[];
  addLead: (lead: Lead) => void;
  clearAllData: () => void;
  loadMockData: () => void;
  hasMockData: boolean;
}

const LeadsContext = createContext<LeadsStore | undefined>(undefined);

export const LeadsProvider = ({ children }: { children: ReactNode }) => {
  const [leads, setLeads] = useState<Lead[]>(generateMockLeads(50));
  const [hasMockData, setHasMockData] = useState(true);

  const addLead = useCallback((lead: Lead) => {
    setLeads(prev => [...prev, lead]);
  }, []);

  const clearAllData = useCallback(() => {
    setLeads([]);
    setHasMockData(false);
  }, []);

  const loadMockData = useCallback(() => {
    setLeads(generateMockLeads(50));
    setHasMockData(true);
  }, []);

  return (
    <LeadsContext.Provider value={{ leads, addLead, clearAllData, loadMockData, hasMockData }}>
      {children}
    </LeadsContext.Provider>
  );
};

export const useLeadsStore = () => {
  const context = useContext(LeadsContext);
  if (!context) {
    throw new Error("useLeadsStore must be used within a LeadsProvider");
  }
  return context;
};

// Helper functions to calculate metrics from leads
export const calculateConversionRates = (leads: Lead[]): ConversionData[] => {
  const channels = ['linkedin', 'phone', 'email'] as const;
  
  return channels.map(channel => {
    const channelLeads = leads.filter(lead => lead.channel === channel);
    const totalLeads = channelLeads.length;
    const closedLeads = channelLeads.filter(lead => lead.status === 'closed').length;
    const rate = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;
    
    return {
      channel,
      rate: parseFloat(rate.toFixed(1)),
      leads: totalLeads,
      closed: closedLeads
    };
  });
};

export const calculateSalesCycleTimes = (leads: Lead[]): SalesCycleData[] => {
  const channels = ['linkedin', 'phone', 'email'] as const;
  
  return channels.map(channel => {
    const closedLeads = leads.filter(
      lead => lead.channel === channel && 
      (lead.status === 'closed' || lead.status === 'lost') && 
      lead.closedDate
    );
    
    let totalDays = 0;
    closedLeads.forEach(lead => {
      if (lead.closedDate) {
        const cycleTime = Math.floor((lead.closedDate.getTime() - lead.date.getTime()) / (1000 * 60 * 60 * 24));
        totalDays += cycleTime;
      }
    });
    
    const avgDays = closedLeads.length > 0 ? totalDays / closedLeads.length : 0;
    
    return {
      channel,
      avgDays: parseFloat(avgDays.toFixed(1)),
      count: closedLeads.length
    };
  });
};

export const generateTimeframeData = (leads: Lead[]): { daily: TimeframeData[], weekly: TimeframeData[], monthly: TimeframeData[] } => {
  // Daily data for the last 14 days
  const dailyData: TimeframeData[] = Array.from({ length: 14 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const day = date.getDate();
    const month = date.getMonth() + 1;
    
    const dayLeads = leads.filter(lead => {
      const leadDate = new Date(lead.date);
      leadDate.setHours(0, 0, 0, 0);
      return leadDate.getTime() === date.getTime();
    });
    
    const linkedin = dayLeads.filter(l => l.channel === 'linkedin').length;
    const phone = dayLeads.filter(l => l.channel === 'phone').length;
    const email = dayLeads.filter(l => l.channel === 'email').length;
    
    return {
      label: `${day}/${month}`,
      linkedin,
      phone,
      email,
      total: linkedin + phone + email
    };
  });

  // Weekly data for the last 8 weeks
  const weeklyData: TimeframeData[] = Array.from({ length: 8 }).map((_, i) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - ((7 - i) * 7));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const weekLeads = leads.filter(lead => {
      const leadDate = new Date(lead.date);
      return leadDate >= weekStart && leadDate < weekEnd;
    });
    
    const linkedin = weekLeads.filter(l => l.channel === 'linkedin').length;
    const phone = weekLeads.filter(l => l.channel === 'phone').length;
    const email = weekLeads.filter(l => l.channel === 'email').length;
    
    return {
      label: `Sem ${i + 1}`,
      linkedin,
      phone,
      email,
      total: linkedin + phone + email
    };
  });

  // Monthly data for the last 6 months
  const monthlyData: TimeframeData[] = Array.from({ length: 6 }).map((_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    
    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthName = months[date.getMonth()];
    
    const monthLeads = leads.filter(lead => {
      const leadDate = new Date(lead.date);
      return leadDate >= date && leadDate < nextMonth;
    });
    
    const linkedin = monthLeads.filter(l => l.channel === 'linkedin').length;
    const phone = monthLeads.filter(l => l.channel === 'phone').length;
    const email = monthLeads.filter(l => l.channel === 'email').length;
    
    return {
      label: monthName,
      linkedin,
      phone,
      email,
      total: linkedin + phone + email
    };
  });

  return { daily: dailyData, weekly: weeklyData, monthly: monthlyData };
};
