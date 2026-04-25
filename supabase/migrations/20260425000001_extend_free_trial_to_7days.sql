-- Extend free trial: 2 hours → 7 days, 60 credits → 420 credits (60/day × 7)

CREATE OR REPLACE FUNCTION public.activate_free_trial(p_license_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.licenses
  SET expires_at = now() + interval '7 days',
      search_expires_at = now() + interval '7 days',
      updated_at = now()
  WHERE id = p_license_id
    AND plan_type = 'free'
    AND expires_at IS NULL
    AND assigned_to = auth.uid();
END;
$function$;

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
    -- Trial only activates on first sign-in via activate_free_trial RPC
    expiry := NULL;
    credits := 420; -- 60 credits/day × 7 days
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
    CASE WHEN plan_val = 'free' THEN 'Teste grátis 7 dias (60 créditos/dia)' ELSE 'Licença criada automaticamente' END
  );

  RETURN NEW;
END;
$function$;

-- Migrate existing live free trials that still have time left:
-- Extend their window from 2 hours to 7 days from creation, and bump
-- their credit allowance to 420 (only if currently <= 60 — don't shrink).
UPDATE public.licenses
SET expires_at = created_at + interval '7 days',
    search_expires_at = created_at + interval '7 days',
    monthly_credits = GREATEST(monthly_credits, 420),
    updated_at = now()
WHERE plan_type = 'free'
  AND expires_at IS NOT NULL
  AND created_at + interval '7 days' > now();
