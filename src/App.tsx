
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Leads from "./pages/Leads";
import Reports from "./pages/Reports";
import LinkedinPage from "./pages/LinkedinPage";
import PhonePage from "./pages/PhonePage";
import EmailPage from "./pages/EmailPage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const AppContent = ({ children }: { children: React.ReactNode }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <AppContent>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/linkedin" element={<LinkedinPage />} />
        <Route path="/phone" element={<PhonePage />} />
        <Route path="/email" element={<EmailPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppContent>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
