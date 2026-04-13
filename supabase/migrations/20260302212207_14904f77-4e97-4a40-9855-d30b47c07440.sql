
-- Create api_error_logs table for tracking errors across edge functions
CREATE TABLE public.api_error_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name text NOT NULL,
  error_message text NOT NULL,
  error_details jsonb DEFAULT NULL,
  user_id uuid DEFAULT NULL,
  instance_name text DEFAULT NULL,
  request_payload jsonb DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_error_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view error logs
CREATE POLICY "Admins can view all error logs"
ON public.api_error_logs
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Only admins can delete error logs
CREATE POLICY "Admins can delete error logs"
ON public.api_error_logs
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Service role / edge functions can insert (no user auth needed for inserts from backend)
CREATE POLICY "Allow insert from service role"
ON public.api_error_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also allow anon insert for edge functions using service role
ALTER TABLE public.api_error_logs FORCE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_api_error_logs_created_at ON public.api_error_logs (created_at DESC);
CREATE INDEX idx_api_error_logs_function_name ON public.api_error_logs (function_name);

-- Allow admins to read all profiles for user management
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Allow admins to view all whatsapp instances
CREATE POLICY "Admins can view all instances"
ON public.whatsapp_instances
FOR SELECT
TO authenticated
USING (public.is_admin());
