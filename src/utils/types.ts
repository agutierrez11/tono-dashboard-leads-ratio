
export type Channel = 'linkedin' | 'phone' | 'email';

export interface Lead {
  id: string;
  name: string;
  company: string;
  channel: Channel;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed' | 'lost';
  date: Date;
  notes?: string;
}

export interface LeadStats {
  total: number;
  byChannel: Record<Channel, number>;
  byStatus: Record<string, number>;
}

export interface TimeframeData {
  label: string;
  linkedin: number;
  phone: number;
  email: number;
  total: number;
}

export type Timeframe = 'daily' | 'weekly' | 'monthly';
