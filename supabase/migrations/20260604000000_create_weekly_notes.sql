-- Create weekly_notes table
CREATE TABLE IF NOT EXISTS public.weekly_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

-- Enable RLS
ALTER TABLE public.weekly_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own weekly notes" ON public.weekly_notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own weekly notes" ON public.weekly_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own weekly notes" ON public.weekly_notes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own weekly notes" ON public.weekly_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Setup trigger
CREATE TRIGGER update_weekly_notes_updated_at BEFORE UPDATE ON public.weekly_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
