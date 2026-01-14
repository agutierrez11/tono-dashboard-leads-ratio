
export type Channel = 'linkedin' | 'phone' | 'email';

export type LeadStatus = 'new' | 'contacted' | 'negotiation' | 'won' | 'lost';

export type NoteType = 'note' | 'call' | 'email' | 'meeting' | 'followup';

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  channel: Channel;
  status: LeadStatus;
  source?: string;
  created_at: string;
  updated_at: string;
  contacted_at?: string;
  closed_at?: string;
  next_followup_at?: string;
  sale_value?: number;
  sale_cycle_days?: number;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  user_id: string;
  content: string;
  note_type: NoteType;
  created_at: string;
}

export interface ChannelGoal {
  id: string;
  user_id: string;
  channel: Channel;
  period: 'daily' | 'weekly' | 'monthly';
  goal_type: 'leads' | 'conversions' | 'revenue';
  target_value: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface LeadStatusHistory {
  id: string;
  lead_id: string;
  from_status?: string;
  to_status: string;
  changed_at: string;
  changed_by: string;
}

export interface LeadStats {
  total: number;
  byChannel: Record<Channel, number>;
  byStatus: Record<LeadStatus, number>;
  conversionRate: Record<Channel, number>;
  salesCycleTime: Record<Channel, number>;
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

export interface FunnelData {
  status: LeadStatus;
  label: string;
  count: number;
  percentage: number;
}

export interface LeadFilters {
  search?: string;
  channel?: Channel | 'all';
  status?: LeadStatus | 'all';
  dateFrom?: Date;
  dateTo?: Date;
  hasFollowup?: boolean;
}
