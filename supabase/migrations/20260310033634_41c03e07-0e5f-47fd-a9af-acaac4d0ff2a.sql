CREATE OR REPLACE FUNCTION public.increment_used_credits(p_license_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.licenses
  SET used_credits = used_credits + p_amount,
      updated_at = now()
  WHERE id = p_license_id;
END;
$$;