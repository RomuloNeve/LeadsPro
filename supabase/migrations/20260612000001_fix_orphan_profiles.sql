-- Fix orphan users: create profiles for auth.users that don't have one
-- This handles cases where the handle_new_user trigger failed silently

INSERT INTO public.profiles (user_id, email, is_admin, whatsapp_phone, display_name)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'email', u.email),
  false,
  u.raw_user_meta_data->>'whatsapp_phone',
  NULLIF(TRIM(COALESCE(
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name'
  )), '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.id IS NULL;

-- Make the trigger resilient: use ON CONFLICT to avoid failures on duplicate
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, is_admin, whatsapp_phone, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'email', NEW.email),
    false,
    NEW.raw_user_meta_data->>'whatsapp_phone',
    NULLIF(TRIM(COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    )), '')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    whatsapp_phone = COALESCE(EXCLUDED.whatsapp_phone, profiles.whatsapp_phone),
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name);
  RETURN NEW;
END;
$$;
