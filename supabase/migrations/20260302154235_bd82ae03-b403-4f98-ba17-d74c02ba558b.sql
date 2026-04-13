
-- Add image_url column to campaigns
ALTER TABLE public.campaigns ADD COLUMN image_url text;

-- Create storage bucket for campaign images
INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-images', 'campaign-images', true);

-- Storage policies
CREATE POLICY "Anyone can view campaign images"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-images');

CREATE POLICY "Authenticated users can upload campaign images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'campaign-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own campaign images"
ON storage.objects FOR DELETE
USING (bucket_id = 'campaign-images' AND auth.uid()::text = (storage.foldername(name))[1]);
