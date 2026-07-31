ALTER FUNCTION public.gen_product_id() SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.gen_product_id() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gen_product_id() TO service_role;