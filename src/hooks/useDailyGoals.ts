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

export type ActivityType = "calls_made" | "calls_connected" | "emails_sent" | "linkedin_contacts" | "meetings_booked" | "sales_won";

export const useDailyGoals = () => {
  return useQuery({
    queryKey: ["daily-goals"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (!userId) throw new Error("No authenticated user");
      console.log("Fetching daily goals for user:", userId);

      const { data, error } = await supabase
        .from("daily_goals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching daily goals:", error);
        throw error;
      }
      console.log("Daily goals fetched successfully:", data);
      return (data as DailyGoal[]) || [];
    },
  });
};

export const useSetDailyGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalType, targetValue }: { goalType: ActivityType; targetValue: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (!userId) throw new Error("No authenticated user");
      console.log(`Setting daily goal for ${goalType} to ${targetValue}`);

      // Check if goal already exists for this type
      const { data: existing, error: selectError } = await supabase
        .from("daily_goals")
        .select("*")
        .eq("goal_type", goalType)
        .eq("user_id", userId)
        .maybeSingle();

      if (selectError) {
        console.error("Error checking existing goal:", selectError);
        throw selectError;
      }

      console.log("Existing goal check result:", existing);

      if (existing) {
        console.log("Updating existing goal ID:", existing.id);
        const { data, error } = await supabase
          .from("daily_goals")
          .update({ target_value: targetValue })
          .eq("id", existing.id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) {
          console.error("Error updating goal:", error);
          throw error;
        }
        return data;
      } else {
        console.log("Inserting new goal");
        const { data, error } = await supabase
          .from("daily_goals")
          .insert({
            user_id: userId,
            goal_type: goalType,
            target_value: targetValue,
          })
          .select()
          .single();

        if (error) {
          console.error("Error inserting goal:", error);
          throw error;
        }
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-goals"] });
      toast.success("Meta guardada");
    },
    onError: (error) => {
      console.error("Mutation onError triggered for daily goal:", error);
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
      const userId = user?.id;
      if (!userId) throw new Error("No authenticated user");

      const { error } = await supabase
        .from("daily_activities")
        .update({ 
          calls_made: 0, 
          calls_connected: 0, 
          emails_sent: 0, 
          linkedin_contacts: 0,
          meetings_booked: 0,
          sales_won: 0,
          revenue_won: 0
        })
        .eq("activity_date", today)
        .eq("user_id", userId);

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
