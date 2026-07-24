DROP FUNCTION IF EXISTS public.bulk_insert_leads(JSONB, UUID);

CREATE OR REPLACE FUNCTION public.bulk_insert_leads(
  p_leads JSONB,
  p_list_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
SET statement_timeout = '120s'
AS $$
DECLARE
  v_lead JSONB;
  v_lead_id UUID;
  v_count INTEGER := 0;
BEGIN
  FOR v_lead IN SELECT * FROM jsonb_array_elements(p_leads)
  LOOP
    INSERT INTO public.leads (
      license_id, category, name, phone, email, instagram, website, linkedin
    ) VALUES (
      (v_lead->>'license_id')::UUID,
      v_lead->>'category',
      v_lead->>'name',
      v_lead->>'phone',
      v_lead->>'email',
      v_lead->>'instagram',
      v_lead->>'website',
      v_lead->>'linkedin'
    )
    RETURNING id INTO v_lead_id;

    INSERT INTO public.lead_list_items (list_id, lead_id)
    VALUES (p_list_id, v_lead_id)
    ON CONFLICT (list_id, lead_id) DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
