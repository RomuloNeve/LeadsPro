
-- Update auto_create_license: for 'free' plan, do NOT set expires_at yet
-- The 2-hour timer starts only when user first enters the dashboard
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
    -- Don't set expiry yet; it starts when user enters dashboard
    expiry := NULL;
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

-- Function to activate the free trial timer (called from dashboard)
CREATE OR REPLACE FUNCTION public.activate_free_trial(p_license_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.licenses
  SET expires_at = now() + interval '2 hours',
      updated_at = now()
  WHERE id = p_license_id
    AND plan_type = 'free'
    AND expires_at IS NULL
    AND assigned_to = auth.uid();
END;
$$;
