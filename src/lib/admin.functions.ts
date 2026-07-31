import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { mapProduct } from "./products-map";
import type { Product } from "./products-types";

const SESSION_HOURS = 8;
const MAX_FAILS = 3;
const BLOCK_HOURS = 5;

function newToken(): string {
  // 32 random bytes hex via WebCrypto (Worker-safe)
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function getSupabaseAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, hash);
}

async function getRequestToken(): Promise<string | null> {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  return getRequestHeader("x-admin-token") ?? null;
}

async function getIp(): Promise<string> {
  try {
    const { getRequestIP } = await import("@tanstack/react-start/server");
    return getRequestIP({ xForwardedFor: true }) ?? "unknown";
  } catch {
    return "unknown";
  }
}

async function isBlocked(ip: string): Promise<{ blocked: boolean; until?: string; failed: number }> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data } = await supabaseAdmin
    .from("admin_login_attempts")
    .select("*")
    .eq("ip", ip)
    .maybeSingle();
  if (!data) return { blocked: false, failed: 0 };
  if (data.blocked_until && new Date(data.blocked_until).getTime() > Date.now()) {
    return { blocked: true, until: data.blocked_until, failed: data.failed_count };
  }
  return { blocked: false, failed: data.failed_count };
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; password: string }) =>
    z.object({
      username: z.string().min(1).max(100),
      password: z.string().min(1).max(200),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabaseAdmin = await getSupabaseAdmin();
    const ip = await getIp();
    const status = await isBlocked(ip);
    if (status.blocked) {
      return {
        ok: false as const,
        blocked: true,
        blockedUntil: status.until!,
        remaining: 0,
        message: "You've exceeded the limit. Try again later.",
      };
    }

    const { data: cred } = await supabaseAdmin
      .from("admin_credentials")
      .select("username, password_hash")
      .eq("id", 1)
      .maybeSingle();
    // Case-sensitive username comparison + bcrypt password verify
    const ok = !!cred && cred.username === data.username
      && await comparePassword(data.password, cred.password_hash);

    if (!ok) {
      // Increment failure
      const failed = (status.failed ?? 0) + 1;
      const willBlock = failed >= MAX_FAILS;
      const blocked_until = willBlock
        ? new Date(Date.now() + BLOCK_HOURS * 3600 * 1000).toISOString()
        : null;
      await supabaseAdmin.from("admin_login_attempts").upsert({
        ip,
        failed_count: willBlock ? 0 : failed,
        blocked_until,
        last_attempt_at: new Date().toISOString(),
      });
      return {
        ok: false as const,
        blocked: willBlock,
        blockedUntil: blocked_until ?? undefined,
        remaining: Math.max(0, MAX_FAILS - failed),
        message: willBlock
          ? "You've exceeded the limit. Try again in 5 hours."
          : `Invalid credentials. ${MAX_FAILS - failed} attempt${MAX_FAILS - failed === 1 ? "" : "s"} remaining.`,
      };
    }

    // Reset attempts, issue session
    await supabaseAdmin.from("admin_login_attempts").upsert({
      ip,
      failed_count: 0,
      blocked_until: null,
      last_attempt_at: new Date().toISOString(),
    });
    const token = newToken();
    const expires_at = new Date(Date.now() + SESSION_HOURS * 3600 * 1000).toISOString();
    await supabaseAdmin.from("admin_sessions").insert({ token, expires_at });
    return { ok: true as const, token, expiresAt: expires_at };
  });

async function requireToken(): Promise<void> {
  const supabaseAdmin = await getSupabaseAdmin();
  const token = await getRequestToken();
  if (!token) throw new Error("Unauthorized");
  const { data, error } = await supabaseAdmin
    .from("admin_sessions")
    .select("token, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (error || !data) throw new Error("Unauthorized");
  if (new Date(data.expires_at).getTime() < Date.now()) {
    await supabaseAdmin.from("admin_sessions").delete().eq("token", token);
    throw new Error("Session expired");
  }
}

export const verifyAdmin = createServerFn({ method: "POST" }).handler(async () => {
  try {
    await requireToken();
    return { ok: true as const };
  } catch {
    return { ok: false as const };
  }
});

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const supabaseAdmin = await getSupabaseAdmin();
  const token = await getRequestToken();
  if (token) await supabaseAdmin.from("admin_sessions").delete().eq("token", token);
  return { ok: true };
});

// ------------- Product CRUD -------------

const imageUrlSchema = z
  .string()
  .trim()
  .min(1, "Image URL is required")
  .max(2000, "Image URL is too long")
  .refine(
    (s) => {
      if (s.startsWith("/") && !s.startsWith("//")) return true;
      try {
        const u = new URL(s);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    },
    "Enter a valid image URL (http(s)://…) or a local path like /assets/image.jpg",
  );

const optionalUrlSchema = z
  .string()
  .trim()
  .max(2000, "URL is too long")
  .refine(
    (s) => {
      if (s === "") return true;
      if (s.startsWith("/") && !s.startsWith("//")) return true;
      try {
        const u = new URL(s);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    },
    "Enter a valid URL (http(s)://…) or a local path starting with /",
  )
  .optional()
  .nullable();

const ProductInput = z.object({
  title: z.string().trim().min(1, "Title is required").max(150),
  description: z.string().trim().min(1, "Description is required").max(300),
  longDescription: z.string().max(4000).optional().default(""),
  price: z.number().min(0).max(10_000_000),
  rating: z.number().min(0).max(5),
  category: z.enum(["fashion", "shoes", "electronics", "beauty", "health"]),
  image: imageUrlSchema,
  gallery: z.array(imageUrlSchema).max(8).default([]),
  highlights: z.array(z.string().max(200)).max(20).default([]),
  specs: z.array(z.object({ label: z.string().max(60), value: z.string().max(200) })).max(20).default([]),
  tag: z.string().trim().max(15).optional().nullable(),
  badge: z.enum(["new", "trending", "top"]).optional().nullable(),
  buyUrl: optionalUrlSchema,
  recommendedIds: z.array(z.string().length(8)).max(8).default([]),
});

function friendly(err: unknown): Error {
  if (err instanceof z.ZodError) {
    const first = err.issues[0];
    const path = first?.path?.join(".") ?? "";
    const msg = first?.message ?? "Invalid input";
    return new Error(path ? `${path}: ${msg}` : msg);
  }
  return err instanceof Error ? err : new Error(String(err));
}

function toRow(p: z.infer<typeof ProductInput>) {
  return {
    title: p.title,
    description: p.description,
    long_description: p.longDescription || p.description,
    price: p.price,
    rating: p.rating,
    category: p.category,
    image: p.image,
    gallery: p.gallery,
    highlights: p.highlights,
    specs: p.specs,
    tag: p.tag || null,
    badge: p.badge ?? null,
    buy_url: p.buyUrl || null,
    recommended_ids: p.recommendedIds,
  };
}

export const createProduct = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    try { return ProductInput.parse(d); } catch (e) { throw friendly(e); }
  })
  .handler(async ({ data }) => {
    await requireToken();
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .insert(toRow(data))
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapProduct(row);
  });

export const updateProduct = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    try { return ProductInput.extend({ id: z.string().length(8) }).parse(d); }
    catch (e) { throw friendly(e); }
  })
  .handler(async ({ data }) => {
    await requireToken();
    const supabaseAdmin = await getSupabaseAdmin();
    const { id, ...rest } = data;
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .update(toRow(rest))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapProduct(row);
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().length(8) }).parse(d))
  .handler(async ({ data }) => {
    await requireToken();
    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ------------- Theme -------------

const ThemeInput = z.object({
  heroCards: z.tuple([imageUrlSchema, imageUrlSchema, imageUrlSchema]),
  categoryImages: z.object({
    fashion: imageUrlSchema,
    shoes: imageUrlSchema,
    electronics: imageUrlSchema,
    beauty: imageUrlSchema,
    health: imageUrlSchema,
  }),
});

export const saveTheme = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    try { return ThemeInput.parse(d); } catch (e) { throw friendly(e); }
  })
  .handler(async ({ data }) => {
    await requireToken();
    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("theme_settings").upsert({
      id: 1,
      hero_cards: data.heroCards,
      category_images: data.categoryImages,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ------------- Sections -------------

const SectionsInput = z.object({
  featured: z.array(z.string().length(8)).max(10),
  trending: z.array(z.string().length(8)).max(10),
  newArrivals: z.array(z.string().length(8)).max(10),
  topRated: z.array(z.string().length(8)).max(10),
});

export const saveSections = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SectionsInput.parse(d))
  .handler(async ({ data }) => {
    await requireToken();
    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("home_sections").upsert({
      id: 1,
      featured: data.featured,
      trending: data.trending,
      new_arrivals: data.newArrivals,
      top_rated: data.topRated,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Export to satisfy unused-import linter in case Product isn't referenced elsewhere
export type AdminProduct = Product;
