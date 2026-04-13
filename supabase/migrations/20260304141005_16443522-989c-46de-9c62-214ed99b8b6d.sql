INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read blog images" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'blog-images');

CREATE POLICY "Service role insert blog images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'blog-images');