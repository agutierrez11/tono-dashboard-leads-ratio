import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [authAttempted, setAuthAttempted] = useState(false);

  // Si no hay sesión, crear una anónima automáticamente — sin login
  useEffect(() => {
    const isMock = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes("dummy-url");
    if (isMock) {
      setAuthAttempted(true);
      return;
    }

    if (!loading && !user) {
      const hasAttempted = sessionStorage.getItem("supabase_anon_attempted");
      if (hasAttempted) {
        setAuthAttempted(true);
        return;
      }

      sessionStorage.setItem("supabase_anon_attempted", "true");
      supabase.auth.signInAnonymously()
        .then(() => {
          setAuthAttempted(true);
        })
        .catch(() => {
          setAuthAttempted(true);
        });
    } else if (user) {
      setAuthAttempted(true);
    }
  }, [user, loading]);

  if (loading || (!authAttempted && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
