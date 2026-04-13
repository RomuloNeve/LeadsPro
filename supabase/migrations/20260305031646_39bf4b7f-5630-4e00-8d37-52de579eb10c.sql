
DROP POLICY "Admins insert handoffs" ON public.human_handoff_requests;

CREATE POLICY "Users can insert own handoffs" ON public.human_handoff_requests
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM licenses WHERE licenses.id = human_handoff_requests.license_id AND licenses.assigned_to = auth.uid()
  ));
