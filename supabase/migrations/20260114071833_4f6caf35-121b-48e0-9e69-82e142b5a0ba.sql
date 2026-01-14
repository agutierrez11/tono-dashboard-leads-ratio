-- Remove demo mode policies and enforce proper authentication
DROP POLICY IF EXISTS "Allow lead access" ON public.leads;
DROP POLICY IF EXISTS "Allow lead insert" ON public.leads;
DROP POLICY IF EXISTS "Allow lead update" ON public.leads;
DROP POLICY IF EXISTS "Allow lead delete" ON public.leads;

-- Create secure policies that only allow authenticated users to access their own data
CREATE POLICY "Users can view their own leads"
ON public.leads
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
ON public.leads
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);