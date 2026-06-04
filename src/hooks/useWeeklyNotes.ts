import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WeeklyNote {
  id: string;
  user_id: string;
  week_start_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

const getLocalStorageNotes = (): WeeklyNote[] => {
  try {
    const saved = localStorage.getItem("sales_weekly_notes");
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Error reading weekly notes from localStorage:", e);
    return [];
  }
};

const saveLocalStorageNote = (weekStartDate: string, notes: string, userId: string) => {
  const current = getLocalStorageNotes();
  const index = current.findIndex((n) => n.week_start_date === weekStartDate);
  
  if (index >= 0) {
    current[index] = {
      ...current[index],
      notes,
      updated_at: new Date().toISOString(),
    };
  } else {
    const uuid = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15);
      
    current.push({
      id: uuid,
      user_id: userId,
      week_start_date: weekStartDate,
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  
  localStorage.setItem("sales_weekly_notes", JSON.stringify(current));
};

export const useWeeklyNotes = () => {
  return useQuery({
    queryKey: ["weekly-notes"],
    queryFn: async (): Promise<WeeklyNote[]> => {
      try {
        const { data, error } = await supabase
          .from("weekly_notes")
          .select("*")
          .order("week_start_date", { ascending: false });

        if (error) {
          // If table does not exist, code '42P01' is returned
          if (error.code === "42P01") {
            console.warn("Table 'weekly_notes' not found in Supabase. Using localStorage fallback.");
            return getLocalStorageNotes();
          }
          throw error;
        }
        return (data as WeeklyNote[]) || [];
      } catch (e) {
        console.warn("Supabase weekly_notes fetch failed. Falling back to localStorage.", e);
        return getLocalStorageNotes();
      }
    },
  });
};

export const useSaveWeeklyNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      weekStartDate, 
      notes 
    }: { 
      weekStartDate: string; 
      notes: string 
    }) => {
      let userId = "00000000-0000-0000-0000-000000000001"; // Default demo id
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) userId = user.id;
      } catch (_) {}

      try {
        // Try to find if a record already exists for this week
        const { data: existing, error: fetchError } = await supabase
          .from("weekly_notes")
          .select("*")
          .eq("week_start_date", weekStartDate)
          .maybeSingle();

        if (fetchError) {
          if (fetchError.code === "42P01") {
            // Table doesn't exist, fallback to localStorage
            saveLocalStorageNote(weekStartDate, notes, userId);
            return { week_start_date: weekStartDate, notes } as any;
          }
          throw fetchError;
        }

        if (existing) {
          // Update
          const { data, error } = await supabase
            .from("weekly_notes")
            .update({ notes })
            .eq("id", existing.id)
            .select()
            .single();
            
          if (error) throw error;
          return data;
        } else {
          // Insert
          const { data, error } = await supabase
            .from("weekly_notes")
            .insert({
              user_id: userId,
              week_start_date: weekStartDate,
              notes,
            })
            .select()
            .single();
            
          if (error) throw error;
          return data;
        }
      } catch (e: any) {
        console.warn("Supabase weekly_notes save failed. Saving to localStorage.", e);
        saveLocalStorageNote(weekStartDate, notes, userId);
        return { week_start_date: weekStartDate, notes } as any;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-notes"] });
      toast.success("Nota de la semana guardada");
    },
    onError: (error) => {
      toast.error("Error al guardar la nota: " + error.message);
    },
  });
};
