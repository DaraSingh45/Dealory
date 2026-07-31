CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT members_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT members_email_length CHECK (char_length(email) <= 254)
);

GRANT INSERT ON public.members TO anon, authenticated;
GRANT ALL ON public.members TO service_role;

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can join" ON public.members
  FOR INSERT TO anon, authenticated
  WITH CHECK (char_length(email) <= 254);
