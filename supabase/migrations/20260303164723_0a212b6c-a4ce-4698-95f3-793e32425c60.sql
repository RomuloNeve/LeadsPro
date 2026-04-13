ALTER TABLE public.licenses
DROP CONSTRAINT IF EXISTS licenses_plan_type_check;

ALTER TABLE public.licenses
ADD CONSTRAINT licenses_plan_type_check
CHECK (plan_type IN ('lifetime', 'monthly', 'mensal', 'anual', 'free'));