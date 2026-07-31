import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, type Category } from "@/data/products";
import { ProductCard } from "./ProductCard";
import { Reveal } from "./Reveal";
import { Check, ChevronLeft, ChevronRight, Search, SlidersHorizontal, Sparkles, Star } from "lucide-react";
import { useProducts, useTheme, byCategoryFrom, resolveCategoryImage } from "@/lib/store";
import type { Product } from "@/lib/products-types";

type Sort = "featured" | "price-asc" | "price-desc" | "rating";

export function CategoryPage({ slug }: { slug: Category }) {
  const meta = CATEGORIES.find((c) => c.slug === slug)!;
  const theme = useTheme().data;
  const products = useProducts().data;
  const bannerImage = resolveCategoryImage(theme, slug) || meta.image;
  const all = byCategoryFrom(products, slug);
  const maxPrice = all.length ? Math.max(...all.map((p) => p.price)) : 1000;

  const [q, setQ] = useState("");
  const [price, setPrice] = useState(maxPrice);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<Sort>("featured");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Keep the price slider's upper bound in sync with the loaded data.
  useEffect(() => {
    setPrice((p) => (p === 0 || p > maxPrice ? maxPrice : p));
  }, [maxPrice]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const sortOptions: { value: Sort; label: string }[] = [
    { value: "featured", label: "Featured" },
    { value: "price-asc", label: "Price · Low to High" },
    { value: "price-desc", label: "Price · High to Low" },
    { value: "rating", label: "Top rated" },
  ];

  const filtered = useMemo(() => {
    let r = all.filter(
      (p) =>
        p.price <= price &&
        p.rating >= minRating &&
        (q.trim() === "" || p.title.toLowerCase().includes(q.toLowerCase())),
    );
    if (sort === "price-asc") r = [...r].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") r = [...r].sort((a, b) => b.price - a.price);
    if (sort === "rating") r = [...r].sort((a, b) => b.rating - a.rating);
    return r;
  }, [all, q, price, minRating, sort]);

  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="h-[44vh] min-h-[320px] w-full bg-cover bg-center" style={{ backgroundImage: `url(${bannerImage})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto max-w-7xl w-full px-5 lg:px-8 pb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Collection</p>
            <h1 className="font-display text-5xl md:text-6xl font-semibold tracking-tight mt-2 text-gradient">
              {meta.label}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">{meta.description}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 lg:px-8 mt-10 grid lg:grid-cols-[260px_1fr] gap-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <button onClick={() => setFiltersOpen((s) => !s)} className="lg:hidden mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
          <div className={`${filtersOpen ? "block" : "hidden"} lg:block glass rounded-2xl p-5 space-y-6`}>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Search</label>
              <div className="mt-2 flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 ring-1 ring-white/10 focus-within:ring-white/30 transition">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="In this collection" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Max price</label>
                <span className="text-xs text-foreground">₹{price}</span>
              </div>
              <input type="range" min={0} max={maxPrice} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="mt-3 w-full accent-white" />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Minimum rating</label>
              <div className="mt-3 flex gap-1">
                {[0, 3, 4, 4.5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`flex-1 inline-flex items-center justify-center gap-1 rounded-full border px-2 py-1.5 text-xs transition ${
                      minRating === r ? "border-white/40 bg-white/10 text-foreground" : "border-white/10 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Star className="h-3 w-3" />
                    {r === 0 ? "Any" : r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Sort</label>
              <div ref={sortRef} className="relative mt-3">
                <button
                  type="button"
                  onClick={() => setSortOpen((s) => !s)}
                  aria-haspopup="listbox"
                  aria-expanded={sortOpen}
                  className={`w-full inline-flex items-center justify-between gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-foreground ring-1 transition cursor-pointer ${
                    sortOpen ? "ring-white/30 bg-white/10" : "ring-white/10 hover:ring-white/20"
                  }`}
                >
                  <span className="truncate">{sortOptions.find((o) => o.value === sort)?.label}</span>
                  <svg className={`h-3 w-3 text-muted-foreground transition-transform duration-300 ${sortOpen ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none">
                    <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div
                  role="listbox"
                  className={`absolute left-0 right-0 top-full mt-2 origin-top rounded-2xl glass-strong ring-1 ring-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] overflow-hidden z-20 transition-all duration-200 ${
                    sortOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
                  }`}
                >
                  <ul className="p-1.5">
                    {sortOptions.map((o) => {
                      const selected = o.value === sort;
                      return (
                        <li key={o.value}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => { setSort(o.value); setSortOpen(false); }}
                            className={`w-full inline-flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                              selected ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                            }`}
                          >
                            <span>{o.label}</span>
                            {selected && <Check className="h-3.5 w-3.5" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <CategoryResults filtered={filtered} />
      </div>
    </main>
  );
}

function CategoryResults({ filtered }: { filtered: Product[] }) {
  const [perPage, setPerPage] = useState(15);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => setPerPage(mq.matches ? 10 : 15);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => { if (page > totalPages) setPage(1); }, [page, totalPages]);
  useEffect(() => { setPage(1); }, [filtered.length, perPage]);

  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-muted-foreground">{filtered.length} products</p>
        {filtered.length > 0 && (
          <p className="text-xs text-muted-foreground tabular-nums">
            Page <span className="text-foreground">{page}</span> / {totalPages}
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyExplore />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {pageItems.map((p, i) => (
              <Reveal key={p.id} delay={i * 40}>
                <ProductCard product={p} index={i} />
              </Reveal>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-white/10 hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const n = i + 1;
                const active = n === page;
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`h-9 min-w-9 px-3 inline-flex items-center justify-center rounded-full text-xs tabular-nums transition ${
                      active ? "bg-white text-black" : "border border-white/10 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-white/10 hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Next page">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function EmptyExplore() {
  return (
    <div className="relative py-24 text-center empty-state">
      <div
        aria-hidden
        className="empty-state-halo pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[320px] w-[520px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.35), rgba(255,255,255,0.1) 55%, transparent 75%)" }}
      />
      <Sparkles className="relative mx-auto h-6 w-6 text-white/80 drop-shadow-[0_0_18px_rgba(255,255,255,0.6)]" />
      <p className="empty-state-text relative mt-5 font-display text-2xl md:text-3xl font-semibold tracking-tight text-gradient">
        Nothing to explore here—yet.
      </p>
      <p className="empty-state-text relative mt-2 text-sm text-muted-foreground">
        Check back soon for new additions.
      </p>
    </div>
  );
}
