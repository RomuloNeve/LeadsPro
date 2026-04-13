
-- Add lead_status column to leads table
ALTER TABLE public.leads ADD COLUMN lead_status text NOT NULL DEFAULT 'novo';

-- Create index for fast filtering by status
CREATE INDEX idx_leads_status ON public.leads (lead_status);
