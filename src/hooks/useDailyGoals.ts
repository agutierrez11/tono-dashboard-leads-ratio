import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DailyGoal {
  id: string;
  user_id: string;
  goal_type: string;
  target_value: number;
  created_at: string;
  updated_at: string;
}

export type ActivityType = "calls_made" | "calls_connected" | "emails_sent" | "linkedin_contacts";

export const useDailyGoals = () => {
  return useQuery({
    queryKey: ["daily-goals"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from("daily_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as DailyGoal[]) || [];
    },
  });
};

export const useSetDailyGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalType, targetValue }: { goalType: ActivityType; targetValue: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Check if goal already exists for this type
      const { data: existing } = await supabase
        .from("daily_goals")
        .select("*")
        .eq("goal_type", goalType)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("daily_goals")
          .update({ target_value: targetValue })
          .eq("id", existing.id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("daily_goals")
          .insert({
            user_id: user.id,
            goal_type: goalType,
            target_value: targetValue,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-goals"] });
      toast.success("Meta guardada");
    },
    onError: (error) => {
      toast.error("Error al guardar meta: " + error.message);
    },
  });
};

export const useResetTodayActivities = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("No authenticated user");

      const { error } = await supabase
        .from("daily_activities")
        .update({ 
          calls_made: 0, 
          calls_connected: 0, 
          emails_sent: 0, 
          linkedin_contacts: 0 
        })
        .eq("activity_date", today)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-activities"] });
      toast.success("Contadores reiniciados");
    },
    onError: (error) => {
      toast.error("Error al reiniciar: " + error.message);
    },
  });
};
