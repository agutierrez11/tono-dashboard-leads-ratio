import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface DatabaseLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  channel: "linkedin" | "phone" | "email" | "cambaceo" | "whatsapp";
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

const STORAGE_KEY = "leads";

export const useLeads = () => {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          // If legacy mock demo leads (Coppel, Nubank, Itaú) exist, purge them!
          if (
            Array.isArray(parsed) &&
            parsed.some(
              (l: any) =>
                l.company === "Coppel" ||
                l.company === "Nubank" ||
                l.company === "Liverpool" ||
                l.company === "Itaú"
            )
          ) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
            return [];
          }
          return parsed as DatabaseLead[];
        } catch {
          return [];
        }
      }
      return [];
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
      whatsapp: leads.filter((lead) => lead.channel === "whatsapp").length,
      cambaceo: leads.filter((lead) => (lead as any).channel === "cambaceo").length,
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
    const closedLeads = channelLeads.filter((lead) => lead.status === "won").length;
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
        (lead.status === "won" || lead.status === "lost") &&
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Todos los datos han sido eliminados");
    },
    onError: (error: any) => {
      toast.error("Error al eliminar datos: " + error.message);
    },
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: Omit<DatabaseLead, "id" | "created_at" | "updated_at">) => {
      const local = localStorage.getItem(STORAGE_KEY);
      const leads = local ? JSON.parse(local) : [];
      const newLead = {
        ...lead,
        id: "lead-" + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as DatabaseLead;
      leads.unshift(newLead);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
      return newLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
};

export const useUpdateLeadStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const local = localStorage.getItem(STORAGE_KEY);
      const leads = local ? JSON.parse(local) : [];
      const updatedLeads = leads.map((l: any) =>
        l.id === leadId
          ? {
              ...l,
              status,
              updated_at: new Date().toISOString(),
              closed_at: status === "won" || status === "lost" ? new Date().toISOString() : null,
              sale_cycle_days:
                status === "won" || status === "lost"
                  ? Math.max(
                      1,
                      Math.floor(
                        (new Date().getTime() - new Date(l.created_at).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )
                  : null,
            }
          : l
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLeads));
      return updatedLeads.find((l: any) => l.id === leadId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
};
