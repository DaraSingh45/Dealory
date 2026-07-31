import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { mapProduct } from "./products-map";
import type { HomeSections, ThemeSettings, Category } from "./products-types";

async function getSupabaseAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProduct);
});

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().length(8) }).parse(d))
  .handler(async ({ data }) => {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? mapProduct(row) : null;
  });

export const getTheme = createServerFn({ method: "GET" }).handler(async () => {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("theme_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const hero = (data?.hero_cards ?? []) as string[];
  const heroCards: [string, string, string] = [
    hero[0] ?? "",
    hero[1] ?? "",
    hero[2] ?? "",
  ];
  const cats = (data?.category_images ?? {}) as Record<string, string>;
  const categoryImages: Record<Category, string> = {
    fashion: cats.fashion ?? "",
    shoes: cats.shoes ?? "",
    electronics: cats.electronics ?? "",
    beauty: cats.beauty ?? "",
    health: cats.health ?? "",
  };
  const out: ThemeSettings = { heroCards, categoryImages };
  return out;
});

export const getSections = createServerFn({ method: "GET" }).handler(async () => {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("home_sections")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const out: HomeSections = {
    featured: ((data?.featured ?? []) as string[]).map((s) => s.trim()),
    trending: ((data?.trending ?? []) as string[]).map((s) => s.trim()),
    newArrivals: ((data?.new_arrivals ?? []) as string[]).map((s) => s.trim()),
    topRated: ((data?.top_rated ?? []) as string[]).map((s) => s.trim()),
  };
  return out;
});

export const incrementProductViews = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().length(8) }).parse(d))
  .handler(async ({ data }) => {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: row, error } = await (supabaseAdmin.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ data: number | null; error: unknown }>)("increment_product_views", { pid: data.id });
    if (error) {
      console.error("[incrementProductViews]", error);
      return { ok: false as const };
    }
    return { ok: true as const, views: row as unknown as number };
  });
