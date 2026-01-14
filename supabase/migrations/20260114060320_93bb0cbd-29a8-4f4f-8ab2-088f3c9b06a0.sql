-- Tabla de leads con pipeline, fechas de seguimiento y métricas
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('linkedin', 'phone', 'email')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'negotiation', 'won', 'lost')),
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  contacted_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  next_followup_at TIMESTAMP WITH TIME ZONE,
  sale_value DECIMAL(10,2),
  sale_cycle_days INTEGER
);

-- Tabla de notas/actividades por lead
CREATE TABLE public.lead_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'note' CHECK (note_type IN ('note', 'call', 'email', 'meeting', 'followup')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de metas/objetivos por canal y periodo
CREATE TABLE public.channel_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('linkedin', 'phone', 'email')),
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  goal_type TEXT NOT NULL CHECK (goal_type IN ('leads', 'conversions', 'revenue')),
  target_value DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Historial de cambios de estado para pipeline
CREATE TABLE public.lead_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  changed_by UUID NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
CREATE POLICY "Users can view their own leads" ON public.leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own leads" ON public.leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own leads" ON public.leads FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for lead_notes
CREATE POLICY "Users can view notes on their leads" ON public.lead_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create notes on their leads" ON public.lead_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.lead_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.lead_notes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for channel_goals
CREATE POLICY "Users can view their own goals" ON public.channel_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own goals" ON public.channel_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.channel_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.channel_goals FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for lead_status_history
CREATE POLICY "Users can view their lead history" ON public.lead_status_history FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_status_history.lead_id AND leads.user_id = auth.uid()));
CREATE POLICY "Users can create history for their leads" ON public.lead_status_history FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_status_history.lead_id AND leads.user_id = auth.uid()));

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para registrar cambios de estado
CREATE OR REPLACE FUNCTION public.log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.lead_status_history (lead_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    
    -- Si cambia a contacted, registrar fecha
    IF NEW.status = 'contacted' AND OLD.status = 'new' THEN
      NEW.contacted_at = now();
    END IF;
    
    -- Si cambia a won o lost, registrar fecha de cierre y calcular ciclo
    IF NEW.status IN ('won', 'lost') AND OLD.status NOT IN ('won', 'lost') THEN
      NEW.closed_at = now();
      NEW.sale_cycle_days = EXTRACT(DAY FROM (now() - NEW.created_at));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER log_lead_status_change_trigger
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.log_lead_status_change();

-- Índices para mejor rendimiento
CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_channel ON public.leads(channel);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_leads_next_followup ON public.leads(next_followup_at);
CREATE INDEX idx_lead_notes_lead_id ON public.lead_notes(lead_id);

-- Enable realtime for leads
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;