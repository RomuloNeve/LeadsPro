
-- Table to track IPs that already used free trial (1 per IP)
CREATE TABLE public.free_trial_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.free_trial_ips ENABLE ROW LEVEL SECURITY;

-- Only edge functions (service role) can insert/read
CREATE POLICY "Service role only" ON public.free_trial_ips
  FOR ALL USING (false);

-- Update auto_create_license to handle 'free' plan with 2 hour expiry
CREATE OR REPLACE FUNCTION public.auto_create_license()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  plan_val text;
  expiry timestamp with time zone;
BEGIN
  plan_val := (SELECT raw_user_meta_data->>'plan' FROM auth.users WHERE id = NEW.user_id);
  
  IF plan_val IS NULL OR plan_val = '' THEN
    plan_val := 'mensal';
  END IF;

  IF plan_val = 'free' THEN
    expiry := now() + interval '2 hours';
  ELSIF plan_val = 'anual' THEN
    expiry := now() + interval '365 days';
  ELSIF plan_val = 'mensal' THEN
    expiry := now() + interval '30 days';
  ELSE
    expiry := NULL;
  END IF;

  INSERT INTO public.licenses (code, assigned_to, is_active, plan_type, expires_at, description)
  VALUES (
    'AUTO-' || substr(gen_random_uuid()::text, 1, 8),
    NEW.user_id,
    true,
    plan_val,
    expiry,
    CASE WHEN plan_val = 'free' THEN 'Teste grátis de 2 horas' ELSE 'Licença criada automaticamente' END
  );

  RETURN NEW;
END;
$$;
