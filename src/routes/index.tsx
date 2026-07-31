import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, Sparkles, Check, Loader2 } from "lucide-react";
import { CATEGORIES } from "@/data/products";
import { Reveal } from "@/components/Reveal";
import { ProductScroller } from "@/components/ProductScroller";
import {
  resolveHero, resolveCategoryImage,
  findById, SECTION_META, type SectionKey,
  productsQueryOptions, themeQueryOptions, sectionsQueryOptions,
} from "@/lib/store";
import { joinMembers } from "@/lib/members.functions";
import type { Product } from "@/lib/products-types";

function HomeError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-5 lg:px-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold text-gradient">Home unavailable</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error.message || "Please try again."}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:opacity-90"
        >
          Retry
        </button>
      </div>
    </main>
  );
}

function HomeNotFound() {
  return (
    <main className="mx-auto flex min-h-[40vh] max-w-7xl items-center justify-center px-5 lg:px-8">
      <p className="text-sm text-muted-foreground">Nothing to show here right now.</p>
    </main>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dealory — Luxury Picks for Everyday Living" },
      { name: "description", content: "Browse a luxury dark marketplace of fashion, shoes, electronics, beauty and health." },
    ],
  }),
  loader: async ({ context }) => {
    const [theme, sections, products] = await Promise.all([
      context.queryClient.ensureQueryData(themeQueryOptions),
      context.queryClient.ensureQueryData(sectionsQueryOptions),
      context.queryClient.ensureQueryData(productsQueryOptions),
    ]);

    return { theme, sections, products };
  },
  errorComponent: HomeError,
  notFoundComponent: HomeNotFound,
  component: Home,
});

function Section({
  eyebrow, title, subtitle, children, action,
}: { eyebrow: string; title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-5 lg:px-8 mt-28">
      <Reveal>
        <div className="flex items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{eyebrow}</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mt-2 text-gradient">
              {title}
            </h2>
            {subtitle && <p className="mt-2 text-sm text-muted-foreground max-w-xl">{subtitle}</p>}
          </div>
          {action}
        </div>
      </Reveal>
      {children}
    </section>
  );
}

function Home() {
  const { products, theme, sections } = Route.useLoaderData();

  const hero = resolveHero(theme);

  const resolveSection = (k: SectionKey): Product[] => {
    const ids: string[] = sections?.[k] ?? [];
    return ids.map((id) => findById(products, id)).filter(Boolean).slice(0, 10) as Product[];
  };

  const sectionKeys: SectionKey[] = ["featured", "trending", "newArrivals", "topRated"];
  const sectionSubtitles: Partial<Record<SectionKey, string>> = {
    featured: "Hand-picked by our curators — the pieces defining this season.",
  };

  return (
    <main>
      <section className="relative overflow-hidden pt-8 md:pt-10 lg:pt-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full blur-3xl opacity-40 animate-glow-pulse"
            style={{ background: "radial-gradient(closest-side, oklch(0.7 0.05 270 / 0.45), transparent 70%)" }} />
        </div>

        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-2 md:items-start md:gap-8 md:py-8 lg:px-8 lg:py-0 lg:min-h-[80vh] lg:items-center lg:gap-12">
          <div className="animate-rise">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Premium Collection
            </div>
            <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02] text-gradient">
              Luxury Picks for<br /> Everyday Living.
            </h1>
            <p className="mt-6 max-w-md text-base text-muted-foreground">
              A curated marketplace of premium fashion, footwear, electronics, beauty and
              health — handpicked for those who refuse the ordinary.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/fashion" className="group inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 text-sm font-medium shadow-glow hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.4)] transition">
                Explore collection
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link to="/electronics" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm hover:bg-white/5 transition">
                View electronics
              </Link>
            </div>
            <div className="mt-12 flex items-center gap-8 text-xs text-muted-foreground">
              <div><span className="text-foreground text-lg font-medium block">High Quality</span>Products</div>
              <div><span className="text-foreground text-lg font-medium block">Top Rated</span>Products</div>
              <div><span className="text-foreground text-lg font-medium block">Fast</span>Delivery</div>
            </div>
          </div>

          <div className="relative hidden h-[340px] md:block lg:h-[560px]">
            <div className="absolute right-0 top-4 w-[58%] aspect-[3/4] rounded-3xl overflow-hidden glass shadow-glow animate-float-slow">
              <img src={hero[0]} alt="" loading="eager" fetchPriority="high" decoding="async" className="h-full w-full object-cover" />
            </div>
            <div className="absolute left-0 bottom-0 w-[52%] aspect-[3/4] rounded-3xl overflow-hidden glass shadow-glow animate-float-slow" style={{ animationDelay: "1.5s" }}>
              <img src={hero[1]} alt="" loading="eager" fetchPriority="high" decoding="async" className="h-full w-full object-cover" />
            </div>
            <div className="absolute left-[30%] top-[34%] w-[44%] aspect-square rounded-3xl overflow-hidden glass shadow-glow animate-float-slow" style={{ animationDelay: "0.7s" }}>
              <img src={hero[2]} alt="" loading="eager" fetchPriority="high" decoding="async" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <Section eyebrow={SECTION_META.featured.eyebrow} title={SECTION_META.featured.title} subtitle={sectionSubtitles.featured}>
        <ProductScroller products={resolveSection("featured")} />
      </Section>

      <Section eyebrow="Universes" title="Popular categories" subtitle="Five disciplines, one philosophy.">
        <div className="hidden lg:grid grid-cols-5 gap-4">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.slug} delay={i * 60}>
              <Link to={`/${c.slug}` as "/fashion"} className="group relative block aspect-[3/4] overflow-hidden rounded-2xl ring-1 ring-white/5">
                <img src={resolveCategoryImage(theme, c.slug)} alt={c.label} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-display text-lg font-medium">{c.label}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition" style={{ background: "radial-gradient(300px 200px at 50% 50%, rgba(255,255,255,0.15), transparent 70%)" }} />
              </Link>
            </Reveal>
          ))}
        </div>
        <div className="lg:hidden h-scroll-wrap">
          <div className="h-scroll-shine" />
          <div className="h-scroll">
            {CATEGORIES.map((c, i) => (
              <div key={c.slug} className="w-[58%] sm:w-[40%]">
                <Reveal delay={i * 60}>
                  <Link to={`/${c.slug}` as "/fashion"} className="group relative block aspect-[3/4] overflow-hidden rounded-2xl ring-1 ring-white/5">
                    <img src={resolveCategoryImage(theme, c.slug)} alt={c.label} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-display text-lg font-medium">{c.label}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                    </div>
                  </Link>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {sectionKeys.slice(1).map((k) => (
        <Section key={k} eyebrow={SECTION_META[k].eyebrow} title={SECTION_META[k].title}>
          <ProductScroller products={resolveSection(k)} />
        </Section>
      ))}

      <section className="mx-auto max-w-7xl px-5 lg:px-8 mt-32">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl glass p-10 md:p-16 text-center">
            <div className="absolute inset-0 -z-10 opacity-50" style={{ background: "radial-gradient(600px 240px at 50% 0%, rgba(255,255,255,0.15), transparent 70%)" }} />
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Members</p>
            <h3 className="mt-4 font-display text-3xl md:text-5xl font-semibold tracking-tight text-gradient">
              Be first to the drops.
            </h3>
            <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
              Early access to limited runs, archive sales, and curator notes — straight to your inbox.
            </p>
            <JoinForm />

          </div>
        </Reveal>
      </section>
    </main>
  );
}

function JoinForm() {
  const join = useServerFn(joinMembers);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "duplicate" | "invalid" | "error">("idle");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      setStatus("invalid");
      return;
    }
    setStatus("loading");
    try {
      const res = await join({ data: { email: trimmed } });
      if (res.ok) setStatus("success");
      else setStatus(res.reason);
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="mt-8 mx-auto max-w-md relative overflow-hidden rounded-2xl glass ring-1 ring-white/15 px-6 py-8 text-center animate-rise">
        <div className="absolute inset-0 -z-10 opacity-70 animate-glow-pulse" style={{ background: "radial-gradient(400px 160px at 50% 50%, rgba(255,255,255,0.25), transparent 70%)" }} />
        <div className="mx-auto h-12 w-12 rounded-full bg-white text-black grid place-items-center shadow-glow animate-rise">
          <Check className="h-6 w-6" />
        </div>
        <h4 className="mt-4 font-display text-xl font-semibold text-gradient">You're in.</h4>
        <p className="mt-1 text-sm text-muted-foreground">Welcome to Dealory — early drops are heading your way.</p>
      </div>
    );
  }

  const errorMsg =
    status === "duplicate" ? "This email is already a member."
    : status === "invalid" ? "Please enter a valid email."
    : status === "error" ? "Something went wrong. Try again."
    : null;

  return (
    <form onSubmit={onSubmit} className="mt-8 mx-auto max-w-md">
      <div className={`flex items-center gap-2 rounded-full glass px-2 py-2 ring-1 transition ${errorMsg ? "ring-red-500/60 animate-[login-shake_0.4s_ease]" : "ring-white/10"}`}>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status !== "idle" && status !== "loading") setStatus("idle"); }}
          maxLength={254}
          required
          className="flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
          placeholder="your@email.com"
        />
        <button disabled={status === "loading"} className="cursor-pointer rounded-full bg-white text-black px-5 py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-60 inline-flex items-center gap-2">
          {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
        </button>
      </div>
      {errorMsg && <p className="mt-2 text-xs text-red-400 text-center">{errorMsg}</p>}
    </form>
  );
}
