
CREATE OR REPLACE FUNCTION public.auto_create_license()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  plan_val text;
  expiry timestamp with time zone;
BEGIN
  plan_val := (SELECT raw_user_meta_data->>'plan' FROM auth.users WHERE id = NEW.user_id);
  
  IF plan_val IS NULL OR plan_val = '' THEN
    plan_val := 'free';
  END IF;

  IF plan_val = 'free' THEN
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
    CASE WHEN plan_val = 'free' THEN 'Teste grátis de 7 dias' ELSE 'Licença criada automaticamente' END
  );

  RETURN NEW;
END;
$function$
