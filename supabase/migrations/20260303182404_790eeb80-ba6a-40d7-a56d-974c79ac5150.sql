
-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  read_time TEXT NOT NULL DEFAULT '7 min',
  hero_image_url TEXT,
  meta_description TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public read access (blog is public)
CREATE POLICY "Blog posts are publicly readable"
ON public.blog_posts
FOR SELECT
USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage blog posts"
ON public.blog_posts
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Index for slug lookups and ordering
CREATE INDEX idx_blog_posts_slug ON public.blog_posts (slug);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts (published_at DESC);
