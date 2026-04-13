
-- Schedule daily blog post generation at 08:00 AM (Brasília time UTC-3 = 11:00 UTC)
SELECT cron.schedule(
  'generate-blog-posts-daily',
  '0 11 * * *',
  $$
  SELECT extensions.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/generate-blog-posts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
