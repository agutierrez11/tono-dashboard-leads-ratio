-- Create daily_goals table for manual activity targets
CREATE TABLE public.daily_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  goal_type text NOT NULL, -- 'calls_made', 'calls_connected', 'emails_sent', 'linkedin_contacts'
  target_value integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, goal_type)
);

-- Enable RLS
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own goals"
ON public.daily_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals"
ON public.daily_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
ON public.daily_goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
ON public.daily_goals FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_daily_goals_updated_at
BEFORE UPDATE ON public.daily_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();