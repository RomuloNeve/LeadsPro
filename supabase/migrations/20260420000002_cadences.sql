-- Multi-channel cadences: define a sequence of WhatsApp/Email touches
-- per lead, with delays, send windows, and auto-stop on reply / status change.

-- 1) The template of a cadence (name, stop conditions)
CREATE TABLE IF NOT EXISTS public.cadences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  stop_on_reply boolean NOT NULL DEFAULT true,
  stop_on_status text[] NOT NULL DEFAULT ARRAY['ganho','perdido']::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cadences_license ON public.cadences(license_id);

-- 2) Ordered steps of a cadence
CREATE TABLE IF NOT EXISTS public.cadence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cadence_id uuid NOT NULL REFERENCES public.cadences(id) ON DELETE CASCADE,
  step_order int NOT NULL,
  channel text NOT NULL CHECK (channel IN ('whatsapp','email')),
  delay_hours int NOT NULL DEFAULT 24 CHECK (delay_hours >= 0 AND delay_hours <= 720),
  subject text,                                 -- only for email
  message text NOT NULL,
  send_window_start time NOT NULL DEFAULT '09:00',
  send_window_end time NOT NULL DEFAULT '18:00',
  skip_weekends boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cadence_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_cadence_steps_cadence ON public.cadence_steps(cadence_id, step_order);

-- 3) A lead enrolled in a cadence — this is what the cron ticks through
CREATE TABLE IF NOT EXISTS public.cadence_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cadence_id uuid NOT NULL REFERENCES public.cadences(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  license_id uuid NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  current_step int NOT NULL DEFAULT 0,          -- index of the NEXT step to execute
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paused','completed','replied','stopped','failed')),
  next_run_at timestamptz NOT NULL DEFAULT now(),
  last_step_at timestamptz,
  last_error text,
  paused_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cadence_id, lead_id)
);

-- The index the cron uses: "give me everything due"
CREATE INDEX IF NOT EXISTS idx_cadence_enrollments_due
  ON public.cadence_enrollments (status, next_run_at)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_cadence_enrollments_lead ON public.cadence_enrollments(lead_id);

-- 4) Per-step execution log, handy for the funnel dashboard
CREATE TABLE IF NOT EXISTS public.cadence_step_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.cadence_enrollments(id) ON DELETE CASCADE,
  step_id uuid REFERENCES public.cadence_steps(id) ON DELETE SET NULL,
  channel text,
  status text NOT NULL,                         -- 'sent' | 'error' | 'skipped_reply' | 'skipped_status'
  error_message text,
  executed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cadence_step_logs_enrollment ON public.cadence_step_logs(enrollment_id);

-- RLS
ALTER TABLE public.cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadence_step_logs ENABLE ROW LEVEL SECURITY;

-- Helper: user owns a license
-- (we scope by license_id because that's how leads/campaigns are scoped already)

-- cadences
CREATE POLICY "cadences_select_own" ON public.cadences
  FOR SELECT USING (
    license_id IN (SELECT id FROM public.licenses WHERE assigned_to = auth.uid())
  );
CREATE POLICY "cadences_insert_own" ON public.cadences
  FOR INSERT WITH CHECK (
    license_id IN (SELECT id FROM public.licenses WHERE assigned_to = auth.uid())
    AND created_by = auth.uid()
  );
CREATE POLICY "cadences_update_own" ON public.cadences
  FOR UPDATE USING (
    license_id IN (SELECT id FROM public.licenses WHERE assigned_to = auth.uid())
  );
CREATE POLICY "cadences_delete_own" ON public.cadences
  FOR DELETE USING (
    license_id IN (SELECT id FROM public.licenses WHERE assigned_to = auth.uid())
  );

-- cadence_steps — inherit from parent cadence
CREATE POLICY "cadence_steps_select_own" ON public.cadence_steps
  FOR SELECT USING (
    cadence_id IN (
      SELECT id FROM public.cadences
      WHERE license_id IN (SELECT id FROM public.licenses WHERE assigned_to = auth.uid())
    )
  );
CREATE POLICY "cadence_steps_write_own" ON public.cadence_steps
  FOR ALL USING (
    cadence_id IN (
      SELECT id FROM public.cadences
      WHERE license_id IN (SELECT id FROM public.licenses WHERE assigned_to = auth.uid())
    )
  );

-- cadence_enrollments
CREATE POLICY "cadence_enrollments_select_own" ON public.cadence_enrollments
  FOR SELECT USING (
    license_id IN (SELECT id FROM public.licenses WHERE assigned_to = auth.uid())
  );
CREATE POLICY "cadence_enrollments_write_own" ON public.cadence_enrollments
  FOR ALL USING (
    license_id IN (SELECT id FROM public.licenses WHERE assigned_to = auth.uid())
  );

-- cadence_step_logs
CREATE POLICY "cadence_step_logs_select_own" ON public.cadence_step_logs
  FOR SELECT USING (
    enrollment_id IN (
      SELECT id FROM public.cadence_enrollments
      WHERE license_id IN (SELECT id FROM public.licenses WHERE assigned_to = auth.uid())
    )
  );

-- Updated-at trigger for cadences / enrollments
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_cadences_updated_at ON public.cadences;
CREATE TRIGGER trg_cadences_updated_at BEFORE UPDATE ON public.cadences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_cadence_enrollments_updated_at ON public.cadence_enrollments;
CREATE TRIGGER trg_cadence_enrollments_updated_at BEFORE UPDATE ON public.cadence_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
