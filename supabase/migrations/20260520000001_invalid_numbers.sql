-- Tabela para lista negra de números inválidos no WhatsApp
-- Quando o WhatsApp retorna "exists": false para um número, ele é adicionado aqui
-- para nunca mais ser tentado em outras campanhas do mesmo usuário.

CREATE TABLE IF NOT EXISTS public.invalid_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  phone TEXT NOT NULL,
  last_campaign_id UUID,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  occurrences INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_invalid_numbers_user_id ON public.invalid_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_invalid_numbers_phone ON public.invalid_numbers(phone);

-- RLS: usuário só vê seus próprios números inválidos
ALTER TABLE public.invalid_numbers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own invalid numbers" ON public.invalid_numbers;
CREATE POLICY "Users can view their own invalid numbers"
  ON public.invalid_numbers FOR SELECT
  USING (auth.uid() = user_id);

-- Service role bypassa RLS para inserções/updates das edge functions
