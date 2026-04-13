
-- Table for lead lists
CREATE TABLE public.lead_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Junction table: leads <-> lists (many-to-many)
CREATE TABLE public.lead_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.lead_lists(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(list_id, lead_id)
);

-- RLS
ALTER TABLE public.lead_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_list_items ENABLE ROW LEVEL SECURITY;

-- lead_lists policies
CREATE POLICY "Users can view their own lists"
ON public.lead_lists FOR SELECT
USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = lead_lists.license_id AND licenses.assigned_to = auth.uid()));

CREATE POLICY "Users can create their own lists"
ON public.lead_lists FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = lead_lists.license_id AND licenses.assigned_to = auth.uid()));

CREATE POLICY "Users can update their own lists"
ON public.lead_lists FOR UPDATE
USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = lead_lists.license_id AND licenses.assigned_to = auth.uid()));

CREATE POLICY "Users can delete their own lists"
ON public.lead_lists FOR DELETE
USING (EXISTS (SELECT 1 FROM licenses WHERE licenses.id = lead_lists.license_id AND licenses.assigned_to = auth.uid()));

CREATE POLICY "Admins can do everything with lead_lists"
ON public.lead_lists FOR ALL
USING (is_admin());

-- lead_list_items policies
CREATE POLICY "Users can view their own list items"
ON public.lead_list_items FOR SELECT
USING (EXISTS (SELECT 1 FROM lead_lists ll JOIN licenses l ON l.id = ll.license_id WHERE ll.id = lead_list_items.list_id AND l.assigned_to = auth.uid()));

CREATE POLICY "Users can add to their own lists"
ON public.lead_list_items FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM lead_lists ll JOIN licenses l ON l.id = ll.license_id WHERE ll.id = lead_list_items.list_id AND l.assigned_to = auth.uid()));

CREATE POLICY "Users can remove from their own lists"
ON public.lead_list_items FOR DELETE
USING (EXISTS (SELECT 1 FROM lead_lists ll JOIN licenses l ON l.id = ll.license_id WHERE ll.id = lead_list_items.list_id AND l.assigned_to = auth.uid()));

CREATE POLICY "Admins can do everything with lead_list_items"
ON public.lead_list_items FOR ALL
USING (is_admin());
