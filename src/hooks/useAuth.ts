import { User } from "@supabase/supabase-js";

export const useAuth = () => {
  const user = {
    id: "tono-user-local",
    email: "antonio.gutierrez@mercadopago.com",
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
