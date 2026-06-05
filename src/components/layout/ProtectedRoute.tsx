import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  // Si no hay sesión, crear una anónima automáticamente — sin login
  useEffect(() => {
    if (!loading && !user) {
      supabase.auth.signInAnonymously().catch(() => {
        // Si falla (ej. anon auth desactivado en Supabase), simplemente ignorar
      });
    }
  }, [user, loading]);

  if (loading || (!user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
};
