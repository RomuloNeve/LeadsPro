
-- Add is_duplicate flag to leads
ALTER TABLE public.leads ADD COLUMN is_duplicate boolean NOT NULL DEFAULT false;

-- Create trigger function to detect duplicates on insert
CREATE OR REPLACE FUNCTION public.check_duplicate_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
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
$$;

-- Create trigger
CREATE TRIGGER check_lead_duplicate
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.check_duplicate_lead();
