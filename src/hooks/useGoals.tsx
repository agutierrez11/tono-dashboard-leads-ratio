
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { ChannelGoal, Channel } from "@/utils/types";
import { toast } from "sonner";

type DatabaseChannelGoal = {
  id: string;
  user_id: string;
  channel: string;
  period: string;
  goal_type: string;
  target_value: number;
  start_date: string;
  end_date: string;
  created_at: string;
};

const mapDatabaseGoal = (dbGoal: DatabaseChannelGoal): ChannelGoal => ({
  id: dbGoal.id,
  user_id: dbGoal.user_id,
  channel: dbGoal.channel as Channel,
  period: dbGoal.period as ChannelGoal['period'],
  goal_type: dbGoal.goal_type as ChannelGoal['goal_type'],
  target_value: dbGoal.target_value,
  start_date: dbGoal.start_date,
  end_date: dbGoal.end_date,
  created_at: dbGoal.created_at,
});

export const useChannelGoals = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["channel-goals", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("channel_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapDatabaseGoal);
    },
    enabled: !!user,
  });

  const addGoalMutation = useMutation({
    mutationFn: async (goal: Omit<ChannelGoal, "id" | "user_id" | "created_at">) => {
      if (!user) throw new Error("No user");

      const { data, error } = await supabase
        .from("channel_goals")
        .insert({
          user_id: user.id,
          channel: goal.channel,
          period: goal.period,
          goal_type: goal.goal_type,
          target_value: goal.target_value,
          start_date: goal.start_date,
          end_date: goal.end_date,
        })
        .select()
        .single();

      if (error) throw error;
      return mapDatabaseGoal(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-goals"] });
      toast.success("Meta creada correctamente");
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ChannelGoal> & { id: string }) => {
      const { data, error } = await supabase
        .from("channel_goals")
        .update({
          channel: updates.channel,
          period: updates.period,
          goal_type: updates.goal_type,
          target_value: updates.target_value,
          start_date: updates.start_date,
          end_date: updates.end_date,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapDatabaseGoal(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-goals"] });
      toast.success("Meta actualizada");
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("channel_goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-goals"] });
      toast.success("Meta eliminada");
    },
  });

  return {
    goals,
    isLoading,
    addGoal: addGoalMutation.mutateAsync,
    updateGoal: updateGoalMutation.mutateAsync,
    deleteGoal: deleteGoalMutation.mutateAsync,
    isAdding: addGoalMutation.isPending,
  };
};

export const calculateGoalProgress = (
  goals: ChannelGoal[],
  leads: { channel: Channel; status: string; sale_value?: number; created_at: string }[]
) => {
  const now = new Date();
  
  return goals.map(goal => {
    const startDate = new Date(goal.start_date);
    const endDate = new Date(goal.end_date);
    
    // Check if goal is active
    const isActive = now >= startDate && now <= endDate;
    
    // Filter leads in the goal period
    const periodLeads = leads.filter(lead => {
      const leadDate = new Date(lead.created_at);
      return lead.channel === goal.channel && 
             leadDate >= startDate && 
             leadDate <= endDate;
    });
    
    let currentValue = 0;
    
    switch (goal.goal_type) {
      case 'leads':
        currentValue = periodLeads.length;
        break;
      case 'conversions':
        currentValue = periodLeads.filter(lead => lead.status === 'won').length;
        break;
      case 'revenue':
        currentValue = periodLeads
          .filter(lead => lead.status === 'won')
          .reduce((sum, lead) => sum + (lead.sale_value || 0), 0);
        break;
    }
    
    const progress = goal.target_value > 0 
      ? Math.min((currentValue / goal.target_value) * 100, 100) 
      : 0;
    
    return {
      ...goal,
      currentValue,
      progress: parseFloat(progress.toFixed(1)),
      isActive,
      isCompleted: currentValue >= goal.target_value,
    };
  });
};
