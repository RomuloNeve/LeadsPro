
-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Admins can manage all leads
CREATE POLICY "Admins can do everything with leads"
ON public.leads
FOR ALL
USING (is_admin());

-- Index for faster lookups by license
CREATE INDEX idx_leads_license_id ON public.leads(license_id);
