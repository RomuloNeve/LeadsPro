
-- Table to store WhatsApp instances per user
CREATE TABLE public.whatsapp_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  instance_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  phone_connected TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own instance
CREATE POLICY "Users can view own instance"
  ON public.whatsapp_instances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own instance"
  ON public.whatsapp_instances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own instance"
  ON public.whatsapp_instances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own instance"
  ON public.whatsapp_instances FOR DELETE
  USING (auth.uid() = user_id);

-- Admin access
CREATE POLICY "Admins full access whatsapp_instances"
  ON public.whatsapp_instances FOR ALL
  USING (is_admin());

-- Auto-update updated_at
CREATE TRIGGER update_whatsapp_instances_updated_at
  BEFORE UPDATE ON public.whatsapp_instances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
