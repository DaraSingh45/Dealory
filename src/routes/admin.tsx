import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown, ArrowUp, BarChart3, Boxes, Check, ChevronLeft, ChevronRight, Image as ImageIcon,
  LayoutGrid, LogOut, Package, Palette, Pencil, Plus, Search, Star, Tag, Trash2, TrendingUp, X,
} from "lucide-react";
import { CATEGORIES, type Category } from "@/data/products";
import {
  useProducts, useTheme, useSections,
  useCreateProduct, useUpdateProduct, useDeleteProduct,
  useSaveTheme, useSaveSections,
  resolveHero, resolveCategoryImage,
  SECTION_META, type SectionKey,
} from "@/lib/store";
import type { Product, HomeSections, ThemeSettings } from "@/lib/products-types";
import { verifyAdmin, adminLogout } from "@/lib/admin.functions";
import { clearAdminToken, getAdminToken } from "@/lib/admin-token";

function isValidImageUrl(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  // Allow local app paths like /assets/foo.jpg or /images/x.png
  if (t.startsWith("/") && !t.startsWith("//")) return true;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function friendlyError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  // Strip TanStack server-fn envelope JSON if present
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.message) return String(parsed.message);
  } catch { /* not json */ }
  return raw || "Something went wrong";
}

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Dealory" }, { name: "robots", content: "noindex" }] }),
  component: AdminGate,
});

function AdminGate() {
  const navigate = useNavigate();
  const verify = useServerFn(verifyAdmin);
  const [state, setState] = useState<"checking" | "ok" | "unauth">("checking");

  useEffect(() => {
    let cancelled = false;
    const token = getAdminToken();
    if (!token) {
      navigate({ to: "/admin-login", replace: true });
      return;
    }
    verify()
      .then((r) => {
        if (cancelled) return;
        if (r.ok) setState("ok");
        else {
          clearAdminToken();
          setState("unauth");
          navigate({ to: "/admin-login", replace: true });
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearAdminToken();
          navigate({ to: "/admin-login", replace: true });
        }
      });
    return () => { cancelled = true; };
  }, [navigate, verify]);

  if (state !== "ok") {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </main>
    );
  }
  return <Admin />;
}

type Draft = {
  id?: string;
  title: string;
  description: string;
  longDescription: string;
  price: number;
  rating: number;
  category: Category;
  image: string;
  gallery2: string;
  gallery3: string;
  gallery4: string;
  tag: string;
  recommendedIds: string[];
  buyUrl: string;
};

const empty: Draft = {
  title: "", description: "", longDescription: "", price: 0, rating: 4.5, category: "fashion",
  image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80",
  gallery2: "", gallery3: "", gallery4: "",
  tag: "",
  recommendedIds: [],
  buyUrl: "",
};

const PAGE_SIZES = [10, 20, 50] as const;

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Package; label: string; value: string; hint: string }) {
  return (
    <div className="glass rounded-2xl p-5 ring-1 ring-white/5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-4 font-display text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function ThemedSelect<T extends string>({
  value, onChange, options, ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const f = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, []);
  const current = options.find((o) => o.value === value);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className={`w-full inline-flex items-center justify-between gap-2 rounded-full bg-white/5 px-4 py-2.5 text-sm text-foreground ring-1 transition cursor-pointer ${
          open ? "ring-white/30 bg-white/10" : "ring-white/10 hover:ring-white/20"
        }`}
      >
        <span className="truncate">{current?.label}</span>
        <svg className={`h-3 w-3 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none">
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div
        role="listbox"
        className={`absolute left-0 right-0 top-full mt-2 origin-top rounded-2xl bg-neutral-950/95 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] overflow-hidden z-30 transition-all duration-200 ${
          open ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        <ul className="p-1.5 max-h-64 overflow-y-auto">
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => { onChange(o.value); setOpen(false); }}
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
  );
}

function Admin() {
  const navigate = useNavigate();
  const logout = useServerFn(adminLogout);
  const productsQuery = useProducts();
  const items: Product[] = productsQuery.data ?? [];

  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();
  const deleteMut = useDeleteProduct();

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"all" | Category>("all");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [perPage, setPerPage] = useState<number>(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      items.filter(
        (p) =>
          (cat === "all" || p.category === cat) &&
          (q.trim() === "" || p.title.toLowerCase().includes(q.toLowerCase())),
      ),
    [items, q, cat],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);
  useEffect(() => { setPage(1); }, [q, cat, perPage]);

  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  const save = async () => {
    if (!editing) return;
    const gallery = [editing.gallery2, editing.gallery3, editing.gallery4]
      .map((s) => s.trim())
      .filter(Boolean);
    const image = editing.image.trim();
    const buyUrl = editing.buyUrl.trim();

    // Client-side URL checks with custom UI messages
    if (!isValidImageUrl(image)) {
      toast.error("Invalid main image URL", {
        description: "Use an http(s):// link or a local path like /assets/image.jpg.",
      });
      return;
    }
    const badGallery = gallery.findIndex((g) => !isValidImageUrl(g));
    if (badGallery !== -1) {
      toast.error(`Invalid URL for Extra image ${badGallery + 1}`, {
        description: "Use an http(s):// link or a local path like /assets/image.jpg.",
      });
      return;
    }
    if (buyUrl && !isValidImageUrl(buyUrl)) {
      toast.error("Invalid Buy URL", {
        description: "Use an http(s):// link or a local path like /assets/image.jpg.",
      });
      return;
    }

    const tag = editing.tag.trim() || null;
    const badgeT = editing.tag.trim().toLowerCase();
    const badge: "new" | "trending" | "top" | null =
      badgeT === "new" || badgeT === "trending" || badgeT === "top"
        ? (badgeT as "new" | "trending" | "top")
        : null;

    const payload = {
      title: editing.title.trim(),
      description: editing.description.trim(),
      longDescription: editing.longDescription.trim() || editing.description.trim(),
      price: editing.price,
      rating: editing.rating,
      category: editing.category,
      image,
      gallery,
      highlights: [],
      specs: [
        { label: "Material", value: "Premium composite" },
        { label: "Durability", value: "Long-lasting performance" },
        { label: "Compatibility", value: "Universal fit" },
        { label: "Weight", value: "Optimized" },
      ],
      tag,
      badge,
      buyUrl: buyUrl || null,
      recommendedIds: editing.recommendedIds.slice(0, 8),
    };

    try {
      if (editing.id) {
        await updateMut.mutateAsync({ data: { id: editing.id, ...payload } });
      } else {
        await createMut.mutateAsync({ data: payload });
      }
      toast.success(editing.id ? "Product updated" : "Product created");
      setEditing(null);
    } catch (e) {
      toast.error("Couldn't save product", { description: friendlyError(e) });
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteMut.mutateAsync({ data: { id } });
      toast.success("Product deleted");
    } catch (e) {
      toast.error("Couldn't delete product", { description: friendlyError(e) });
    }
  };


  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    clearAdminToken();
    navigate({ to: "/admin-login", replace: true });
  };

  return (
    <main className="mx-auto max-w-7xl px-5 lg:px-8 pt-10 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Console</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl font-semibold tracking-tight text-gradient">
            Admin Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm hover:bg-white/5 transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
          <button
            onClick={() => setEditing({ ...empty })}
            className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium shadow-glow hover:opacity-90 hover:scale-[1.02] active:scale-95 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" /> New product
          </button>
        </div>
      </div>

      <section className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Package} label="Products" value={String(items.length)} hint="Across all categories" />
        <Stat icon={Boxes} label="Categories" value={String(CATEGORIES.length)} hint="Active universes" />
        <Stat icon={Star} label="Avg. rating" value={(items.reduce((s, p) => s + p.rating, 0) / Math.max(items.length, 1)).toFixed(2)} hint="Across catalogue" />
        <Stat icon={TrendingUp} label="Total views" value={items.reduce((s, p) => s + (p.views ?? 0), 0).toLocaleString()} hint="Across all products" />
      </section>

      <section className="mt-8 glass rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between ring-1 ring-white/5">
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 ring-1 ring-white/10 md:w-80">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCat("all")}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${cat === "all" ? "border-white/40 bg-white/10" : "border-white/10 text-muted-foreground hover:text-foreground"}`}
          >
            <Tag className="h-3 w-3 inline mr-1" /> All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => setCat(c.slug)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${cat === c.slug ? "border-white/40 bg-white/10" : "border-white/10 text-muted-foreground hover:text-foreground"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 overflow-hidden glass rounded-2xl ring-1 ring-white/5">
        <div className="hidden md:grid grid-cols-[80px_90px_2fr_1fr_100px_100px_120px] gap-4 px-5 py-3 border-b border-white/5 text-xs uppercase tracking-widest text-muted-foreground">
          <span>Image</span><span>ID</span><span>Product</span><span>Category</span><span>Price</span><span>Rating</span><span className="text-right">Actions</span>
        </div>
        <ul>
          {pageItems.map((p) => (
            <li key={p.id} className="grid grid-cols-2 md:grid-cols-[80px_90px_2fr_1fr_100px_100px_120px] gap-4 px-5 py-4 items-center border-b border-white/5 hover:bg-white/[0.02] transition">
              <img src={p.image} alt="" className="h-14 w-14 rounded-lg object-cover ring-1 ring-white/10" />
              <span className="hidden md:block text-xs tabular-nums text-muted-foreground">{p.id}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground truncate">{p.description}</p>
              </div>
              <span className="hidden md:block text-xs capitalize text-muted-foreground">{p.category.replace("-", " & ")}</span>
              <span className="hidden md:block text-sm">₹{p.price}</span>
              <span className="hidden md:flex items-center gap-1 text-sm"><Star className="h-3 w-3 fill-current" />{p.rating.toFixed(1)}</span>
              <div className="col-span-2 md:col-span-1 flex justify-end gap-2">
                <button
                  onClick={() =>
                    setEditing({
                      id: p.id,
                      title: p.title,
                      description: p.description,
                      longDescription: p.longDescription,
                      price: p.price,
                      rating: p.rating,
                      category: p.category,
                      image: p.image,
                      gallery2: p.gallery?.[0] ?? "",
                      gallery3: p.gallery?.[1] ?? "",
                      gallery4: p.gallery?.[2] ?? "",
                      tag: p.tag ?? p.badge ?? "",
                      recommendedIds: p.recommendedIds ?? [],
                      buyUrl: p.buyUrl ?? "",
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5 transition"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button
                  onClick={() => del(p.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10 hover:border-red-500/30 transition"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
        {filtered.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            {productsQuery.isLoading ? "Loading…" : "No products."}
          </p>
        )}

        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between px-5 py-4 border-t border-white/5">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
              <div className="flex items-center gap-1">
                <span className="hidden sm:inline">Per page</span>
                <div className="flex rounded-full ring-1 ring-white/10 overflow-hidden">
                  {PAGE_SIZES.map((n) => (
                    <button
                      key={n}
                      onClick={() => setPerPage(n)}
                      className={`px-3 py-1.5 text-xs transition ${perPage === n ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-white/10 hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs tabular-nums min-w-[3rem] text-center">
                <span className="text-foreground">{page}</span>
                <span className="text-muted-foreground"> / {totalPages}</span>
              </span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-white/10 hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Next page">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-8 glass rounded-2xl p-6 ring-1 ring-white/5">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Catalogue distribution</h3>
        </div>
        <div className="mt-6 space-y-3">
          {CATEGORIES.map((c) => {
            const count = items.filter((p) => p.category === c.slug).length;
            const pct = items.length ? (count / items.length) * 100 : 0;
            return (
              <div key={c.slug}>
                <div className="flex items-center justify-between text-xs">
                  <span>{c.label}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-white/80 to-white/30" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <ThemePanel />
      <SectionsPanel items={items} />

      {editing && (
        <ProductForm
          draft={editing}
          items={items}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSave={save}
          saving={createMut.isPending || updateMut.isPending}
        />
      )}
    </main>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function ProductForm({
  draft, items, onChange, onClose, onSave, saving,
}: {
  draft: Draft;
  items: Product[];
  onChange: (d: Draft) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [showTag, setShowTag] = useState(Boolean(draft.tag));
  const [recoOpen, setRecoOpen] = useState(false);
  const recoRef = useRef<HTMLDivElement>(null);
  const [recoQ, setRecoQ] = useState("");

  useEffect(() => {
    const f = (e: MouseEvent) => { if (recoRef.current && !recoRef.current.contains(e.target as Node)) setRecoOpen(false); };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, []);

  const toggleReco = (id: string) => {
    const has = draft.recommendedIds.includes(id);
    if (has) onChange({ ...draft, recommendedIds: draft.recommendedIds.filter((x) => x !== id) });
    else if (draft.recommendedIds.length < 8) onChange({ ...draft, recommendedIds: [...draft.recommendedIds, id] });
  };

  const recoCandidates = items.filter((p) => p.id !== draft.id && p.title.toLowerCase().includes(recoQ.toLowerCase()));

  const isValid =
    draft.title.trim() !== "" && draft.title.length <= 150 &&
    draft.description.trim() !== "" && draft.description.length <= 300 &&
    draft.price > 0 &&
    draft.rating >= 0 && draft.rating <= 5 &&
    !!draft.category &&
    draft.image.trim() !== "" &&
    draft.gallery2.trim() !== "" &&
    draft.gallery3.trim() !== "" &&
    draft.gallery4.trim() !== "";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full md:max-w-3xl glass-strong rounded-t-3xl md:rounded-3xl ring-1 ring-white/10 p-6 md:p-8 animate-rise max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{draft.id ? `Edit · ${draft.id}` : "New"}</p>
            <h2 className="font-display text-2xl font-semibold mt-1">{draft.id ? draft.title : "New product"}</h2>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-full border border-white/10 inline-flex items-center justify-center hover:bg-white/5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Main image preview</label>
            <div className="mt-2 aspect-square rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white/5">
              {draft.image
                ? <img src={draft.image} alt="" className="h-full w-full object-cover" />
                : <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">Paste an image URL</div>}
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Title (max 150)" required>
              <input
                value={draft.title}
                maxLength={150}
                onChange={(e) => onChange({ ...draft, title: e.target.value.slice(0, 150) })}
                className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30 transition"
              />
              <div className="mt-1 text-right text-[10px] text-muted-foreground tabular-nums">{draft.title.length}/150</div>
            </Field>
            <Field label="Description (max 300)" required>
              <textarea
                value={draft.description}
                maxLength={300}
                onChange={(e) => onChange({ ...draft, description: e.target.value.slice(0, 300) })}
                rows={3}
                className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30 transition resize-none"
              />
              <div className="mt-1 text-right text-[10px] text-muted-foreground tabular-nums">{draft.description.length}/300</div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price" required>
                <input
                  type="number"
                  value={draft.price}
                  onChange={(e) => onChange({ ...draft, price: Number(e.target.value) })}
                  className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30 transition"
                />
              </Field>
              <Field label="Rating" required>
                <input
                  type="number" step="0.1" min={0} max={5}
                  value={draft.rating}
                  onChange={(e) => onChange({ ...draft, rating: Number(e.target.value) })}
                  className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30 transition"
                />
              </Field>
            </div>
            <Field label="Category" required>
              <ThemedSelect<Category>
                value={draft.category}
                onChange={(v) => onChange({ ...draft, category: v })}
                options={CATEGORIES.map((c) => ({ value: c.slug, label: c.label }))}
                ariaLabel="Category"
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <Field label="Main image URL" required>
            <input
              value={draft.image}
              onChange={(e) => onChange({ ...draft, image: e.target.value })}
              placeholder="https://…"
              className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30 transition"
            />
          </Field>
          <div className="grid md:grid-cols-3 gap-3">
            {(["gallery2", "gallery3", "gallery4"] as const).map((key, idx) => {
              const value = draft[key];
              return (
                <div key={key}>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">Extra image {idx + 1}<span className="ml-1 text-red-400">*</span></label>
                  <div className="mt-2 aspect-square rounded-xl overflow-hidden ring-1 ring-white/10 bg-white/5">
                    {value
                      ? <img src={value} alt="" className="h-full w-full object-cover" />
                      : <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground">URL preview</div>}
                  </div>
                  <input
                    value={value}
                    onChange={(e) => onChange({ ...draft, [key]: e.target.value } as Draft)}
                    placeholder="https://…"
                    className="mt-2 w-full rounded-xl bg-white/5 px-3 py-2 text-xs outline-none ring-1 ring-white/10 focus:ring-white/30 transition"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Tag (optional · max 15 chars)</label>
          <div className="mt-2">
            {showTag || draft.tag ? (
              <div className="flex items-center gap-2">
                <input
                  value={draft.tag}
                  maxLength={15}
                  onChange={(e) => onChange({ ...draft, tag: e.target.value.slice(0, 15) })}
                  placeholder="e.g. Trending, Top, Limited…"
                  className="flex-1 rounded-full bg-white/5 px-4 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30 transition"
                />
                <span className="text-[10px] text-muted-foreground tabular-nums">{draft.tag.length}/15</span>
                <button
                  type="button"
                  onClick={() => { onChange({ ...draft, tag: "" }); setShowTag(false); }}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-white/10 hover:bg-white/5 transition"
                  aria-label="Remove tag"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowTag(true)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
              >
                <Plus className="h-3.5 w-3.5" /> Add custom tag
              </button>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Recommended (You may also like)</label>
            <span className="text-[10px] text-muted-foreground tabular-nums">{draft.recommendedIds.length}/8</span>
          </div>

          {draft.recommendedIds.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {draft.recommendedIds.map((id) => {
                const p = items.find((x) => x.id === id);
                if (!p) return null;
                return (
                  <span key={id} className="inline-flex items-center gap-2 rounded-full bg-white/5 ring-1 ring-white/10 pl-1 pr-2 py-1 text-xs">
                    <img src={p.image} alt="" className="h-5 w-5 rounded-full object-cover" />
                    <span className="max-w-[160px] truncate">{p.title}</span>
                    <button onClick={() => toggleReco(id)} aria-label="Remove" className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          <div ref={recoRef} className="relative mt-3">
            <button
              type="button"
              onClick={() => setRecoOpen((s) => !s)}
              className={`w-full inline-flex items-center justify-between gap-2 rounded-full bg-white/5 px-4 py-2.5 text-sm text-foreground ring-1 transition cursor-pointer ${
                recoOpen ? "ring-white/30 bg-white/10" : "ring-white/10 hover:ring-white/20"
              }`}
            >
              <span className="text-muted-foreground">Select products to recommend</span>
              <svg className={`h-3 w-3 text-muted-foreground transition-transform duration-300 ${recoOpen ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none">
                <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div
              className={`absolute left-0 right-0 top-full mt-2 origin-top rounded-2xl bg-neutral-950/95 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] overflow-hidden z-30 transition-all duration-200 ${
                recoOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              }`}
            >
              <div className="p-2 border-b border-white/5">
                <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={recoQ}
                    onChange={(e) => setRecoQ(e.target.value)}
                    placeholder="Search products"
                    className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <ul className="p-1.5 max-h-64 overflow-y-auto">
                {recoCandidates.map((p) => {
                  const selected = draft.recommendedIds.includes(p.id);
                  const atMax = !selected && draft.recommendedIds.length >= 8;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        disabled={atMax}
                        onClick={() => toggleReco(p.id)}
                        className={`w-full inline-flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-sm transition-colors ${
                          selected ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        } ${atMax ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <img src={p.image} alt="" className="h-7 w-7 rounded-md object-cover ring-1 ring-white/10" />
                          <span className="min-w-0 text-left">
                            <span className="block truncate">{p.title}</span>
                            <span className="block text-[10px] text-muted-foreground capitalize">{p.category}</span>
                          </span>
                        </span>
                        {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    </li>
                  );
                })}
                {recoCandidates.length === 0 && (
                  <li className="px-3 py-4 text-center text-xs text-muted-foreground">No matches</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Field label="Buy URL (opens in new tab)">
            <input
              type="url"
              value={draft.buyUrl}
              onChange={(e) => onChange({ ...draft, buyUrl: e.target.value })}
              placeholder="https://merchant.example.com/product/123"
              className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30 transition"
            />
          </Field>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          {!isValid && (
            <span className="text-[11px] text-muted-foreground mr-auto">All fields with * are required</span>
          )}
          <button onClick={onClose} className="rounded-full border border-white/10 px-5 py-2.5 text-sm hover:bg-white/5 transition cursor-pointer">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!isValid || saving}
            className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium hover:opacity-90 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save product"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ThemePanel() {
  const themeQuery = useTheme();
  const saveMut = useSaveTheme();
  const [mode, setMode] = useState<"none" | "hero" | "cats">("none");
  const initial = themeQuery.data;
  const [hero, setHero] = useState<[string, string, string]>(resolveHero(initial));
  const [cats, setCats] = useState<Record<Category, string>>({
    fashion: "", shoes: "", electronics: "", beauty: "", health: "",
  });

  useEffect(() => {
    if (initial) {
      setHero(resolveHero(initial));
      setCats({
        fashion: resolveCategoryImage(initial, "fashion"),
        shoes: resolveCategoryImage(initial, "shoes"),
        electronics: resolveCategoryImage(initial, "electronics"),
        beauty: resolveCategoryImage(initial, "beauty"),
        health: resolveCategoryImage(initial, "health"),
      });
    }
  }, [initial]);

  const resetHero = () => setHero(resolveHero(themeQuery.data));
  const resetCats = () => themeQuery.data && setCats({
    fashion: resolveCategoryImage(themeQuery.data, "fashion"),
    shoes: resolveCategoryImage(themeQuery.data, "shoes"),
    electronics: resolveCategoryImage(themeQuery.data, "electronics"),
    beauty: resolveCategoryImage(themeQuery.data, "beauty"),
    health: resolveCategoryImage(themeQuery.data, "health"),
  });

  const saveAll = async (next: Partial<ThemeSettings> = {}) => {
    const heroCards = ((next.heroCards ?? hero) as string[]).map((s) => s.trim()) as [string, string, string];
    const catsTrimmed = Object.fromEntries(
      Object.entries(next.categoryImages ?? cats).map(([k, v]) => [k, String(v).trim()]),
    ) as Record<Category, string>;

    // Client-side URL validation with friendly UI messages
    const badHero = heroCards.findIndex((u) => !isValidImageUrl(u));
    if (next.heroCards !== undefined || mode === "hero") {
      if (badHero !== -1) {
        toast.error(`Invalid URL for Hero Card ${badHero + 1}`, {
          description: "Use an http(s):// link or a local path like /assets/image.jpg.",
        });
        return;
      }
    }
    if (next.categoryImages !== undefined || mode === "cats") {
      const badCat = (Object.entries(catsTrimmed) as [Category, string][]).find(
        ([, v]) => !isValidImageUrl(v),
      );
      if (badCat) {
        const label = CATEGORIES.find((c) => c.slug === badCat[0])?.label ?? badCat[0];
        toast.error(`Invalid URL for ${label} image`, {
          description: "Use an http(s):// link or a local path like /assets/image.jpg.",
        });
        return;
      }
    }

    const payload = { heroCards, categoryImages: catsTrimmed };
    try {
      await saveMut.mutateAsync({ data: payload });
      toast.success("Theme saved");
      setMode("none");
    } catch (e) {
      toast.error("Couldn't save theme", { description: friendlyError(e) });
    }
  };


  return (
    <section className="mt-8 glass rounded-2xl p-6 ring-1 ring-white/5">
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Theme</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Customize the hero cards and category images shown across the site.</p>

      <div className="mt-5 grid sm:grid-cols-2 gap-3">
        <button
          onClick={() => setMode(mode === "hero" ? "none" : "hero")}
          className={`group flex items-center gap-3 rounded-2xl px-4 py-4 text-left ring-1 transition cursor-pointer ${
            mode === "hero" ? "bg-white/10 ring-white/30" : "bg-white/5 ring-white/10 hover:bg-white/[0.08]"
          }`}
        >
          <span className="h-9 w-9 rounded-full bg-white/10 inline-flex items-center justify-center">
            <ImageIcon className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-medium">Edit hero cards</span>
            <span className="block text-xs text-muted-foreground">3 floating images on home hero</span>
          </span>
        </button>
        <button
          onClick={() => setMode(mode === "cats" ? "none" : "cats")}
          className={`group flex items-center gap-3 rounded-2xl px-4 py-4 text-left ring-1 transition cursor-pointer ${
            mode === "cats" ? "bg-white/10 ring-white/30" : "bg-white/5 ring-white/10 hover:bg-white/[0.08]"
          }`}
        >
          <span className="h-9 w-9 rounded-full bg-white/10 inline-flex items-center justify-center">
            <Boxes className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-medium">Edit category images</span>
            <span className="block text-xs text-muted-foreground">Used on cards & category banners</span>
          </span>
        </button>
      </div>

      {mode === "hero" && (
        <div className="mt-6 animate-rise">
          <div className="grid sm:grid-cols-3 gap-4">
            {hero.map((url, i) => (
              <div key={i}>
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Card {i + 1}</label>
                <div className="mt-2 aspect-square rounded-xl overflow-hidden ring-1 ring-white/10 bg-white/5">
                  {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <input
                  value={url}
                  onChange={(e) => {
                    const next = [...hero] as [string, string, string];
                    next[i] = e.target.value;
                    setHero(next);
                  }}
                  placeholder="https://…"
                  className="mt-2 w-full rounded-xl bg-white/5 px-3 py-2 text-xs outline-none ring-1 ring-white/10 focus:ring-white/30 transition"
                />
              </div>
            ))}
          </div>
          <ThemeActions
            saving={saveMut.isPending}
            onCancel={() => { resetHero(); setMode("none"); }}
            onSave={() => saveAll({ heroCards: hero })}
          />
        </div>
      )}

      {mode === "cats" && (
        <div className="mt-6 animate-rise">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((c) => (
              <div key={c.slug}>
                <label className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</label>
                <div className="mt-2 aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-white/10 bg-white/5">
                  {cats[c.slug] ? <img src={cats[c.slug]} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <input
                  value={cats[c.slug] ?? ""}
                  onChange={(e) => setCats({ ...cats, [c.slug]: e.target.value })}
                  placeholder="https://…"
                  className="mt-2 w-full rounded-xl bg-white/5 px-3 py-2 text-xs outline-none ring-1 ring-white/10 focus:ring-white/30 transition"
                />
              </div>
            ))}
          </div>
          <ThemeActions
            saving={saveMut.isPending}
            onCancel={() => { resetCats(); setMode("none"); }}
            onSave={() => saveAll({ categoryImages: cats })}
          />
        </div>
      )}
    </section>
  );
}

function ThemeActions({ onCancel, onSave, saving }: { onCancel: () => void; onSave: () => void; saving: boolean }) {
  return (
    <div className="mt-6 flex items-center justify-end gap-3">
      <button onClick={onCancel} className="rounded-full border border-white/10 px-5 py-2.5 text-sm hover:bg-white/5 transition cursor-pointer">
        Cancel
      </button>
      <button onClick={onSave} disabled={saving} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium hover:opacity-90 hover:scale-[1.02] active:scale-95 transition cursor-pointer disabled:opacity-40">
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

function SectionsPanel({ items }: { items: Product[] }) {
  const sectionsQuery = useSections();
  const saveMut = useSaveSections();
  const [mode, setMode] = useState<SectionKey | "none">("none");
  const [sections, setSections] = useState<HomeSections>({
    featured: [], trending: [], newArrivals: [], topRated: [],
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQ, setPickerQ] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sectionsQuery.data) setSections(sectionsQuery.data);
  }, [sectionsQuery.data]);

  useEffect(() => {
    const f = (e: MouseEvent) => { if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false); };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, []);

  const current = mode === "none" ? [] : sections[mode];

  const move = (idx: number, dir: -1 | 1) => {
    if (mode === "none") return;
    const next = [...current];
    const t = idx + dir;
    if (t < 0 || t >= next.length) return;
    [next[idx], next[t]] = [next[t], next[idx]];
    setSections({ ...sections, [mode]: next });
  };
  const remove = (id: string) => {
    if (mode === "none") return;
    setSections({ ...sections, [mode]: current.filter((x) => x !== id) });
  };
  const add = (id: string) => {
    if (mode === "none") return;
    if (current.includes(id) || current.length >= 10) return;
    setSections({ ...sections, [mode]: [...current, id] });
  };

  const candidates = items.filter(
    (p) => !current.includes(p.id) && p.title.toLowerCase().includes(pickerQ.toLowerCase()),
  );

  const keys: SectionKey[] = ["featured", "trending", "newArrivals", "topRated"];

  const onSaveSections = async () => {
    try {
      await saveMut.mutateAsync({ data: sections });
      toast.success("Sections saved");
      setMode("none");
    } catch (e) {
      toast.error("Couldn't save sections", { description: friendlyError(e) });
    }
  };

  return (
    <section className="mt-8 glass rounded-2xl p-6 ring-1 ring-white/5">
      <div className="flex items-center gap-2">
        <LayoutGrid className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Manage sections</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Choose which products (up to 10) appear in each home section, and the order they show in.</p>

      <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => setMode(mode === k ? "none" : k)}
            className={`text-left rounded-2xl px-4 py-4 ring-1 transition cursor-pointer ${
              mode === k ? "bg-white/10 ring-white/30" : "bg-white/5 ring-white/10 hover:bg-white/[0.08]"
            }`}
          >
            <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">{SECTION_META[k].eyebrow}</span>
            <span className="block text-sm font-medium mt-1">{SECTION_META[k].title}</span>
            <span className="block text-[10px] text-muted-foreground mt-1">{sections[k].length}/10 products</span>
          </button>
        ))}
      </div>

      {mode !== "none" && (
        <div className="mt-6 animate-rise">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">
              Editing <span className="text-foreground">{SECTION_META[mode].title}</span> · {current.length}/10
            </p>
          </div>

          <ul className="space-y-2">
            {current.map((id: string, i: number) => {
              const p = items.find((x) => x.id === id);
              if (!p) return null;
              return (
                <li key={id} className="flex items-center gap-3 rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2">
                  <span className="text-xs text-muted-foreground tabular-nums w-6 text-center">{i + 1}</span>
                  <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover ring-1 ring-white/10" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{p.title}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{p.category}</p>
                  </div>
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-white/10 hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Move up">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === current.length - 1} className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-white/10 hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Move down">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => remove(id)} className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-white/10 text-red-300 hover:bg-red-500/10 hover:border-red-500/30 transition" aria-label="Remove">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
            {current.length === 0 && (
              <li className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-muted-foreground">
                No products yet. Add up to 10 below.
              </li>
            )}
          </ul>

          <div ref={pickerRef} className="relative mt-4">
            <button
              type="button"
              onClick={() => setPickerOpen((s) => !s)}
              disabled={current.length >= 10}
              className={`w-full inline-flex items-center justify-between gap-2 rounded-full bg-white/5 px-4 py-2.5 text-sm text-foreground ring-1 transition cursor-pointer ${
                pickerOpen ? "ring-white/30 bg-white/10" : "ring-white/10 hover:ring-white/20"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <span className="text-muted-foreground">{current.length >= 10 ? "Maximum reached" : "Add a product to this section"}</span>
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <div
              className={`absolute left-0 right-0 top-full mt-2 origin-top rounded-2xl bg-neutral-950/95 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] overflow-hidden z-30 transition-all duration-200 ${
                pickerOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              }`}
            >
              <div className="p-2 border-b border-white/5">
                <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={pickerQ}
                    onChange={(e) => setPickerQ(e.target.value)}
                    placeholder="Search products"
                    className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <ul className="p-1.5 max-h-64 overflow-y-auto">
                {candidates.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => add(p.id)}
                      className="w-full inline-flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
                    >
                      <img src={p.image} alt="" className="h-7 w-7 rounded-md object-cover ring-1 ring-white/10" />
                      <span className="min-w-0 text-left">
                        <span className="block truncate">{p.title}</span>
                        <span className="block text-[10px] text-muted-foreground capitalize">{p.category}</span>
                      </span>
                    </button>
                  </li>
                ))}
                {candidates.length === 0 && (
                  <li className="px-3 py-4 text-center text-xs text-muted-foreground">No matches</li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={() => { if (sectionsQuery.data) setSections(sectionsQuery.data); setMode("none"); }}
              className="rounded-full border border-white/10 px-5 py-2.5 text-sm hover:bg-white/5 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onSaveSections}
              disabled={saveMut.isPending}
              className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium hover:opacity-90 hover:scale-[1.02] active:scale-95 transition cursor-pointer disabled:opacity-40"
            >
              {saveMut.isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
