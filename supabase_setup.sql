-- ============================================================
-- SQL Schema Setup para Tono Sales Dashboard (Sin Login)
-- ============================================================
-- Instrucciones: Copia y ejecuta este script en el SQL Editor
-- de tu proyecto Supabase. Configura todo para uso de un solo
-- usuario sin pantalla de login.
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
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
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

-- 3. Tabla: daily_activities (contadores diarios)
CREATE TABLE IF NOT EXISTS public.daily_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  calls_made INTEGER NOT NULL DEFAULT 0,
  calls_connected INTEGER NOT NULL DEFAULT 0,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  linkedin_contacts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_date)
);

-- 4. Tabla: daily_goals (metas de actividad)
CREATE TABLE IF NOT EXISTS public.daily_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  goal_type TEXT NOT NULL,
  target_value INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, goal_type)
);

-- 5. Tabla: weekly_notes (bitácora semanal)
CREATE TABLE IF NOT EXISTS public.weekly_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  week_start_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

-- 6. Habilitar RLS en todas las tablas
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_notes ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS para rol "anon" (sin login)
-- Permiten acceso COMPLETO al rol anon filtrado al usuario estático

-- Leads
DROP POLICY IF EXISTS "anon_leads_select" ON public.leads;
DROP POLICY IF EXISTS "anon_leads_insert" ON public.leads;
DROP POLICY IF EXISTS "anon_leads_update" ON public.leads;
DROP POLICY IF EXISTS "anon_leads_delete" ON public.leads;

CREATE POLICY "anon_leads_select" ON public.leads FOR SELECT TO anon USING (user_id = '00000000-0000-0000-0000-000000000001');
CREATE POLICY "anon_leads_insert" ON public.leads FOR INSERT TO anon WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');
CREATE POLICY "anon_leads_update" ON public.leads FOR UPDATE TO anon USING (user_id = '00000000-0000-0000-0000-000000000001');
CREATE POLICY "anon_leads_delete" ON public.leads FOR DELETE TO anon USING (user_id = '00000000-0000-0000-0000-000000000001');

-- Daily Activities
DROP POLICY IF EXISTS "anon_activities_select" ON public.daily_activities;
DROP POLICY IF EXISTS "anon_activities_insert" ON public.daily_activities;
DROP POLICY IF EXISTS "anon_activities_update" ON public.daily_activities;
DROP POLICY IF EXISTS "anon_activities_delete" ON public.daily_activities;

CREATE POLICY "anon_activities_select" ON public.daily_activities FOR SELECT TO anon USING (user_id = '00000000-0000-0000-0000-000000000001');
CREATE POLICY "anon_activities_insert" ON public.daily_activities FOR INSERT TO anon WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');
CREATE POLICY "anon_activities_update" ON public.daily_activities FOR UPDATE TO anon USING (user_id = '00000000-0000-0000-0000-000000000001');
CREATE POLICY "anon_activities_delete" ON public.daily_activities FOR DELETE TO anon USING (user_id = '00000000-0000-0000-0000-000000000001');

-- Daily Goals
DROP POLICY IF EXISTS "anon_goals_select" ON public.daily_goals;
DROP POLICY IF EXISTS "anon_goals_insert" ON public.daily_goals;
DROP POLICY IF EXISTS "anon_goals_update" ON public.daily_goals;
DROP POLICY IF EXISTS "anon_goals_delete" ON public.daily_goals;

CREATE POLICY "anon_goals_select" ON public.daily_goals FOR SELECT TO anon USING (user_id = '00000000-0000-0000-0000-000000000001');
CREATE POLICY "anon_goals_insert" ON public.daily_goals FOR INSERT TO anon WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');
CREATE POLICY "anon_goals_update" ON public.daily_goals FOR UPDATE TO anon USING (user_id = '00000000-0000-0000-0000-000000000001');
CREATE POLICY "anon_goals_delete" ON public.daily_goals FOR DELETE TO anon USING (user_id = '00000000-0000-0000-0000-000000000001');

-- Weekly Notes
DROP POLICY IF EXISTS "anon_notes_select" ON public.weekly_notes;
DROP POLICY IF EXISTS "anon_notes_insert" ON public.weekly_notes;
DROP POLICY IF EXISTS "anon_notes_update" ON public.weekly_notes;
DROP POLICY IF EXISTS "anon_notes_delete" ON public.weekly_notes;

CREATE POLICY "anon_notes_select" ON public.weekly_notes FOR SELECT TO anon USING (user_id = '00000000-0000-0000-0000-000000000001');
CREATE POLICY "anon_notes_insert" ON public.weekly_notes FOR INSERT TO anon WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');
CREATE POLICY "anon_notes_update" ON public.weekly_notes FOR UPDATE TO anon USING (user_id = '00000000-0000-0000-0000-000000000001');
CREATE POLICY "anon_notes_delete" ON public.weekly_notes FOR DELETE TO anon USING (user_id = '00000000-0000-0000-0000-000000000001');

-- 8. Triggers para updated_at automático
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
DROP TRIGGER IF EXISTS update_daily_activities_updated_at ON public.daily_activities;
DROP TRIGGER IF EXISTS update_daily_goals_updated_at ON public.daily_goals;
DROP TRIGGER IF EXISTS update_weekly_notes_updated_at ON public.weekly_notes;

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_activities_updated_at BEFORE UPDATE ON public.daily_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_goals_updated_at BEFORE UPDATE ON public.daily_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_weekly_notes_updated_at BEFORE UPDATE ON public.weekly_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
