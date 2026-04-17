-- Fix free trial duration: was 7 days, should be 2 hours
CREATE OR REPLACE FUNCTION public.activate_free_trial(p_license_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.licenses
  SET expires_at = now() + interval '2 hours',
      search_expires_at = now() + interval '2 hours',
      updated_at = now()
  WHERE id = p_license_id
    AND plan_type = 'free'
    AND expires_at IS NULL
    AND assigned_to = auth.uid();
END;
$function$;

-- Update auto_create_license description for free plan
CREATE OR REPLACE FUNCTION public.auto_create_license()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  plan_val text;
  expiry timestamp with time zone;
  credits integer;
BEGIN
  plan_val := (SELECT raw_user_meta_data->>'plan' FROM auth.users WHERE id = NEW.user_id);

  IF plan_val IS NULL OR plan_val = '' THEN
    plan_val := 'free';
  END IF;

  -- Affiliates don't get a regular license with credits
  IF plan_val = 'afiliado' THEN
    INSERT INTO public.licenses (code, assigned_to, is_active, plan_type, expires_at, monthly_credits, description)
    VALUES (
      'AFF-' || substr(gen_random_uuid()::text, 1, 8),
      NEW.user_id,
      true,
      'afiliado',
      NULL,
      0,
      'Conta de afiliado'
    );
    RETURN NEW;
  END IF;

  IF plan_val = 'free' THEN
    expiry := NULL;
    credits := 60;
  ELSIF plan_val = 'starter' THEN
    expiry := now() + interval '30 days';
    credits := 300;
  ELSIF plan_val = 'profissional' OR plan_val = 'mensal' THEN
    plan_val := 'profissional';
    expiry := now() + interval '30 days';
    credits := 1000;
  ELSIF plan_val = 'enterprise' OR plan_val = 'anual' THEN
    plan_val := 'enterprise';
    expiry := now() + interval '365 days';
    credits := 5000;
  ELSE
    expiry := NULL;
    credits := 1000;
  END IF;

  INSERT INTO public.licenses (code, assigned_to, is_active, plan_type, expires_at, monthly_credits, description)
  VALUES (
    'AUTO-' || substr(gen_random_uuid()::text, 1, 8),
    NEW.user_id,
    true,
    plan_val,
    expiry,
    credits,
    CASE WHEN plan_val = 'free' THEN 'Teste grátis de 2 horas' ELSE 'Licença criada automaticamente' END
  );

  RETURN NEW;
END;
$function$;

-- Fix existing active free trials that were set to 7 days:
-- If they still have more than 2 hours left, cap them to 2 hours from creation.
UPDATE public.licenses
SET expires_at = created_at + interval '2 hours'
WHERE plan_type = 'free'
  AND expires_at IS NOT NULL
  AND expires_at > created_at + interval '2 hours';
