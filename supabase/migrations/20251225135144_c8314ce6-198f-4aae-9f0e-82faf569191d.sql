-- Visits table - prevent updates, admin-only deletes
CREATE POLICY "Deny updates to visits" ON public.visits
  FOR UPDATE USING (false);

CREATE POLICY "Admins can delete visits" ON public.visits
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Touchpoints table - prevent updates (immutable chain), admin-only deletes
CREATE POLICY "Deny updates to touchpoints" ON public.touchpoints
  FOR UPDATE USING (false);

CREATE POLICY "Admins can delete touchpoints" ON public.touchpoints
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Webhook logs - prevent updates, admin-only deletes
CREATE POLICY "Deny updates to webhook_logs" ON public.webhook_logs
  FOR UPDATE USING (false);

CREATE POLICY "Admins can delete webhook_logs" ON public.webhook_logs
  FOR DELETE USING (has_role(auth.uid(), 'admin'));