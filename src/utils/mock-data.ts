
import { Lead, TimeframeData, ConversionData, SalesCycleData } from './types';

// Generate random dates within a range
const getRandomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Generate random leads
export const generateMockLeads = (count: number): Lead[] => {
  const channels = ['linkedin', 'phone', 'email'] as const;
  const statuses = ['new', 'contacted', 'qualified', 'proposal', 'closed', 'lost'] as const;
  const companies = ['TechCorp', 'Global Industries', 'InnovaSoft', 'Data Systems', 'Future Tech', 'Creative Solutions'];
  const names = ['Juan García', 'María López', 'Carlos Rodríguez', 'Ana Martínez', 'José Fernández', 'Laura González', 
                'Pedro Sánchez', 'Sofía Pérez', 'Miguel Torres', 'Carmen Díaz', 'Javier Ruiz', 'Elena Serrano'];
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - 3);

  return Array.from({ length: count }).map((_, index) => {
    const date = getRandomDate(startDate, endDate);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Add closedDate for closed or lost leads
    let closedDate;
    if (status === 'closed' || status === 'lost') {
      // Generate a random closed date that's after the creation date
      const minClosedDate = new Date(date);
      minClosedDate.setDate(minClosedDate.getDate() + Math.floor(Math.random() * 30) + 1); // 1-30 days after creation
      closedDate = minClosedDate > endDate ? endDate : minClosedDate;
    }
    
    return {
      id: `lead-${index + 1}`,
      name: names[Math.floor(Math.random() * names.length)],
      company: companies[Math.floor(Math.random() * companies.length)],
      channel: channels[Math.floor(Math.random() * channels.length)],
      status,
      date,
      notes: Math.random() > 0.3 ? `Nota de seguimiento ${index + 1}` : undefined,
      closedDate
    };
  });
};

// Initial mock leads data
export const mockLeads: Lead[] = generateMockLeads(50);

// Calculate conversion rate by channel
export const calculateConversionRates = (): ConversionData[] => {
  const channels = ['linkedin', 'phone', 'email'] as const;
  
  return channels.map(channel => {
    const channelLeads = mockLeads.filter(lead => lead.channel === channel);
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

// Calculate average sales cycle time by channel
export const calculateSalesCycleTimes = (): SalesCycleData[] => {
  const channels = ['linkedin', 'phone', 'email'] as const;
  
  return channels.map(channel => {
    const closedLeads = mockLeads.filter(
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

// Generate conversion rates
export const conversionRates = calculateConversionRates();

// Generate sales cycle times
export const salesCycleTimes = calculateSalesCycleTimes();

// Daily data for the last 14 days
export const dailyData: TimeframeData[] = Array.from({ length: 14 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (13 - i));
  const day = date.getDate();
  const month = date.getMonth() + 1;
  
  const linkedin = Math.floor(Math.random() * 8);
  const phone = Math.floor(Math.random() * 6);
  const email = Math.floor(Math.random() * 10);
  
  return {
    label: `${day}/${month}`,
    linkedin,
    phone,
    email,
    total: linkedin + phone + email
  };
});

// Weekly data for the last 8 weeks
export const weeklyData: TimeframeData[] = Array.from({ length: 8 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - ((7 - i) * 7));
  const weekNum = Math.floor(i + 1);
  
  const linkedin = Math.floor(Math.random() * 25 + 5);
  const phone = Math.floor(Math.random() * 20 + 2);
  const email = Math.floor(Math.random() * 30 + 8);
  
  return {
    label: `Sem ${weekNum}`,
    linkedin,
    phone,
    email,
    total: linkedin + phone + email
  };
});

// Monthly data for the last 6 months
export const monthlyData: TimeframeData[] = Array.from({ length: 6 }).map((_, i) => {
  const date = new Date();
  date.setMonth(date.getMonth() - (5 - i));
  
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthName = months[date.getMonth()];
  
  const linkedin = Math.floor(Math.random() * 80 + 20);
  const phone = Math.floor(Math.random() * 60 + 10);
  const email = Math.floor(Math.random() * 100 + 30);
  
  return {
    label: `${monthName}`,
    linkedin,
    phone,
    email,
    total: linkedin + phone + email
  };
});
