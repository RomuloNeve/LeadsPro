
CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  starter_link text,
  profissional_link text,
  enterprise_link text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Public can read active affiliates (needed for landing page ?ref= lookup)
CREATE POLICY "Anyone can read active affiliates"
ON public.affiliates FOR SELECT
TO public
USING (is_active = true);

-- Authenticated users can insert their own affiliate record
CREATE POLICY "Users can insert own affiliate"
ON public.affiliates FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own affiliate record
CREATE POLICY "Users can update own affiliate"
ON public.affiliates FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins full access affiliates"
ON public.affiliates FOR ALL
TO authenticated
USING (is_admin());
