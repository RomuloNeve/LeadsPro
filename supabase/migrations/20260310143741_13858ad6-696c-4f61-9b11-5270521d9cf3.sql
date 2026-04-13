ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_score integer DEFAULT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS scored_at timestamp with time zone DEFAULT NULL;