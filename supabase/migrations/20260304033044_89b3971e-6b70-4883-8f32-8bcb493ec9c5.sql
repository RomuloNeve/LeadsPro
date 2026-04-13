CREATE OR REPLACE FUNCTION public.check_duplicate_lead()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Skip duplicate check for Widget leads
  IF NEW.category IS NOT NULL AND lower(trim(NEW.category)) = 'widget' THEN
    RETURN NEW;
  END IF;

  -- Check if a lead with same phone already exists for this license
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    IF EXISTS (
      SELECT 1 FROM public.leads
      WHERE license_id = NEW.license_id
        AND phone = NEW.phone
        AND id != NEW.id
    ) THEN
      NEW.is_duplicate := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;