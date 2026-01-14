-- Drop existing policies on leads table
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;

-- Create new policies that allow demo mode (when user_id matches DEMO_USER_ID) OR authenticated users
CREATE POLICY "Allow lead access"
ON public.leads
FOR SELECT
USING (
  user_id = '00000000-0000-0000-0000-000000000001'::uuid 
  OR auth.uid() = user_id
);

CREATE POLICY "Allow lead insert"
ON public.leads
FOR INSERT
WITH CHECK (
  user_id = '00000000-0000-0000-0000-000000000001'::uuid 
  OR auth.uid() = user_id
);

CREATE POLICY "Allow lead update"
ON public.leads
FOR UPDATE
USING (
  user_id = '00000000-0000-0000-0000-000000000001'::uuid 
  OR auth.uid() = user_id
);

CREATE POLICY "Allow lead delete"
ON public.leads
FOR DELETE
USING (
  user_id = '00000000-0000-0000-0000-000000000001'::uuid 
  OR auth.uid() = user_id
);