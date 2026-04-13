
CREATE POLICY "Users can delete their own leads"
ON public.leads
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.licenses
    WHERE licenses.id = leads.license_id
    AND licenses.assigned_to = auth.uid()
  )
);
