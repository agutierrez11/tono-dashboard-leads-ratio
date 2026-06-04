import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DailyActivity {
  id: string;
  user_id: string;
  activity_date: string;
  calls_made: number;
  calls_connected: number;
  emails_sent: number;
  linkedin_contacts: number;
  meetings_booked: number;
  sales_won: number;
  revenue_won: number;
  created_at: string;
  updated_at: string;
}

export const useTodayActivities = () => {
  return useQuery({
    queryKey: ["daily-activities", "today"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("daily_activities")
        .select("*")
        .eq("activity_date", today)
        .maybeSingle();

      if (error) throw error;
      return data as DailyActivity | null;
    },
  });
};

export const useMonthlyActivities = () => {
  return useQuery({
    queryKey: ["daily-activities", "monthly"],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("daily_activities")
        .select("*")
        .gte("activity_date", startOfMonth)
        .lte("activity_date", endOfMonth);

      if (error) throw error;
      return (data as DailyActivity[]) || [];
    },
  });
};

export const useIncrementActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      activityType 
    }: { 
      activityType: "calls_made" | "calls_connected" | "emails_sent" | "linkedin_contacts" | "meetings_booked" | "sales_won"
    }) => {
      const today = new Date().toISOString().split("T")[0];
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (!userId) throw new Error("No authenticated user");

      // First, try to get existing record for today
      const { data: existing } = await supabase
        .from("daily_activities")
        .select("*")
        .eq("activity_date", today)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from("daily_activities")
          .update({ [activityType]: (existing as any)[activityType] + 1 })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new record for today
        const newRecord = {
          user_id: userId,
          activity_date: today,
          calls_made: 0,
          calls_connected: 0,
          emails_sent: 0,
          linkedin_contacts: 0,
          meetings_booked: 0,
          sales_won: 0,
          revenue_won: 0,
          [activityType]: 1,
        };

        const { data, error } = await supabase
          .from("daily_activities")
          .insert(newRecord)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-activities"] });
    },
    onError: (error) => {
      toast.error("Error al registrar actividad: " + error.message);
    },
  });
};

export const useUpdateActivityValue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      activityType,
      value,
    }: {
      activityType: "calls_made" | "calls_connected" | "emails_sent" | "linkedin_contacts" | "meetings_booked" | "sales_won" | "revenue_won";
      value: number;
    }) => {
      const today = new Date().toISOString().split("T")[0];
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (!userId) throw new Error("No authenticated user");

      // First, try to get existing record for today
      const { data: existing } = await supabase
        .from("daily_activities")
        .select("*")
        .eq("activity_date", today)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from("daily_activities")
          .update({ [activityType]: value })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new record for today
        const newRecord = {
          user_id: userId,
          activity_date: today,
          calls_made: 0,
          calls_connected: 0,
          emails_sent: 0,
          linkedin_contacts: 0,
          meetings_booked: 0,
          sales_won: 0,
          revenue_won: 0,
          [activityType]: value,
        };

        const { data, error } = await supabase
          .from("daily_activities")
          .insert(newRecord)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-activities"] });
    },
    onError: (error) => {
      toast.error("Error al actualizar métrica: " + error.message);
    },
  });
};

export const useRecentActivities = (days: number = 90) => {
  return useQuery({
    queryKey: ["daily-activities", "recent", days],
    queryFn: async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffStr = cutoffDate.toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("daily_activities")
        .select("*")
        .gte("activity_date", cutoffStr)
        .order("activity_date", { ascending: true });

      if (error) throw error;
      return (data as DailyActivity[]) || [];
    },
  });
};

