
import { Lead, TimeframeData } from './types';

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

  return Array.from({ length: count }).map((_, index) => ({
    id: `lead-${index + 1}`,
    name: names[Math.floor(Math.random() * names.length)],
    company: companies[Math.floor(Math.random() * companies.length)],
    channel: channels[Math.floor(Math.random() * channels.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    date: getRandomDate(startDate, endDate),
    notes: Math.random() > 0.3 ? `Nota de seguimiento ${index + 1}` : undefined,
  }));
};

// Initial mock leads data
export const mockLeads: Lead[] = generateMockLeads(50);

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
