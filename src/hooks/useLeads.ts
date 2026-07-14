
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
      const isMock = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes("dummy-url");
      if (isMock) {
        const local = localStorage.getItem("leads");
        if (local) return JSON.parse(local);
        const seedData = getSeedLeads();
        localStorage.setItem("leads", JSON.stringify(seedData));
        return seedData;
      }

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
      (lead) => lead.status === "won"
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
      const isMock = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes("dummy-url");
      if (isMock) {
        localStorage.setItem("leads", JSON.stringify([]));
        return;
      }

      const { error } = await supabase.from("leads").delete().gte("created_at", "1970-01-01");
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
      const isMock = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes("dummy-url");
      if (isMock) {
        const local = localStorage.getItem("leads");
        const leads = local ? JSON.parse(local) : [];
        const newLead = {
          ...lead,
          id: "lead-" + Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as DatabaseLead;
        leads.unshift(newLead);
        localStorage.setItem("leads", JSON.stringify(leads));
        return newLead;
      }

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

export const useUpdateLeadStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const isMock = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes("dummy-url");
      if (isMock) {
        const local = localStorage.getItem("leads");
        const leads = local ? JSON.parse(local) : [];
        const updatedLeads = leads.map((l: any) => 
          l.id === leadId 
            ? { 
                ...l, 
                status, 
                updated_at: new Date().toISOString(),
                closed_at: (status === 'won' || status === 'lost') ? new Date().toISOString() : null,
                sale_cycle_days: (status === 'won' || status === 'lost') 
                  ? Math.max(1, Math.floor((new Date().getTime() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24))) 
                  : null
              } 
            : l
        );
        localStorage.setItem("leads", JSON.stringify(updatedLeads));
        return updatedLeads.find((l: any) => l.id === leadId);
      }

      const { data, error } = await supabase
        .from("leads")
        .update({ status })
        .eq("id", leadId)
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

const getSeedLeads = (): DatabaseLead[] => {
  const baseDate = new Date();
  const getPastDate = (daysAgo: number) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };

  return [
    {
      id: "seed-1",
      name: "Alejandro Pérez",
      email: "aperez@coppel.com",
      phone: "+52 55 1234 5678",
      company: "Coppel",
      channel: "phone",
      status: "won",
      source: "Cold Call",
      user_id: "mock-user-id",
      contacted_at: getPastDate(10),
      closed_at: getPastDate(2),
      next_followup_at: null,
      sale_value: 28000,
      sale_cycle_days: 8,
      created_at: getPastDate(10),
      updated_at: getPastDate(2),
    },
    {
      id: "seed-2",
      name: "Mariana Silva",
      email: "msilva@itau.com.br",
      phone: "+55 11 98765 4321",
      company: "Banco Itaú",
      channel: "linkedin",
      status: "qualified",
      source: "LinkedIn Outreach",
      user_id: "mock-user-id",
      contacted_at: getPastDate(5),
      closed_at: null,
      next_followup_at: getPastDate(-2),
      sale_value: 45000,
      sale_cycle_days: null,
      created_at: getPastDate(5),
      updated_at: getPastDate(5),
    },
    {
      id: "seed-3",
      name: "Juan Gómez",
      email: "jgomez@bancolombia.com",
      phone: "+57 300 123 4567",
      company: "Bancolombia",
      channel: "email",
      status: "contacted",
      source: "Outbound Campaign",
      user_id: "mock-user-id",
      contacted_at: getPastDate(3),
      closed_at: null,
      next_followup_at: getPastDate(-1),
      sale_value: 15000,
      sale_cycle_days: null,
      created_at: getPastDate(3),
      updated_at: getPastDate(3),
    },
    {
      id: "seed-4",
      name: "Carolina Fuentes",
      email: "cfuentes@liverpool.com.mx",
      phone: "+52 55 8765 4321",
      company: "Liverpool",
      channel: "phone",
      status: "nurturing",
      source: "Cold Call",
      user_id: "mock-user-id",
      contacted_at: getPastDate(12),
      closed_at: null,
      next_followup_at: getPastDate(-3),
      sale_value: 32000,
      sale_cycle_days: null,
      created_at: getPastDate(12),
      updated_at: getPastDate(12),
    },
    {
      id: "seed-5",
      name: "Roberto Díaz",
      email: "rdiaz@nubank.com.br",
      phone: "+55 11 91234 5678",
      company: "Nubank",
      channel: "linkedin",
      status: "won",
      source: "LinkedIn Outreach",
      user_id: "mock-user-id",
      contacted_at: getPastDate(15),
      closed_at: getPastDate(5),
      next_followup_at: null,
      sale_value: 60000,
      sale_cycle_days: 10,
      created_at: getPastDate(15),
      updated_at: getPastDate(5),
    },
    {
      id: "seed-6",
      name: "Sofía Castro",
      email: "scastro@mercadolibre.com.mx",
      phone: "+52 55 1111 2222",
      company: "Mercado Libre",
      channel: "email",
      status: "lost",
      source: "Outbound Campaign",
      user_id: "mock-user-id",
      contacted_at: getPastDate(8),
      closed_at: getPastDate(4),
      next_followup_at: null,
      sale_value: 20000,
      sale_cycle_days: 4,
      created_at: getPastDate(8),
      updated_at: getPastDate(4),
    }
  ];
};
