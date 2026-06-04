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
import Auth from "./pages/Auth";
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
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
            <Route path="/leads-list" element={<ProtectedRoute><LeadsList /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/linkedin" element={<ProtectedRoute><LinkedinPage /></ProtectedRoute>} />
            <Route path="/phone" element={<ProtectedRoute><PhonePage /></ProtectedRoute>} />
            <Route path="/email" element={<ProtectedRoute><EmailPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </FunnelMetricsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
