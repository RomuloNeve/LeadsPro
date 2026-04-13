
-- Add assigned_to column to licenses (the user who activated the license)
ALTER TABLE public.licenses ADD COLUMN assigned_to UUID;

-- Allow users to read their own assigned license
CREATE POLICY "Users can view their assigned license"
ON public.licenses
FOR SELECT
USING (auth.uid() = assigned_to);

-- Allow users to activate a license (set assigned_to)
CREATE POLICY "Users can activate unassigned license"
ON public.licenses
FOR UPDATE
USING (assigned_to IS NULL)
WITH CHECK (auth.uid() = assigned_to);

-- Allow users to read leads from their own license
CREATE POLICY "Users can view their own leads"
ON public.leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.licenses
    WHERE licenses.id = leads.license_id
    AND licenses.assigned_to = auth.uid()
  )
);
