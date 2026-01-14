-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;

DROP POLICY IF EXISTS "Users can view their own notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Users can create notes for their leads" ON public.lead_notes;

DROP POLICY IF EXISTS "Users can view their own goals" ON public.channel_goals;
DROP POLICY IF EXISTS "Users can create their own goals" ON public.channel_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.channel_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.channel_goals;

DROP POLICY IF EXISTS "Users can view their own history" ON public.lead_status_history;

-- Create new RLS policies that allow anonymous users (authenticated includes anon)
CREATE POLICY "Users can view their own leads" 
ON public.leads FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leads" 
ON public.leads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" 
ON public.leads FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads" 
ON public.leads FOR DELETE 
USING (auth.uid() = user_id);

-- Lead notes policies
CREATE POLICY "Users can view their own notes" 
ON public.lead_notes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create notes" 
ON public.lead_notes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Channel goals policies
CREATE POLICY "Users can view their own goals" 
ON public.channel_goals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals" 
ON public.channel_goals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.channel_goals FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.channel_goals FOR DELETE 
USING (auth.uid() = user_id);

-- Lead status history policies
CREATE POLICY "Users can view their own history" 
ON public.lead_status_history FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = lead_status_history.lead_id 
  AND leads.user_id = auth.uid()
));