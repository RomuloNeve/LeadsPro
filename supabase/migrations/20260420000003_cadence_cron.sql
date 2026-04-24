-- Schedule process-cadences to run every 10 minutes.
-- The edge function pulls active enrollments whose next_run_at has passed
-- and advances each one (sending, logging, or pausing on reply/status).

-- Remove any previous schedule with the same name so re-running this
-- migration locally is idempotent.
DO $$
DECLARE
  job_id bigint;
BEGIN
  SELECT jobid INTO job_id FROM cron.job WHERE jobname = 'process-cadences-every-10min';
  IF job_id IS NOT NULL THEN
    PERFORM cron.unschedule(job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'process-cadences-every-10min',
  '*/10 * * * *',
  $$
  SELECT extensions.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/process-cadences',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
