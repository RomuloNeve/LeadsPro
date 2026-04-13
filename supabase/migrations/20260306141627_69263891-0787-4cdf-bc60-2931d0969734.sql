
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS campaign_type text NOT NULL DEFAULT 'leads',
ADD COLUMN IF NOT EXISTS group_ids text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS group_sent_phones text[] DEFAULT '{}';
