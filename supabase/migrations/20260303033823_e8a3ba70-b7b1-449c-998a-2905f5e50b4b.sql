
-- Create storage bucket for chatbot files
INSERT INTO storage.buckets (id, name, public) VALUES ('chatbot-files', 'chatbot-files', true);

-- Storage policies
CREATE POLICY "Users can upload chatbot files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chatbot-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view chatbot files"
ON storage.objects FOR SELECT
USING (bucket_id = 'chatbot-files');

CREATE POLICY "Users can delete own chatbot files"
ON storage.objects FOR DELETE
USING (bucket_id = 'chatbot-files' AND auth.uid() IS NOT NULL);

-- Table to track files per chatbot config
CREATE TABLE public.chatbot_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID NOT NULL REFERENCES public.chatbot_configs(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chatbot files"
ON public.chatbot_files FOR SELECT
USING (EXISTS (
  SELECT 1 FROM chatbot_configs cc
  JOIN licenses l ON l.id = cc.license_id
  WHERE cc.id = chatbot_files.config_id AND l.assigned_to = auth.uid()
));

CREATE POLICY "Users can insert own chatbot files"
ON public.chatbot_files FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM chatbot_configs cc
  JOIN licenses l ON l.id = cc.license_id
  WHERE cc.id = chatbot_files.config_id AND l.assigned_to = auth.uid()
));

CREATE POLICY "Users can delete own chatbot files"
ON public.chatbot_files FOR DELETE
USING (EXISTS (
  SELECT 1 FROM chatbot_configs cc
  JOIN licenses l ON l.id = cc.license_id
  WHERE cc.id = chatbot_files.config_id AND l.assigned_to = auth.uid()
));

CREATE POLICY "Admins can do everything with chatbot files"
ON public.chatbot_files FOR ALL
USING (is_admin());
