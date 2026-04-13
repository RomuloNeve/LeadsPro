
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS search_expires_at timestamp with time zone;

CREATE OR REPLACE FUNCTION public.activate_free_trial(p_license_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.licenses
  SET expires_at = now() + interval '7 days',
      search_expires_at = now() + interval '2 hours',
      updated_at = now()
  WHERE id = p_license_id
    AND plan_type = 'free'
    AND expires_at IS NULL
    AND assigned_to = auth.uid();
END;
$function$;
