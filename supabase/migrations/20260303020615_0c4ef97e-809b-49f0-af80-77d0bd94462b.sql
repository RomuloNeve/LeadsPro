
-- Table to store chatbot configurations per user
CREATE TABLE public.chatbot_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Meu Chatbot',
  system_prompt text NOT NULL DEFAULT 'Você é um assistente de vendas profissional. Seu objetivo é qualificar leads, responder dúvidas sobre produtos/serviços, agendar reuniões e conduzir o lead até a venda. Seja cordial, objetivo e persuasivo.',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chatbot configs" ON public.chatbot_configs FOR SELECT
  USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = chatbot_configs.license_id AND licenses.assigned_to = auth.uid()));

CREATE POLICY "Users can create own chatbot configs" ON public.chatbot_configs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = chatbot_configs.license_id AND licenses.assigned_to = auth.uid()));

CREATE POLICY "Users can update own chatbot configs" ON public.chatbot_configs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = chatbot_configs.license_id AND licenses.assigned_to = auth.uid()));

CREATE POLICY "Users can delete own chatbot configs" ON public.chatbot_configs FOR DELETE
  USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = chatbot_configs.license_id AND licenses.assigned_to = auth.uid()));

CREATE POLICY "Admins can do everything with chatbot configs" ON public.chatbot_configs FOR ALL
  USING (is_admin());

-- Table to track which leads have the chatbot active
CREATE TABLE public.chatbot_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid NOT NULL REFERENCES public.chatbot_configs(id) ON DELETE CASCADE,
  lead_phone text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  messages_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(config_id, lead_phone)
);

ALTER TABLE public.chatbot_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chatbot leads" ON public.chatbot_leads FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chatbot_configs cc 
    JOIN licenses l ON l.id = cc.license_id 
    WHERE cc.id = chatbot_leads.config_id AND l.assigned_to = auth.uid()
  ));

CREATE POLICY "Users can create own chatbot leads" ON public.chatbot_leads FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM chatbot_configs cc 
    JOIN licenses l ON l.id = cc.license_id 
    WHERE cc.id = chatbot_leads.config_id AND l.assigned_to = auth.uid()
  ));

CREATE POLICY "Users can update own chatbot leads" ON public.chatbot_leads FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM chatbot_configs cc 
    JOIN licenses l ON l.id = cc.license_id 
    WHERE cc.id = chatbot_leads.config_id AND l.assigned_to = auth.uid()
  ));

CREATE POLICY "Users can delete own chatbot leads" ON public.chatbot_leads FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM chatbot_configs cc 
    JOIN licenses l ON l.id = cc.license_id 
    WHERE cc.id = chatbot_leads.config_id AND l.assigned_to = auth.uid()
  ));

CREATE POLICY "Admins can do everything with chatbot leads" ON public.chatbot_leads FOR ALL
  USING (is_admin());

-- Triggers for updated_at
CREATE TRIGGER update_chatbot_configs_updated_at BEFORE UPDATE ON public.chatbot_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chatbot_leads_updated_at BEFORE UPDATE ON public.chatbot_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
