
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS page_type text DEFAULT 'satellite',
ADD COLUMN IF NOT EXISTS parent_slug text,
ADD COLUMN IF NOT EXISTS cluster text,
ADD COLUMN IF NOT EXISTS keywords text[],
ADD COLUMN IF NOT EXISTS word_count integer DEFAULT 0;
