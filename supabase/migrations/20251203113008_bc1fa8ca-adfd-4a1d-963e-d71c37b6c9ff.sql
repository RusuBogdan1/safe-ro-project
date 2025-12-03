-- Fix PUBLIC_DATA_EXPOSURE: Make alert_subscriptions private

-- Drop all overly permissive policies
DROP POLICY IF EXISTS "Users can view their own subscriptions by email" ON alert_subscriptions;
DROP POLICY IF EXISTS "Anyone can subscribe to alerts" ON alert_subscriptions;
DROP POLICY IF EXISTS "Users can update their subscriptions by email" ON alert_subscriptions;
DROP POLICY IF EXISTS "Users can delete their subscriptions" ON alert_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON alert_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON alert_subscriptions;

-- Add unsubscribe_token for secure self-service unsubscribe via links
ALTER TABLE alert_subscriptions 
ADD COLUMN IF NOT EXISTS unsubscribe_token UUID DEFAULT gen_random_uuid() NOT NULL;

-- Create index for efficient token lookups
CREATE INDEX IF NOT EXISTS idx_alert_subscriptions_unsubscribe_token 
ON alert_subscriptions(unsubscribe_token);

-- No public SELECT policy - emails are private
-- No public INSERT/UPDATE/DELETE - all operations go through edge function with service role

-- Only allow authenticated admins to view subscriptions for management
CREATE POLICY "Admins can view all subscriptions"
ON alert_subscriptions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only allow authenticated admins to manage subscriptions
CREATE POLICY "Admins can manage subscriptions"
ON alert_subscriptions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));