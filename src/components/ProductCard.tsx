import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { Product } from "@/data/products";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group relative block transition-transform duration-500 ease-out hover:scale-[1.04] hover:z-10"
      style={{ animationDelay: `${(index % 8) * 60}ms` }}
    >
      {/* White light glow behind the card */}
      <div
        className="pointer-events-none absolute -inset-10 rounded-[2.5rem] opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,255,255,0.95), rgba(255,255,255,0.45) 40%, rgba(255,255,255,0.12) 65%, transparent 80%)",
        }}
      />
      <div className="relative overflow-hidden rounded-2xl bg-surface ring-1 ring-white/5 shadow-card transition-all duration-500 group-hover:ring-white/40 group-hover:shadow-[0_0_90px_-5px_rgba(255,255,255,0.7)]">
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
          {(product.tag || product.badge) && (
            <span className="absolute left-3 top-3 rounded-full bg-white/10 backdrop-blur px-2.5 py-1 text-[10px] uppercase tracking-widest text-white ring-1 ring-white/20">
              {product.tag
                ? product.tag
                : product.badge === "new" ? "New" : product.badge === "top" ? "Top rated" : "Trending"}
            </span>
          )}
          <div className="absolute bottom-3 right-3 rounded-full glass px-3 py-1 text-xs font-medium">
            ₹{product.price}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-medium tracking-tight leading-tight line-clamp-1">{product.title}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Star className="h-3 w-3 fill-current text-white/80" />
              {product.rating.toFixed(1)}
            </div>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{product.description}</p>
          <div className="mt-4 flex items-center justify-end">
            <span className="text-xs text-foreground/80 group-hover:text-foreground transition underline-grow">
              View Details
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
