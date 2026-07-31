import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import dealoryLogo from "@/assets/dealory-logo.png";



const links = [
  { to: "/", label: "Home" },
  { to: "/fashion", label: "Fashion" },
  { to: "/shoes", label: "Shoes" },
  { to: "/electronics", label: "Electronics" },
  { to: "/beauty", label: "Beauty" },
  { to: "/health", label: "Health" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      setSearchOpen(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate({ to: "/search", search: { q } });
    setSearchOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled ? "glass-strong" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 group relative">
          <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 blur-2xl opacity-70" style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.55), rgba(255,255,255,0.15) 55%, transparent 75%)" }} />
          <span className="relative inline-flex items-center justify-center">
            <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 blur-xl opacity-80" style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.6), rgba(255,255,255,0.15) 55%, transparent 75%)" }} />
            <img src={dealoryLogo} alt="Dealory" className="h-8 w-8 md:h-9 md:w-9 object-contain drop-shadow-[0_2px_18px_rgba(255,255,255,0.55)]" />
          </span>
          <span className="font-display text-2xl md:text-[1.7rem] font-bold tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent drop-shadow-[0_2px_24px_rgba(255,255,255,0.55)]">
            Dealory
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="underline-grow text-sm text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "underline-grow text-sm text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            aria-label="Search"
            onClick={() => setSearchOpen((s) => !s)}
            className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-white/10 hover:bg-white/5 transition"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            aria-label="Menu"
            onClick={() => setOpen((s) => !s)}
            className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-full border border-white/10 hover:bg-white/5 transition"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div
        className={`overflow-hidden transition-all duration-500 ${searchOpen ? "max-h-24" : "max-h-0"}`}
      >
        <form
          onSubmit={submit}
          className="mx-auto max-w-3xl px-5 lg:px-8 pb-4 pt-1"
        >
          <div className="glass flex items-center gap-3 rounded-full px-5 py-3 ring-1 ring-white/10 focus-within:ring-white/30 transition">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus={searchOpen}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for products, categories…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="rounded-full bg-white text-black px-4 py-1.5 text-xs font-medium hover:opacity-90 transition"
            >
              Search
            </button>
            <button
              type="button"
              aria-label="Close search"
              onClick={() => { setSearchOpen(false); setQ(""); }}
              className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-white/10 hover:bg-white/10 transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>

          </div>
        </form>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-500 ${open ? "max-h-96" : "max-h-0"}`}
      >
        <nav className="glass-strong px-5 py-4 flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition"
              activeProps={{ className: "rounded-lg px-3 py-3 text-sm text-foreground bg-white/5" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
