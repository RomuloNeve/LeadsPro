-- Capture display_name at signup so admins can see who the user is at a glance
-- (not just email / phone). Backfills existing rows from auth metadata.

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
  );
  RETURN NEW;
END;
$$;

-- Backfill display_name for users who signed up before this column was captured
UPDATE public.profiles p
SET display_name = NULLIF(TRIM(COALESCE(
  u.raw_user_meta_data->>'display_name',
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'name'
)), '')
FROM auth.users u
WHERE p.user_id = u.id
  AND (p.display_name IS NULL OR p.display_name = '')
  AND COALESCE(
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name'
  ) IS NOT NULL;
