
-- Add whatsapp_phone to profiles
ALTER TABLE public.profiles ADD COLUMN whatsapp_phone text;

-- Create campaigns table
CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id uuid NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  name text NOT NULL,
  message_template text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  target_filter jsonb,
  total_leads int NOT NULL DEFAULT 0,
  sent_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own campaigns"
ON public.campaigns FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.licenses
  WHERE licenses.id = campaigns.license_id AND licenses.assigned_to = auth.uid()
));

CREATE POLICY "Users can create their own campaigns"
ON public.campaigns FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.licenses
  WHERE licenses.id = campaigns.license_id AND licenses.assigned_to = auth.uid()
));

CREATE POLICY "Users can update their own campaigns"
ON public.campaigns FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.licenses
  WHERE licenses.id = campaigns.license_id AND licenses.assigned_to = auth.uid()
));

CREATE POLICY "Users can delete their own campaigns"
ON public.campaigns FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.licenses
  WHERE licenses.id = campaigns.license_id AND licenses.assigned_to = auth.uid()
));

CREATE POLICY "Admins can do everything with campaigns"
ON public.campaigns FOR ALL
USING (public.is_admin());

CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create followup_sequences table
CREATE TABLE public.followup_sequences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id uuid NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.followup_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sequences"
ON public.followup_sequences FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.licenses
  WHERE licenses.id = followup_sequences.license_id AND licenses.assigned_to = auth.uid()
));

CREATE POLICY "Users can create their own sequences"
ON public.followup_sequences FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.licenses
  WHERE licenses.id = followup_sequences.license_id AND licenses.assigned_to = auth.uid()
));

CREATE POLICY "Users can update their own sequences"
ON public.followup_sequences FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.licenses
  WHERE licenses.id = followup_sequences.license_id AND licenses.assigned_to = auth.uid()
));

CREATE POLICY "Users can delete their own sequences"
ON public.followup_sequences FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.licenses
  WHERE licenses.id = followup_sequences.license_id AND licenses.assigned_to = auth.uid()
));

CREATE POLICY "Admins can do everything with sequences"
ON public.followup_sequences FOR ALL
USING (public.is_admin());

-- Create followup_steps table
CREATE TABLE public.followup_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id uuid NOT NULL REFERENCES public.followup_sequences(id) ON DELETE CASCADE,
  day_number int NOT NULL,
  message_template text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.followup_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own steps"
ON public.followup_steps FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.followup_sequences fs
  JOIN public.licenses l ON l.id = fs.license_id
  WHERE fs.id = followup_steps.sequence_id AND l.assigned_to = auth.uid()
));

CREATE POLICY "Users can create their own steps"
ON public.followup_steps FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.followup_sequences fs
  JOIN public.licenses l ON l.id = fs.license_id
  WHERE fs.id = followup_steps.sequence_id AND l.assigned_to = auth.uid()
));

CREATE POLICY "Users can update their own steps"
ON public.followup_steps FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.followup_sequences fs
  JOIN public.licenses l ON l.id = fs.license_id
  WHERE fs.id = followup_steps.sequence_id AND l.assigned_to = auth.uid()
));

CREATE POLICY "Users can delete their own steps"
ON public.followup_steps FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.followup_sequences fs
  JOIN public.licenses l ON l.id = fs.license_id
  WHERE fs.id = followup_steps.sequence_id AND l.assigned_to = auth.uid()
));

CREATE POLICY "Admins can do everything with steps"
ON public.followup_steps FOR ALL
USING (public.is_admin());

-- Create followup_logs table
CREATE TABLE public.followup_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step_id uuid NOT NULL REFERENCES public.followup_steps(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.followup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logs"
ON public.followup_logs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.followup_steps fst
  JOIN public.followup_sequences fs ON fs.id = fst.sequence_id
  JOIN public.licenses l ON l.id = fs.license_id
  WHERE fst.id = followup_logs.step_id AND l.assigned_to = auth.uid()
));

CREATE POLICY "Users can create their own logs"
ON public.followup_logs FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.followup_steps fst
  JOIN public.followup_sequences fs ON fs.id = fst.sequence_id
  JOIN public.licenses l ON l.id = fs.license_id
  WHERE fst.id = followup_logs.step_id AND l.assigned_to = auth.uid()
));

CREATE POLICY "Users can update their own logs"
ON public.followup_logs FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.followup_steps fst
  JOIN public.followup_sequences fs ON fs.id = fst.sequence_id
  JOIN public.licenses l ON l.id = fs.license_id
  WHERE fst.id = followup_logs.step_id AND l.assigned_to = auth.uid()
));

CREATE POLICY "Admins can do everything with logs"
ON public.followup_logs FOR ALL
USING (public.is_admin());
