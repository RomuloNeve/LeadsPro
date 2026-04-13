CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, is_admin, whatsapp_phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'email', NEW.email),
    false,
    NEW.raw_user_meta_data->>'whatsapp_phone'
  );
  RETURN NEW;
END;
$$;