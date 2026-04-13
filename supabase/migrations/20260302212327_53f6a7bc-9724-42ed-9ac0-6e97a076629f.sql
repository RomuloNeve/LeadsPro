
-- Fix the permissive INSERT policy - restrict to service_role only for edge function inserts
DROP POLICY "Allow insert from service role" ON public.api_error_logs;

-- Edge functions use service_role key which bypasses RLS, so no INSERT policy needed for authenticated users
-- Admins can insert if needed
CREATE POLICY "Admins can insert error logs"
ON public.api_error_logs
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());
