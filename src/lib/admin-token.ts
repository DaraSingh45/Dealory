// Client-side admin token storage (sessionStorage).
const KEY = "dealory:admin-token";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(t: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, t);
  } catch {
    /* ignore */
  }
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
