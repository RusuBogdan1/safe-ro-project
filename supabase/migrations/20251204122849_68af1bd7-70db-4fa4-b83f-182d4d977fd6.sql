-- Create volunteer signups table to track who signed up for each announcement
CREATE TABLE public.volunteer_signups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    announcement_id UUID NOT NULL REFERENCES public.volunteer_announcements(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(announcement_id, email)
);

-- Enable Row Level Security
ALTER TABLE public.volunteer_signups ENABLE ROW LEVEL SECURITY;

-- Anyone can sign up (insert their email)
CREATE POLICY "Anyone can sign up for volunteer announcements"
ON public.volunteer_signups
FOR INSERT
WITH CHECK (true);

-- Admins and analysts can view all signups
CREATE POLICY "Admins and analysts can view volunteer signups"
ON public.volunteer_signups
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role));

-- Admins can delete signups
CREATE POLICY "Admins can delete volunteer signups"
ON public.volunteer_signups
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));