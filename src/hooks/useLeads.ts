
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DatabaseLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  channel: "linkedin" | "phone" | "email";
  status: string;
  source: string | null;
  user_id: string;
  contacted_at: string | null;
  closed_at: string | null;
  next_followup_at: string | null;
  sale_value: number | null;
  sale_cycle_days: number | null;
  created_at: string;
  updated_at: string;
}

export const useLeads = () => {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as DatabaseLead[]) || [];
    },
  });
};

export const useLeadStats = () => {
  const { data: leads = [], isLoading } = useLeads();

  const stats = {
    total: leads.length,
    byChannel: {
      linkedin: leads.filter((lead) => lead.channel === "linkedin").length,
      phone: leads.filter((lead) => lead.channel === "phone").length,
      email: leads.filter((lead) => lead.channel === "email").length,
    },
    conversionRates: calculateConversionRates(leads),
    salesCycleTimes: calculateSalesCycleTimes(leads),
  };

  return { stats, isLoading };
};

const calculateConversionRates = (leads: DatabaseLead[]) => {
  const channels = ["linkedin", "phone", "email"] as const;

  return channels.map((channel) => {
    const channelLeads = leads.filter((lead) => lead.channel === channel);
    const totalLeads = channelLeads.length;
    const closedLeads = channelLeads.filter(
      (lead) => lead.status === "closed"
    ).length;
    const rate = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;

    return {
      channel,
      rate: parseFloat(rate.toFixed(1)),
      leads: totalLeads,
      closed: closedLeads,
    };
  });
};

const calculateSalesCycleTimes = (leads: DatabaseLead[]) => {
  const channels = ["linkedin", "phone", "email"] as const;

  return channels.map((channel) => {
    const closedLeads = leads.filter(
      (lead) =>
        lead.channel === channel &&
        (lead.status === "closed" || lead.status === "lost") &&
        lead.closed_at
    );

    let totalDays = 0;
    closedLeads.forEach((lead) => {
      if (lead.closed_at) {
        const createdAt = new Date(lead.created_at);
        const closedAt = new Date(lead.closed_at);
        const cycleTime = Math.floor(
          (closedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalDays += cycleTime;
      }
    });

    const avgDays = closedLeads.length > 0 ? totalDays / closedLeads.length : 0;

    return {
      channel,
      avgDays: parseFloat(avgDays.toFixed(1)),
      count: closedLeads.length,
    };
  });
};

export const useDeleteAllLeads = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("leads").delete().neq("id", "");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Todos los datos han sido eliminados");
    },
    onError: (error) => {
      toast.error("Error al eliminar datos: " + error.message);
    },
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: Omit<DatabaseLead, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("leads")
        .insert(lead)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
};
