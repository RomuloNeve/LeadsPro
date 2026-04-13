
-- Allow users to update their own leads
CREATE POLICY "Users can update their own leads"
ON public.leads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.licenses
    WHERE licenses.id = leads.license_id
    AND licenses.assigned_to = auth.uid()
  )
);
