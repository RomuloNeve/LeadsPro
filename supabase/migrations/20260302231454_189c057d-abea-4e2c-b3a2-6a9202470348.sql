
-- Create email_campaigns table
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id UUID NOT NULL REFERENCES public.licenses(id),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category_filter TEXT DEFAULT 'all',
  total_leads INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email campaigns"
ON public.email_campaigns FOR SELECT
USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = email_campaigns.license_id AND licenses.assigned_to = auth.uid()));

CREATE POLICY "Users can create their own email campaigns"
ON public.email_campaigns FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = email_campaigns.license_id AND licenses.assigned_to = auth.uid()));

CREATE POLICY "Users can update their own email campaigns"
ON public.email_campaigns FOR UPDATE
USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = email_campaigns.license_id AND licenses.assigned_to = auth.uid()));

CREATE POLICY "Users can delete their own email campaigns"
ON public.email_campaigns FOR DELETE
USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = email_campaigns.license_id AND licenses.assigned_to = auth.uid()));

CREATE POLICY "Admins can do everything with email campaigns"
ON public.email_campaigns FOR ALL
USING (is_admin());

CREATE TRIGGER update_email_campaigns_updated_at
BEFORE UPDATE ON public.email_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
