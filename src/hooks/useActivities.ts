import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  anomaly_notes?: string | null;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = "meli_cockpit_activities_local";

function getLocalActivities(): DailyActivity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalActivities(activities: DailyActivity[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
}

export const useTodayActivities = () => {
  return useQuery({
    queryKey: ["daily-activities", "today"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const all = getLocalActivities();
      const existing = all.find((a) => a.activity_date === today);
      return existing || null;
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
      const all = getLocalActivities();
      return all.filter((a) => a.activity_date >= startOfMonth && a.activity_date <= endOfMonth);
    },
  });
};

export const useRecentActivities = (days: number = 30) => {
  return useQuery({
    queryKey: ["daily-activities", "recent", days],
    queryFn: async () => {
      const all = getLocalActivities();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().split("T")[0];
      return all.filter((a) => a.activity_date >= cutoffStr);
    },
  });
};

export const useIncrementActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      activityType,
    }: {
      activityType: "calls_made" | "calls_connected" | "emails_sent" | "linkedin_contacts" | "meetings_booked" | "sales_won";
    }) => {
      const today = new Date().toISOString().split("T")[0];
      const all = getLocalActivities();
      const index = all.findIndex((a) => a.activity_date === today);

      let record: DailyActivity;
      if (index >= 0) {
        record = {
          ...all[index],
          [activityType]: (all[index] as any)[activityType] + 1,
          updated_at: new Date().toISOString(),
        };
        all[index] = record;
      } else {
        record = {
          id: `act-${Date.now()}`,
          user_id: "local-user",
          activity_date: today,
          calls_made: 0,
          calls_connected: 0,
          emails_sent: 0,
          linkedin_contacts: 0,
          meetings_booked: 0,
          sales_won: 0,
          revenue_won: 0,
          [activityType]: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        all.push(record);
      }

      saveLocalActivities(all);
      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-activities"] });
    },
  });
};

export const useAddAnomalyNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ note }: { note: string }) => {
      const today = new Date().toISOString().split("T")[0];
      const all = getLocalActivities();
      const index = all.findIndex((a) => a.activity_date === today);
      if (index >= 0) {
        all[index].anomaly_notes = note;
        saveLocalActivities(all);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-activities"] });
    },
  });
};

export const useUpdateAnomalyNotes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ activityId, notes }: { activityId?: string; notes: string }) => {
      const all = getLocalActivities();
      if (activityId) {
        const item = all.find((a) => a.id === activityId);
        if (item) item.anomaly_notes = notes;
      }
      saveLocalActivities(all);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-activities"] });
    },
  });
};
