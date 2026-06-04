import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export const useAuth = () => {
  const user = {
    id: "00000000-0000-0000-0000-000000000001",
    email: "solo@dashboard.com",
  } as any;
  
  const session = { user } as any;
  const loading = false;

  const signOut = async () => {
    // No-op since login is disabled
  };

  return { user, session, loading, signOut };
};
