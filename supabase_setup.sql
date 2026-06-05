-- ============================================================
-- SQL Schema Setup para Tono Sales Dashboard (Con Autenticación)
-- ============================================================
-- Instrucciones: Copia y ejecuta este script en el SQL Editor
-- de tu proyecto Supabase para configurar la base de datos
-- con RLS seguro (authenticated) y soporte de métricas anónimas.
-- ============================================================

-- 1. Helper: trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Tabla: leads (CRM)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  channel TEXT CHECK (channel IN ('linkedin', 'phone', 'email')) NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT,
  contacted_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  next_followup_at TIMESTAMP WITH TIME ZONE,
  sale_value NUMERIC,
  sale_cycle_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabla: daily_activities (contadores diarios de prospección y outcomes)
CREATE TABLE IF NOT EXISTS public.daily_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  calls_made INTEGER NOT NULL DEFAULT 0,
  calls_connected INTEGER NOT NULL DEFAULT 0,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  linkedin_contacts INTEGER NOT NULL DEFAULT 0,
  meetings_booked INTEGER NOT NULL DEFAULT 0,
  sales_won INTEGER NOT NULL DEFAULT 0,
  revenue_won NUMERIC NOT NULL DEFAULT 0,
  anomaly_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_date)
);

-- 4. Tabla: daily_goals (metas de actividad diaria)
CREATE TABLE IF NOT EXISTS public.daily_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_type TEXT NOT NULL,
  target_value INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, goal_type)
);

-- 5. Tabla: channel_goals (metas mensuales de cierres)
CREATE TABLE IF NOT EXISTS public.channel_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel TEXT NOT NULL DEFAULT 'all',
  goal_type TEXT NOT NULL,
  target_value INTEGER NOT NULL DEFAULT 0,
  period TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Tabla: weekly_notes (bitácora semanal)
CREATE TABLE IF NOT EXISTS public.weekly_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

-- 7. Habilitar RLS en todas las tablas
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_notes ENABLE ROW LEVEL SECURITY;

-- 8. Políticas RLS para rol "authenticated" (por usuario)

-- Leads
DROP POLICY IF EXISTS "leads_select_own" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_own" ON public.leads;
DROP POLICY IF EXISTS "leads_update_own" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_own" ON public.leads;

CREATE POLICY "leads_select_own" ON public.leads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "leads_insert_own" ON public.leads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "leads_update_own" ON public.leads FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "leads_delete_own" ON public.leads FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Daily Activities
DROP POLICY IF EXISTS "activities_select_own" ON public.daily_activities;
DROP POLICY IF EXISTS "activities_insert_own" ON public.daily_activities;
DROP POLICY IF EXISTS "activities_update_own" ON public.daily_activities;
DROP POLICY IF EXISTS "activities_delete_own" ON public.daily_activities;

CREATE POLICY "activities_select_own" ON public.daily_activities FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "activities_insert_own" ON public.daily_activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activities_update_own" ON public.daily_activities FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "activities_delete_own" ON public.daily_activities FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Daily Goals
DROP POLICY IF EXISTS "goals_select_own" ON public.daily_goals;
DROP POLICY IF EXISTS "goals_insert_own" ON public.daily_goals;
DROP POLICY IF EXISTS "goals_update_own" ON public.daily_goals;
DROP POLICY IF EXISTS "goals_delete_own" ON public.daily_goals;

CREATE POLICY "goals_select_own" ON public.daily_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "goals_insert_own" ON public.daily_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_update_own" ON public.daily_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "goals_delete_own" ON public.daily_goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Channel Goals
DROP POLICY IF EXISTS "channel_goals_select_own" ON public.channel_goals;
DROP POLICY IF EXISTS "channel_goals_insert_own" ON public.channel_goals;
DROP POLICY IF EXISTS "channel_goals_update_own" ON public.channel_goals;
DROP POLICY IF EXISTS "channel_goals_delete_own" ON public.channel_goals;

CREATE POLICY "channel_goals_select_own" ON public.channel_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "channel_goals_insert_own" ON public.channel_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "channel_goals_update_own" ON public.channel_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "channel_goals_delete_own" ON public.channel_goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Weekly Notes
DROP POLICY IF EXISTS "notes_select_own" ON public.weekly_notes;
DROP POLICY IF EXISTS "notes_insert_own" ON public.weekly_notes;
DROP POLICY IF EXISTS "notes_update_own" ON public.weekly_notes;
DROP POLICY IF EXISTS "notes_delete_own" ON public.weekly_notes;

CREATE POLICY "notes_select_own" ON public.weekly_notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notes_insert_own" ON public.weekly_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notes_update_own" ON public.weekly_notes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notes_delete_own" ON public.weekly_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 9. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_channel ON public.leads(channel);
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON public.daily_activities(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_channel_goals_user ON public.channel_goals(user_id);

-- 10. Triggers para updated_at automático
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
DROP TRIGGER IF EXISTS update_daily_activities_updated_at ON public.daily_activities;
DROP TRIGGER IF EXISTS update_daily_goals_updated_at ON public.daily_goals;
DROP TRIGGER IF EXISTS update_channel_goals_updated_at ON public.channel_goals;
DROP TRIGGER IF EXISTS update_weekly_notes_updated_at ON public.weekly_notes;

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_activities_updated_at BEFORE UPDATE ON public.daily_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_goals_updated_at BEFORE UPDATE ON public.daily_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_channel_goals_updated_at BEFORE UPDATE ON public.channel_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_weekly_notes_updated_at BEFORE UPDATE ON public.weekly_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
