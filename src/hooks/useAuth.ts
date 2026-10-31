import { User } from "@supabase/supabase-js";

export const useAuth = () => {
  const user = {
    id: "local-user",
    email: "",
    aud: "authenticated",
    role: "authenticated",
    created_at: new Date().toISOString(),
  } as User;

  return {
    user,
    loading: false,
    signOut: async () => {},
  };
};
