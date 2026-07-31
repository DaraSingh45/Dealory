import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { useProducts } from "@/lib/store";

const schema = z.object({ q: fallback(z.string(), "").default("") });

const PAGE_SIZE = 18;

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(schema),
  head: () => ({ meta: [{ title: "Search — Dealory" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const products = useProducts().data ?? [];
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s) ||
        p.category.toLowerCase().includes(s),
    );
  }, [q, products]);

  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [q]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const slice = results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <main className="mx-auto max-w-7xl px-5 lg:px-8 pt-16">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Search</p>
      <h1 className="mt-2 font-display text-4xl md:text-5xl font-semibold tracking-tight text-gradient">
        {q ? `Results for "${q}"` : "Search the marketplace"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {q ? `${results.length} products found` : "Use the search icon in the navigation."}
      </p>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {slice.map((p, i) => (
          <Reveal key={p.id} delay={i * 40}><ProductCard product={p} index={i} /></Reveal>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={current === 1}
            className="h-10 w-10 inline-flex items-center justify-center rounded-full glass ring-1 ring-white/10 disabled:opacity-30 hover:bg-white/5 transition"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }).map((_, i) => {
            const n = i + 1;
            const active = n === current;
            return (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`h-10 min-w-10 px-3 rounded-full text-sm transition ring-1 ${
                  active ? "bg-white text-black ring-white shadow-glow" : "glass ring-white/10 hover:bg-white/5"
                }`}
              >
                {n}
              </button>
            );
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={current === totalPages}
            className="h-10 w-10 inline-flex items-center justify-center rounded-full glass ring-1 ring-white/10 disabled:opacity-30 hover:bg-white/5 transition"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {q && results.length === 0 && (
        <p className="text-sm text-muted-foreground py-20 text-center">
          No products match your search.
        </p>
      )}
    </main>
  );
}
