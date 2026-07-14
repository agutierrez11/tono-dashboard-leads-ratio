import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChannelGoal {
  id: string;
  user_id: string;
  channel: string;
  goal_type: string;
  target_value: number;
  period: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export const useMonthlyGoal = () => {
  return useQuery({
    queryKey: ["channel-goals", "monthly-deals"],
    queryFn: async () => {
      const isMock = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes("dummy-url");
      if (isMock) {
        const local = localStorage.getItem("monthly-goal");
        if (local) return JSON.parse(local);
        const defaultGoal = {
          id: "default-goal",
          user_id: "mock-user-id",
          channel: "all",
          goal_type: "deals",
          target_value: 10,
          period: "monthly",
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        } as ChannelGoal;
        localStorage.setItem("monthly-goal", JSON.stringify(defaultGoal));
        return defaultGoal;
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("channel_goals")
        .select("*")
        .eq("goal_type", "deals")
        .eq("period", "monthly")
        .gte("start_date", startOfMonth)
        .lte("end_date", endOfMonth)
        .maybeSingle();

      if (error) throw error;
      return data as ChannelGoal | null;
    },
  });
};

export const useSetMonthlyGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetValue }: { targetValue: number }) => {
      const isMock = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes("dummy-url");
      if (isMock) {
        const newGoal = {
          id: "goal-id",
          user_id: "mock-user-id",
          channel: "all",
          goal_type: "deals",
          target_value: targetValue,
          period: "monthly",
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        } as ChannelGoal;
        localStorage.setItem("monthly-goal", JSON.stringify(newGoal));
        return newGoal;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (!userId) throw new Error("No authenticated user");

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

      // Check if goal already exists
      const { data: existing } = await supabase
        .from("channel_goals")
        .select("*")
        .eq("goal_type", "deals")
        .eq("period", "monthly")
        .gte("start_date", startOfMonth)
        .lte("end_date", endOfMonth)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("channel_goals")
          .update({ target_value: targetValue })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("channel_goals")
          .insert({
            user_id: userId,
            channel: "all",
            goal_type: "deals",
            target_value: targetValue,
            period: "monthly",
            start_date: startOfMonth,
            end_date: endOfMonth,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-goals"] });
      toast.success("Meta actualizada");
    },
    onError: (error) => {
      toast.error("Error al guardar meta: " + error.message);
    },
  });
};
