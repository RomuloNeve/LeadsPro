
-- Drop restrictive policies and recreate as permissive for lead_lists
DROP POLICY IF EXISTS "Users can create their own lists" ON public.lead_lists;
DROP POLICY IF EXISTS "Users can view their own lists" ON public.lead_lists;
DROP POLICY IF EXISTS "Users can update their own lists" ON public.lead_lists;
DROP POLICY IF EXISTS "Users can delete their own lists" ON public.lead_lists;
DROP POLICY IF EXISTS "Admins can do everything with lead_lists" ON public.lead_lists;

CREATE POLICY "Users can view their own lists" ON public.lead_lists FOR SELECT USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = lead_lists.license_id AND licenses.assigned_to = auth.uid()));
CREATE POLICY "Users can create their own lists" ON public.lead_lists FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = lead_lists.license_id AND licenses.assigned_to = auth.uid()));
CREATE POLICY "Users can update their own lists" ON public.lead_lists FOR UPDATE USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = lead_lists.license_id AND licenses.assigned_to = auth.uid()));
CREATE POLICY "Users can delete their own lists" ON public.lead_lists FOR DELETE USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = lead_lists.license_id AND licenses.assigned_to = auth.uid()));
CREATE POLICY "Admins can do everything with lead_lists" ON public.lead_lists FOR ALL USING (is_admin());

-- Same fix for lead_list_items
DROP POLICY IF EXISTS "Users can view their own list items" ON public.lead_list_items;
DROP POLICY IF EXISTS "Users can add to their own lists" ON public.lead_list_items;
DROP POLICY IF EXISTS "Users can remove from their own lists" ON public.lead_list_items;
DROP POLICY IF EXISTS "Admins can do everything with lead_list_items" ON public.lead_list_items;

CREATE POLICY "Users can view their own list items" ON public.lead_list_items FOR SELECT USING (EXISTS (SELECT 1 FROM lead_lists ll JOIN licenses l ON l.id = ll.license_id WHERE ll.id = lead_list_items.list_id AND l.assigned_to = auth.uid()));
CREATE POLICY "Users can add to their own lists" ON public.lead_list_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM lead_lists ll JOIN licenses l ON l.id = ll.license_id WHERE ll.id = lead_list_items.list_id AND l.assigned_to = auth.uid()));
CREATE POLICY "Users can remove from their own lists" ON public.lead_list_items FOR DELETE USING (EXISTS (SELECT 1 FROM lead_lists ll JOIN licenses l ON l.id = ll.license_id WHERE ll.id = lead_list_items.list_id AND l.assigned_to = auth.uid()));
CREATE POLICY "Admins can do everything with lead_list_items" ON public.lead_list_items FOR ALL USING (is_admin());

-- Fix leads table too
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can do everything with leads" ON public.leads;

CREATE POLICY "Users can view their own leads" ON public.leads FOR SELECT USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = leads.license_id AND licenses.assigned_to = auth.uid()));
CREATE POLICY "Users can insert their own leads" ON public.leads FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = leads.license_id AND licenses.assigned_to = auth.uid()));
CREATE POLICY "Users can update their own leads" ON public.leads FOR UPDATE USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = leads.license_id AND licenses.assigned_to = auth.uid()));
CREATE POLICY "Users can delete their own leads" ON public.leads FOR DELETE USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = leads.license_id AND licenses.assigned_to = auth.uid()));
CREATE POLICY "Admins can do everything with leads" ON public.leads FOR ALL USING (is_admin());

-- Fix campaigns
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can create their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can do everything with campaigns" ON public.campaigns;

CREATE POLICY "Users can view their own campaigns" ON public.campaigns FOR SELECT USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = campaigns.license_id AND licenses.assigned_to = auth.uid()));
CREATE POLICY "Users can create their own campaigns" ON public.campaigns FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = campaigns.license_id AND licenses.assigned_to = auth.uid()));
CREATE POLICY "Users can update their own campaigns" ON public.campaigns FOR UPDATE USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = campaigns.license_id AND licenses.assigned_to = auth.uid()));
CREATE POLICY "Users can delete their own campaigns" ON public.campaigns FOR DELETE USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = campaigns.license_id AND licenses.assigned_to = auth.uid()));
CREATE POLICY "Admins can do everything with campaigns" ON public.campaigns FOR ALL USING (is_admin());

-- Fix followup_sequences
DROP POLICY IF EXISTS "Users can view their own sequences" ON public.followup_sequences;
DROP POLICY IF EXISTS "Users can create their own sequences" ON public.followup_sequences;
DROP POLICY IF EXISTS "Users can update their own sequences" ON public.followup_sequences;
DROP POLICY IF EXISTS "Users can delete their own sequences" ON public.followup_sequences;
DROP POLICY IF EXISTS "Admins can do everything with sequences" ON public.followup_sequences;

CREATE POLICY "Users can view their own sequences" ON public.followup_sequences FOR SELECT USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = followup_sequences.license_id AND licenses.assigned_to = auth.uid()));
CREATE POLICY "Users can create their own sequences" ON public.followup_sequences FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = followup_sequences.license_id AND licenses.assigned_to = auth.uid()));
CREATE POLICY "Users can update their own sequences" ON public.followup_sequences FOR UPDATE USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = followup_sequences.license_id AND licenses.assigned_to = auth.uid()));
CREATE POLICY "Users can delete their own sequences" ON public.followup_sequences FOR DELETE USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = followup_sequences.license_id AND licenses.assigned_to = auth.uid()));
CREATE POLICY "Admins can do everything with sequences" ON public.followup_sequences FOR ALL USING (is_admin());

-- Fix followup_steps
DROP POLICY IF EXISTS "Users can view their own steps" ON public.followup_steps;
DROP POLICY IF EXISTS "Users can create their own steps" ON public.followup_steps;
DROP POLICY IF EXISTS "Users can update their own steps" ON public.followup_steps;
DROP POLICY IF EXISTS "Users can delete their own steps" ON public.followup_steps;
DROP POLICY IF EXISTS "Admins can do everything with steps" ON public.followup_steps;

CREATE POLICY "Users can view their own steps" ON public.followup_steps FOR SELECT USING (EXISTS (SELECT 1 FROM followup_sequences fs JOIN licenses l ON l.id = fs.license_id WHERE fs.id = followup_steps.sequence_id AND l.assigned_to = auth.uid()));
CREATE POLICY "Users can create their own steps" ON public.followup_steps FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM followup_sequences fs JOIN licenses l ON l.id = fs.license_id WHERE fs.id = followup_steps.sequence_id AND l.assigned_to = auth.uid()));
CREATE POLICY "Users can update their own steps" ON public.followup_steps FOR UPDATE USING (EXISTS (SELECT 1 FROM followup_sequences fs JOIN licenses l ON l.id = fs.license_id WHERE fs.id = followup_steps.sequence_id AND l.assigned_to = auth.uid()));
CREATE POLICY "Users can delete their own steps" ON public.followup_steps FOR DELETE USING (EXISTS (SELECT 1 FROM followup_sequences fs JOIN licenses l ON l.id = fs.license_id WHERE fs.id = followup_steps.sequence_id AND l.assigned_to = auth.uid()));
CREATE POLICY "Admins can do everything with steps" ON public.followup_steps FOR ALL USING (is_admin());

-- Fix followup_logs
DROP POLICY IF EXISTS "Users can view their own logs" ON public.followup_logs;
DROP POLICY IF EXISTS "Users can create their own logs" ON public.followup_logs;
DROP POLICY IF EXISTS "Users can update their own logs" ON public.followup_logs;
DROP POLICY IF EXISTS "Admins can do everything with logs" ON public.followup_logs;

CREATE POLICY "Users can view their own logs" ON public.followup_logs FOR SELECT USING (EXISTS (SELECT 1 FROM followup_steps fst JOIN followup_sequences fs ON fs.id = fst.sequence_id JOIN licenses l ON l.id = fs.license_id WHERE fst.id = followup_logs.step_id AND l.assigned_to = auth.uid()));
CREATE POLICY "Users can create their own logs" ON public.followup_logs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM followup_steps fst JOIN followup_sequences fs ON fs.id = fst.sequence_id JOIN licenses l ON l.id = fs.license_id WHERE fst.id = followup_logs.step_id AND l.assigned_to = auth.uid()));
CREATE POLICY "Users can update their own logs" ON public.followup_logs FOR UPDATE USING (EXISTS (SELECT 1 FROM followup_steps fst JOIN followup_sequences fs ON fs.id = fst.sequence_id JOIN licenses l ON l.id = fs.license_id WHERE fst.id = followup_logs.step_id AND l.assigned_to = auth.uid()));
CREATE POLICY "Admins can do everything with logs" ON public.followup_logs FOR ALL USING (is_admin());

-- Fix profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (is_admin());

-- Fix licenses
DROP POLICY IF EXISTS "Users can view their assigned license" ON public.licenses;
DROP POLICY IF EXISTS "Users can activate unassigned license" ON public.licenses;
DROP POLICY IF EXISTS "Admins can do everything with licenses" ON public.licenses;

CREATE POLICY "Users can view their assigned license" ON public.licenses FOR SELECT USING (auth.uid() = assigned_to);
CREATE POLICY "Users can activate unassigned license" ON public.licenses FOR UPDATE USING (assigned_to IS NULL) WITH CHECK (auth.uid() = assigned_to);
CREATE POLICY "Admins can do everything with licenses" ON public.licenses FOR ALL USING (is_admin());

-- Fix whatsapp_instances
DROP POLICY IF EXISTS "Users can view own instance" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can create own instance" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can update own instance" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can delete own instance" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Admins full access whatsapp_instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Admins can view all instances" ON public.whatsapp_instances;

CREATE POLICY "Users can view own instance" ON public.whatsapp_instances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own instance" ON public.whatsapp_instances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own instance" ON public.whatsapp_instances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own instance" ON public.whatsapp_instances FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins full access whatsapp_instances" ON public.whatsapp_instances FOR ALL USING (is_admin());

-- Fix api_error_logs
DROP POLICY IF EXISTS "Admins can view all error logs" ON public.api_error_logs;
DROP POLICY IF EXISTS "Admins can delete error logs" ON public.api_error_logs;
DROP POLICY IF EXISTS "Admins can insert error logs" ON public.api_error_logs;

CREATE POLICY "Admins can view all error logs" ON public.api_error_logs FOR SELECT USING (is_admin());
CREATE POLICY "Admins can delete error logs" ON public.api_error_logs FOR DELETE USING (is_admin());
CREATE POLICY "Admins can insert error logs" ON public.api_error_logs FOR INSERT WITH CHECK (is_admin());
