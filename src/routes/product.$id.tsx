import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Star } from "lucide-react";
import { ProductScroller } from "@/components/ProductScroller";
import { Reveal } from "@/components/Reveal";
import { getProduct, incrementProductViews } from "@/lib/products.functions";
import { useProducts, relatedFrom } from "@/lib/store";

export const Route = createFileRoute("/product/$id")({
  loader: async ({ params }) => {
    const product = await getProduct({ data: { id: params.id } });
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.title ?? "Product"} — Dealory` },
      { name: "description", content: loaderData?.product.description ?? "" },
      { property: "og:image", content: loaderData?.product.image ?? "" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl text-center py-32 px-5">
      <h1 className="font-display text-3xl">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Link to="/" className="mt-6 inline-block rounded-full bg-white text-black px-5 py-2 text-sm">Back home</Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl text-center py-32 px-5">
      <h1 className="font-display text-3xl">Product not found</h1>
      <Link to="/" className="mt-6 inline-block rounded-full bg-white text-black px-5 py-2 text-sm">Back home</Link>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const allProducts = useProducts().data;
  const buildGallery = (p: { image: string; gallery: string[] }) =>
    [p.image, ...p.gallery.filter((g: string) => g !== p.image)].slice(0, 4);
  const [gallery, setGallery] = useState<string[]>(() => buildGallery(product));
  // zoom state handled inside <ZoomImage />
  const rel = relatedFrom(allProducts, product);

  useEffect(() => { setGallery(buildGallery(product)); }, [product]);

  const swapToMain = (i: number) => {
    setGallery((g) => {
      const c = [...g];
      [c[0], c[i]] = [c[i], c[0]];
      return c;
    });
  };

  return (
    <main className="mx-auto max-w-7xl px-5 lg:px-8 pt-10">
      <nav className="text-xs text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link to={`/${product.category}` as "/fashion"} className="hover:text-foreground capitalize">
          {product.category.replace("-", " & ")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      <section className="grid lg:grid-cols-2 gap-10">
        <div>
          <ZoomImage src={gallery[0] ?? product.image} alt={product.title} />
          <div className="mt-4 grid grid-cols-3 gap-3">
            {gallery.slice(1).map((g, i) => (
              <button
                key={`${g}-${i}`}
                onClick={() => swapToMain(i + 1)}
                className="group aspect-square overflow-hidden rounded-xl ring-1 ring-white/10 hover:ring-white/40 transition"
              >
                <img src={g} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground capitalize">
            {product.category.replace("-", " & ")}
          </p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl font-semibold tracking-tight text-gradient">
            {product.title}
          </h1>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating) ? "fill-current text-white" : "text-white/20"}`} />
              ))}
              <span className="ml-2 text-muted-foreground">{product.rating.toFixed(1)}</span>
            </div>
          </div>
          <div className="mt-6 flex items-end gap-3">
            <span className="font-display text-4xl font-semibold">₹{product.price}</span>
          </div>
          <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
            {product.longDescription}
          </p>

          <div className="mt-8">
            {product.buyUrl ? (
              <a
                href={product.buyUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { void incrementProductViews({ data: { id: product.id } }); }}
                className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-white text-black px-8 py-4 text-base font-medium shadow-glow hover:shadow-[0_0_80px_-10px_rgba(255,255,255,0.55)] transition"
              >
                Buy Now
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </a>
            ) : (
              <button
                onClick={() => { void incrementProductViews({ data: { id: product.id } }); }}
                className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-white text-black px-8 py-4 text-base font-medium shadow-glow hover:shadow-[0_0_80px_-10px_rgba(255,255,255,0.55)] transition"
              >
                Buy Now
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
            )}
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Highlights</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  "Premium grade materials",
                  "Designed in-house",
                  "Engineered for longevity",
                  "Limited production run",
                ].map((h: string) => (
                  <li key={h} className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-foreground" />
                    <span className="text-muted-foreground">{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Specifications</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {product.specs.map((s: { label: string; value: string }) => (
                  <li key={s.label} className="flex justify-between gap-3 border-b border-white/5 pb-2">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span>{s.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {rel.length > 0 && (
        <section className="mt-28">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-gradient mb-8">
              You may also like
            </h2>
          </Reveal>
          <ProductScroller products={rel} max={8} />
        </section>
      )}
    </main>
  );
}

function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [on, setOn] = useState(false);
  const [dragging, setDragging] = useState(false);
  const posRef = useRef({ tx: 0, ty: 0 });
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    baseTx: number;
    baseTy: number;
    moved: boolean;
  } | null>(null);
  const scale = 2;

  const setTransform = (tx: number, ty: number, s: number, animate: boolean) => {
    posRef.current = { tx, ty };
    const img = imgRef.current;
    if (!img) return;
    img.style.transition = animate ? "transform 250ms ease" : "none";
    img.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${s})`;
  };

  const clamp = (tx: number, ty: number) => {
    const el = containerRef.current;
    if (!el) return { tx, ty };
    const maxX = (el.clientWidth * (scale - 1)) / 2;
    const maxY = (el.clientHeight * (scale - 1)) / 2;
    return {
      tx: Math.max(-maxX, Math.min(maxX, tx)),
      ty: Math.max(-maxY, Math.min(maxY, ty)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      baseTx: posRef.current.tx,
      baseTy: posRef.current.ty,
      moved: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") {
      const el = containerRef.current;
      if (!el) return;
      const clientX = e.clientX;
      const clientY = e.clientY;
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const r = el.getBoundingClientRect();
        const px = (clientX - r.left) / r.width;
        const py = (clientY - r.top) / r.height;
        const tx = (0.5 - px) * r.width * (scale - 1);
        const ty = (0.5 - py) * r.height * (scale - 1);
        setTransform(tx, ty, scale, false);
      });
      if (!on) setOn(true);
      return;
    }
    const d = dragRef.current;
    if (!d || !d.active || !on) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      d.moved = true;
      setDragging(true);
    }
    const { tx, ty } = clamp(d.baseTx + dx, d.baseTy + dy);
    setTransform(tx, ty, scale, false);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;
    const d = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (d && !d.moved) {
      if (on) {
        setOn(false);
        setTransform(0, 0, 1, true);
      } else {
        setOn(true);
      }
    }
  };

  const handleMouseLeave = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setOn(false);
    setTransform(0, 0, 1, true);
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-square overflow-hidden rounded-3xl glass ring-1 ring-white/10 select-none"
      style={{
        touchAction: on ? "none" : "pan-y",
        cursor: on ? (dragging ? "grabbing" : "grab") : "zoom-in",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseLeave={handleMouseLeave}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        className="h-full w-full object-cover"
        style={{
          transform: "translate3d(0,0,0) scale(1)",
          transition: "transform 250ms ease",
          willChange: "transform",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
        }}
      />
    </div>
  );
}
