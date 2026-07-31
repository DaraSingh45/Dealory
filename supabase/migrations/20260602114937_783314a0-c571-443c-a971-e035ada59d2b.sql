-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============ PRODUCTS ============
CREATE SEQUENCE IF NOT EXISTS public.products_id_seq START 10000001 MINVALUE 10000000 MAXVALUE 99999999;

CREATE OR REPLACE FUNCTION public.gen_product_id() RETURNS char(8)
LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  n := nextval('public.products_id_seq');
  RETURN lpad(n::text, 8, '0');
END;$$;

CREATE TABLE public.products (
  id char(8) PRIMARY KEY DEFAULT public.gen_product_id(),
  title varchar(150) NOT NULL CHECK (char_length(title) BETWEEN 1 AND 150),
  description varchar(300) NOT NULL CHECK (char_length(description) BETWEEN 1 AND 300),
  long_description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  rating numeric(2,1) NOT NULL DEFAULT 4.5 CHECK (rating >= 0 AND rating <= 5),
  reviews int NOT NULL DEFAULT 0,
  category text NOT NULL CHECK (category IN ('fashion','shoes','electronics','beauty','health')),
  image text NOT NULL,
  gallery text[] NOT NULL DEFAULT '{}',
  highlights text[] NOT NULL DEFAULT '{}',
  specs jsonb NOT NULL DEFAULT '[]'::jsonb,
  tag varchar(15),
  badge text CHECK (badge IS NULL OR badge IN ('new','trending','top')),
  buy_url text,
  recommended_ids char(8)[] NOT NULL DEFAULT '{}' CHECK (array_length(recommended_ids,1) IS NULL OR array_length(recommended_ids,1) <= 8),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON public.products(category);
CREATE INDEX products_created_at_idx ON public.products(created_at DESC);

GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT TO anon, authenticated USING (true);

-- ============ THEME SETTINGS ============
CREATE TABLE public.theme_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  hero_cards text[] NOT NULL DEFAULT '{}',
  category_images jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.theme_settings TO anon, authenticated;
GRANT ALL ON public.theme_settings TO service_role;
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "theme public read" ON public.theme_settings FOR SELECT TO anon, authenticated USING (true);

-- ============ HOME SECTIONS ============
CREATE TABLE public.home_sections (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  featured char(8)[] NOT NULL DEFAULT '{}',
  trending char(8)[] NOT NULL DEFAULT '{}',
  new_arrivals char(8)[] NOT NULL DEFAULT '{}',
  top_rated char(8)[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.home_sections TO anon, authenticated;
GRANT ALL ON public.home_sections TO service_role;
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sections public read" ON public.home_sections FOR SELECT TO anon, authenticated USING (true);

-- ============ ADMIN CREDENTIALS ============
CREATE TABLE public.admin_credentials (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  username text NOT NULL,
  password_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_credentials TO service_role;
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;
-- no public policies; only service_role can read/write

-- ============ ADMIN LOGIN ATTEMPTS ============
CREATE TABLE public.admin_login_attempts (
  ip text PRIMARY KEY,
  failed_count int NOT NULL DEFAULT 0,
  blocked_until timestamptz,
  last_attempt_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_login_attempts TO service_role;
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;

-- ============ ADMIN SESSIONS ============
CREATE TABLE public.admin_sessions (
  token text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
GRANT ALL ON public.admin_sessions TO service_role;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
