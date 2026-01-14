export type Channel = 'linkedin' | 'phone' | 'email';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed' | 'lost';

export interface Lead {
  id: string;
  name: string;
  company: string;
  channel: Channel;
  status: LeadStatus;
  date: Date;
  notes?: string;
  closedDate?: Date; // Date when the lead was closed/lost
  nextFollowUp?: Date; // Next scheduled follow-up date
}

export interface LeadStats {
  total: number;
  byChannel: Record<Channel, number>;
  byStatus: Record<string, number>;
  conversionRate: Record<Channel, number>; // Conversion rate by channel
  salesCycleTime: Record<Channel, number>; // Average sales cycle time in days by channel
}

export interface TimeframeData {
  label: string;
  linkedin: number;
  phone: number;
  email: number;
  total: number;
}

export type Timeframe = 'daily' | 'weekly' | 'monthly';

export interface ConversionData {
  channel: Channel;
  rate: number;
  leads: number;
  closed: number;
}

export interface SalesCycleData {
  channel: Channel;
  avgDays: number;
  count: number;
}
