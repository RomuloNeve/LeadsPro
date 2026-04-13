
CREATE TABLE public.human_handoff_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  lead_phone text NOT NULL,
  lead_name text,
  instance_name text NOT NULL,
  remote_jid text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  last_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.human_handoff_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own handoffs" ON public.human_handoff_requests
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM licenses WHERE licenses.id = human_handoff_requests.license_id AND licenses.assigned_to = auth.uid()
  ));

CREATE POLICY "Users can update own handoffs" ON public.human_handoff_requests
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM licenses WHERE licenses.id = human_handoff_requests.license_id AND licenses.assigned_to = auth.uid()
  ));

CREATE POLICY "Users can delete own handoffs" ON public.human_handoff_requests
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM licenses WHERE licenses.id = human_handoff_requests.license_id AND licenses.assigned_to = auth.uid()
  ));

CREATE POLICY "Admins insert handoffs" ON public.human_handoff_requests
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can do everything with handoffs" ON public.human_handoff_requests
  FOR ALL TO authenticated
  USING (is_admin());

ALTER PUBLICATION supabase_realtime ADD TABLE public.human_handoff_requests;
