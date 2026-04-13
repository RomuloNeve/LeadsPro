
CREATE TABLE public.campaign_sent_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent',
  error_reason text,
  UNIQUE(campaign_id, lead_id)
);

ALTER TABLE public.campaign_sent_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaign sent leads" ON public.campaign_sent_leads
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM campaigns c JOIN licenses l ON l.id = c.license_id
    WHERE c.id = campaign_sent_leads.campaign_id AND l.assigned_to = auth.uid()
  ));

CREATE POLICY "Admins full access campaign_sent_leads" ON public.campaign_sent_leads
  FOR ALL TO authenticated
  USING (is_admin());

-- Add status 'partial' for partially sent campaigns
-- Update campaigns to track progress better
