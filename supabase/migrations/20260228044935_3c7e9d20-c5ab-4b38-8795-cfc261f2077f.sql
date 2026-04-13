
-- Add plan type and expiration to licenses
ALTER TABLE public.licenses
ADD COLUMN plan_type TEXT NOT NULL DEFAULT 'lifetime' CHECK (plan_type IN ('lifetime', 'monthly')),
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
