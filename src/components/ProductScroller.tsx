import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/data/products";

export function ProductScroller({ products, max = 10 }: { products: Product[]; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const items = products.slice(0, max);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      rafRef.current = null;
      setCanLeft(el.scrollLeft > 4);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(update);
    };
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [items.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const step = first ? first.getBoundingClientRect().width + 24 : el.clientWidth * 0.5;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div className="h-scroll-wrap group/hsr">
      <div className="h-scroll-shine" />
      <div ref={ref} className="h-scroll">
        {items.map((p, i) => (
          <div key={p.id} className="w-[78%] sm:w-[44%] lg:w-[23%]">
            <ProductCard product={p} index={i} />
          </div>
        ))}
      </div>

      {canLeft && (
        <button
          aria-label="Scroll left"
          onClick={() => scrollBy(-1)}
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-11 w-11 items-center justify-center rounded-full bg-black/60 backdrop-blur-md ring-1 ring-white/15 text-white shadow-glow hover:bg-black/80 hover:scale-105 active:scale-95 transition"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {canRight && (
        <button
          aria-label="Scroll right"
          onClick={() => scrollBy(1)}
          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-11 w-11 items-center justify-center rounded-full bg-black/60 backdrop-blur-md ring-1 ring-white/15 text-white shadow-glow hover:bg-black/80 hover:scale-105 active:scale-95 transition"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
