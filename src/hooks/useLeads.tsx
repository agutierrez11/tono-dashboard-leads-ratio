
import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Lead, LeadNote, LeadFilters, Channel, LeadStatus, TimeframeData, ConversionData, SalesCycleData, FunnelData } from "@/utils/types";
import { toast } from "sonner";

type DatabaseLead = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  channel: string;
  status: string;
  source: string | null;
  created_at: string;
  updated_at: string;
  contacted_at: string | null;
  closed_at: string | null;
  next_followup_at: string | null;
  sale_value: number | null;
  sale_cycle_days: number | null;
};

type DatabaseLeadNote = {
  id: string;
  lead_id: string;
  user_id: string;
  content: string;
  note_type: string;
  created_at: string;
};

const mapDatabaseLead = (dbLead: DatabaseLead): Lead => ({
  id: dbLead.id,
  user_id: dbLead.user_id,
  name: dbLead.name,
  email: dbLead.email || undefined,
  phone: dbLead.phone || undefined,
  company: dbLead.company || undefined,
  channel: dbLead.channel as Channel,
  status: dbLead.status as LeadStatus,
  source: dbLead.source || undefined,
  created_at: dbLead.created_at,
  updated_at: dbLead.updated_at,
  contacted_at: dbLead.contacted_at || undefined,
  closed_at: dbLead.closed_at || undefined,
  next_followup_at: dbLead.next_followup_at || undefined,
  sale_value: dbLead.sale_value || undefined,
  sale_cycle_days: dbLead.sale_cycle_days || undefined,
});

const mapDatabaseNote = (dbNote: DatabaseLeadNote): LeadNote => ({
  id: dbNote.id,
  lead_id: dbNote.lead_id,
  user_id: dbNote.user_id,
  content: dbNote.content,
  note_type: dbNote.note_type as LeadNote['note_type'],
  created_at: dbNote.created_at,
});

export const useLeads = (filters?: LeadFilters) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ["leads", user?.id, filters],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (filters?.channel && filters.channel !== 'all') {
        query = query.eq("channel", filters.channel);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq("status", filters.status);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,company.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo.toISOString());
      }
      if (filters?.hasFollowup) {
        query = query.not("next_followup_at", "is", null);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapDatabaseLead);
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["leads"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const addLeadMutation = useMutation({
    mutationFn: async (lead: Omit<Lead, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user) throw new Error("No user");

      const { data, error } = await supabase
        .from("leads")
        .insert({
          user_id: user.id,
          name: lead.name,
          email: lead.email || null,
          phone: lead.phone || null,
          company: lead.company || null,
          channel: lead.channel,
          status: lead.status,
          source: lead.source || null,
          next_followup_at: lead.next_followup_at || null,
          sale_value: lead.sale_value || null,
        })
        .select()
        .single();

      if (error) throw error;
      return mapDatabaseLead(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from("leads")
        .update({
          name: updates.name,
          email: updates.email || null,
          phone: updates.phone || null,
          company: updates.company || null,
          channel: updates.channel,
          status: updates.status,
          source: updates.source || null,
          next_followup_at: updates.next_followup_at || null,
          sale_value: updates.sale_value || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapDatabaseLead(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const deleteAllLeadsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No user");

      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Todos los leads han sido eliminados");
    },
  });

  const importLeadsMutation = useMutation({
    mutationFn: async (leadsToImport: Array<Omit<Lead, "id" | "user_id" | "created_at" | "updated_at">>) => {
      if (!user) throw new Error("No user");

      const leadsData = leadsToImport.map(lead => ({
        user_id: user.id,
        name: lead.name,
        email: lead.email || null,
        phone: lead.phone || null,
        company: lead.company || null,
        channel: lead.channel,
        status: lead.status,
        source: lead.source || null,
        next_followup_at: lead.next_followup_at || null,
      }));

      const { error } = await supabase
        .from("leads")
        .insert(leadsData);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`${variables.length} leads importados correctamente`);
    },
  });

  return {
    leads,
    isLoading,
    refetch,
    addLead: addLeadMutation.mutateAsync,
    updateLead: updateLeadMutation.mutateAsync,
    deleteLead: deleteLeadMutation.mutateAsync,
    deleteAllLeads: deleteAllLeadsMutation.mutateAsync,
    importLeads: importLeadsMutation.mutateAsync,
    isAdding: addLeadMutation.isPending,
    isUpdating: updateLeadMutation.isPending,
  };
};

export const useLeadNotes = (leadId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["lead-notes", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_notes")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapDatabaseNote);
    },
    enabled: !!leadId,
  });

  const addNoteMutation = useMutation({
    mutationFn: async (note: { content: string; note_type: LeadNote['note_type'] }) => {
      if (!user) throw new Error("No user");

      const { data, error } = await supabase
        .from("lead_notes")
        .insert({
          lead_id: leadId,
          user_id: user.id,
          content: note.content,
          note_type: note.note_type,
        })
        .select()
        .single();

      if (error) throw error;
      return mapDatabaseNote(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-notes", leadId] });
    },
  });

  return {
    notes,
    isLoading,
    addNote: addNoteMutation.mutateAsync,
  };
};

export const useFollowupLeads = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["followup-leads", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .not("next_followup_at", "is", null)
        .order("next_followup_at", { ascending: true });

      if (error) throw error;
      return (data || []).map(mapDatabaseLead);
    },
    enabled: !!user,
  });
};

// Helper functions for metrics
export const calculateConversionRates = (leads: Lead[]): ConversionData[] => {
  const channels: Channel[] = ['linkedin', 'phone', 'email'];
  
  return channels.map(channel => {
    const channelLeads = leads.filter(lead => lead.channel === channel);
    const totalLeads = channelLeads.length;
    const closedLeads = channelLeads.filter(lead => lead.status === 'won').length;
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
  const channels: Channel[] = ['linkedin', 'phone', 'email'];
  
  return channels.map(channel => {
    const closedLeads = leads.filter(
      lead => lead.channel === channel && 
      lead.status === 'won' && 
      lead.sale_cycle_days
    );
    
    const totalDays = closedLeads.reduce((sum, lead) => sum + (lead.sale_cycle_days || 0), 0);
    const avgDays = closedLeads.length > 0 ? totalDays / closedLeads.length : 0;
    
    return {
      channel,
      avgDays: parseFloat(avgDays.toFixed(1)),
      count: closedLeads.length
    };
  });
};

export const calculateFunnelData = (leads: Lead[]): FunnelData[] => {
  const statusOrder: { status: LeadStatus; label: string }[] = [
    { status: 'new', label: 'Nuevos' },
    { status: 'contacted', label: 'Contactados' },
    { status: 'negotiation', label: 'En Negociación' },
    { status: 'won', label: 'Ganados' },
    { status: 'lost', label: 'Perdidos' },
  ];

  const total = leads.length;

  return statusOrder.map(({ status, label }) => {
    const count = leads.filter(lead => lead.status === status).length;
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return {
      status,
      label,
      count,
      percentage: parseFloat(percentage.toFixed(1)),
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
      const leadDate = new Date(lead.created_at);
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
      const leadDate = new Date(lead.created_at);
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
      const leadDate = new Date(lead.created_at);
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
