import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import Index from "./pages/Index";
import Leads from "./pages/Leads";
import LeadsList from "./pages/LeadsList";
import Reports from "./pages/Reports";
import LinkedinPage from "./pages/LinkedinPage";
import PhonePage from "./pages/PhonePage";
import EmailPage from "./pages/EmailPage";
import NotFound from "./pages/NotFound";
import { FunnelMetricsProvider } from "@/contexts/FunnelMetricsContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <FunnelMetricsProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads-list" element={<LeadsList />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/linkedin" element={<LinkedinPage />} />
            <Route path="/phone" element={<PhonePage />} />
            <Route path="/email" element={<EmailPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </FunnelMetricsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
