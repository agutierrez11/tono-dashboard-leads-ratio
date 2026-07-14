import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_type: string;
  avatar_style: string;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const isMock = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes("dummy-url");
      if (isMock) {
        const local = localStorage.getItem("user-profile");
        if (local) return JSON.parse(local);
        const defaultProfile = {
          id: "default-profile",
          user_id: "mock-user-id",
          display_name: "Antonio Gutiérrez",
          avatar_type: "initials",
          avatar_style: "avatar-initials",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as UserProfile;
        localStorage.setItem("user-profile", JSON.stringify(defaultProfile));
        return defaultProfile;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserProfile | null;
    },
  });
};

export const useCreateOrUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      displayName, 
      avatarType, 
      avatarStyle 
    }: { 
      displayName: string; 
      avatarType: string; 
      avatarStyle: string;
    }) => {
      const isMock = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes("dummy-url");
      if (isMock) {
        const newProfile = {
          id: "profile-id",
          user_id: "mock-user-id",
          display_name: displayName,
          avatar_type: avatarType,
          avatar_style: avatarStyle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as UserProfile;
        localStorage.setItem("user-profile", JSON.stringify(newProfile));
        return newProfile;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Check if profile exists
      const { data: existing } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("user_profiles")
          .update({ 
            display_name: displayName, 
            avatar_type: avatarType,
            avatar_style: avatarStyle 
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("user_profiles")
          .insert({
            user_id: user.id,
            display_name: displayName,
            avatar_type: avatarType,
            avatar_style: avatarStyle,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Perfil actualizado");
    },
    onError: (error) => {
      toast.error("Error al guardar perfil: " + error.message);
    },
  });
};
