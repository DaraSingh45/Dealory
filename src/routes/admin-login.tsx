import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { LogIn, Lock, User as UserIcon } from "lucide-react";
import dealoryLogo from "@/assets/dealory-logo.png";
import { adminLogin } from "@/lib/admin.functions";
import { setAdminToken, getAdminToken } from "@/lib/admin-token";

export const Route = createFileRoute("/admin-login")({
  head: () => ({ meta: [{ title: "Admin Login — Dealory" }, { name: "robots", content: "noindex" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const login = useServerFn(adminLogin);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "blocked"; text: string } | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  // If already logged in, skip the page.
  useEffect(() => {
    if (getAdminToken()) navigate({ to: "/admin", replace: true });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await login({ data: { username, password } });
      if (res.ok) {
        setAdminToken(res.token);
        navigate({ to: "/admin", replace: true });
      } else {
        setMessage({ kind: res.blocked ? "blocked" : "error", text: res.message });
        setShakeKey((k) => k + 1);
        setPassword("");
      }
    } catch (err) {
      setMessage({ kind: "error", text: (err as Error).message || "Login failed" });
      setShakeKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-5 overflow-hidden">
      {/* Premium ambient light */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[900px] rounded-full blur-3xl opacity-70 animate-glow-pulse"
          style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.32), rgba(255,255,255,0.08) 55%, transparent 75%)" }}
        />
        <div
          className="absolute left-1/2 -top-40 -translate-x-1/2 h-[300px] w-[1200px] blur-3xl opacity-40"
          style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.4), transparent 70%)" }}
        />
      </div>

      <div className="w-full max-w-md">
        {/* Logo intro */}
        <div className="flex flex-col items-center text-center login-intro">
          <span className="relative inline-flex items-center justify-center">
            <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 blur-2xl opacity-80" style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.7), rgba(255,255,255,0.15) 55%, transparent 75%)" }} />
            <img src={dealoryLogo} alt="Dealory" className="h-14 w-14 object-contain drop-shadow-[0_2px_24px_rgba(255,255,255,0.65)]" />
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent drop-shadow-[0_2px_24px_rgba(255,255,255,0.45)]">
            Dealory
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.4em] text-muted-foreground">Admin Console</p>
        </div>

        <form
          ref={formRef}
          onSubmit={onSubmit}
          key={shakeKey}
          className="mt-10 glass-strong rounded-3xl p-6 md:p-8 ring-1 ring-white/10 login-card shake-on-error"
        >
          <div className="space-y-5">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Username</label>
              <div className="mt-2 flex items-center gap-2 rounded-full bg-white/5 px-4 py-2.5 ring-1 ring-white/10 focus-within:ring-white/30 transition">
                <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  autoFocus
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Username"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Password</label>
              <div className="mt-2 flex items-center gap-2 rounded-full bg-white/5 px-4 py-2.5 ring-1 ring-white/10 focus-within:ring-white/30 transition">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Password (case-sensitive)"
                />
              </div>
            </div>

            {message && (
              <div
                role="alert"
                className={`rounded-2xl px-4 py-3 text-xs animate-rise ring-1 ${
                  message.kind === "blocked"
                    ? "bg-red-500/10 ring-red-500/30 text-red-200"
                    : "bg-white/5 ring-white/20 text-foreground/80"
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || message?.kind === "blocked"}
              className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-white text-black px-6 py-3 text-sm font-medium shadow-glow hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Verifying…" : (<><LogIn className="h-4 w-4" /> Sign in</>)}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Protected area. Authorized personnel only.
        </p>
      </div>
    </main>
  );
}
