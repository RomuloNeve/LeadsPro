
-- Add credits columns to licenses table
ALTER TABLE public.licenses 
  ADD COLUMN IF NOT EXISTS monthly_credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS used_credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_credits integer NOT NULL DEFAULT 0;

-- Create credit_transactions table for audit trail
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'monthly_reset', 'search_debit', 'extra_purchase', 'admin_grant'
  amount integer NOT NULL, -- positive = credit, negative = debit
  balance_after integer NOT NULL DEFAULT 0,
  description text,
  payment_id text, -- AbacatePay transaction ID
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for credit_transactions
CREATE POLICY "Users can view own credit transactions" ON public.credit_transactions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.licenses WHERE licenses.id = credit_transactions.license_id AND licenses.assigned_to = auth.uid()
  ));

CREATE POLICY "Admins can do everything with credit transactions" ON public.credit_transactions
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Update existing licenses with credits based on plan_type
-- starter = 300, profissional (mensal) = 1000, scale = 5000, free = 60
UPDATE public.licenses SET monthly_credits = 
  CASE 
    WHEN plan_type = 'free' THEN 60
    WHEN plan_type = 'starter' THEN 300
    WHEN plan_type = 'mensal' THEN 1000
    WHEN plan_type = 'anual' THEN 1000
    WHEN plan_type = 'scale' THEN 5000
    WHEN plan_type = 'lifetime' THEN 1000
    ELSE 0
  END
WHERE monthly_credits = 0;

-- Enable realtime for credit_transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_transactions;
