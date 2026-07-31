import { Link } from "@tanstack/react-router";
import dealoryLogo from "@/assets/dealory-logo.png";

export function BrandHeader() {
  return (
    <header className="sticky top-0 z-50 glass-strong">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-5 lg:px-8">
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
      </div>
    </header>
  );
}
