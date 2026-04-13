
-- Create a trigger function that auto-creates a license when a new profile is created
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
  -- Get plan from user metadata
  plan_val := (SELECT raw_user_meta_data->>'plan' FROM auth.users WHERE id = NEW.user_id);
  
  -- Default to 'mensal' if no plan specified
  IF plan_val IS NULL OR plan_val = '' THEN
    plan_val := 'mensal';
  END IF;

  -- Calculate expiry: mensal = 30 days, anual = 365 days, lifetime = null
  IF plan_val = 'anual' THEN
    expiry := now() + interval '365 days';
  ELSIF plan_val = 'mensal' THEN
    expiry := now() + interval '30 days';
  ELSE
    expiry := NULL;
  END IF;

  -- Create license for the new user
  INSERT INTO public.licenses (code, assigned_to, is_active, plan_type, expires_at, description)
  VALUES (
    'AUTO-' || substr(gen_random_uuid()::text, 1, 8),
    NEW.user_id,
    true,
    CASE WHEN plan_val = 'anual' THEN 'anual' WHEN plan_val = 'mensal' THEN 'mensal' ELSE 'lifetime' END,
    expiry,
    'Licença criada automaticamente'
  );

  RETURN NEW;
END;
$$;

-- Create the trigger on profiles table (fires after profile is created by handle_new_user)
CREATE TRIGGER create_license_on_signup
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_license();
