CREATE OR REPLACE FUNCTION public.gen_product_id() RETURNS char(8)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE n bigint;
BEGIN
  n := nextval('public.products_id_seq');
  RETURN lpad(n::text, 8, '0');
END;$$;