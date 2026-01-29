-- Tabla para actividades diarias de un click
CREATE TABLE public.daily_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  calls_made INTEGER NOT NULL DEFAULT 0,
  calls_connected INTEGER NOT NULL DEFAULT 0,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  linkedin_contacts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_date)
);

-- Enable RLS
ALTER TABLE public.daily_activities ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own activities"
ON public.daily_activities FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activities"
ON public.daily_activities FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
ON public.daily_activities FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_daily_activities_updated_at
BEFORE UPDATE ON public.daily_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Agregar columna de meta mensual a channel_goals para metas generales
-- Usaremos la tabla existente channel_goals para metas de deals