
import { TimeframeData } from './types';

// Empty arrays - no more mock data
export const mockLeads: never[] = [];
export const conversionRates: { channel: string; rate: number; leads: number; closed: number }[] = [];
export const salesCycleTimes: { channel: string; avgDays: number; count: number }[] = [];

// Generate empty chart data structures
export const generateEmptyDailyData = (): TimeframeData[] => {
  return Array.from({ length: 14 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    const day = date.getDate();
    const month = date.getMonth() + 1;
    
    return {
      label: `${day}/${month}`,
      linkedin: 0,
      phone: 0,
      email: 0,
      total: 0
    };
  });
};

export const generateEmptyWeeklyData = (): TimeframeData[] => {
  return Array.from({ length: 8 }).map((_, i) => {
    return {
      label: `Sem ${i + 1}`,
      linkedin: 0,
      phone: 0,
      email: 0,
      total: 0
    };
  });
};

export const generateEmptyMonthlyData = (): TimeframeData[] => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  return Array.from({ length: 6 }).map((_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    
    return {
      label: months[date.getMonth()],
      linkedin: 0,
      phone: 0,
      email: 0,
      total: 0
    };
  });
};

export const dailyData = generateEmptyDailyData();
export const weeklyData = generateEmptyWeeklyData();
export const monthlyData = generateEmptyMonthlyData();
