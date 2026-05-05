import { useCallback, useEffect, useState } from "react";

// Admin login is intentionally separate from end-user auth.
// Hardcoded credentials for the frontend mockup — replace with a real backend
// before going live. No signup, no OAuth.
export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin1234",
};

const STORAGE_KEY = "hanmadi:admin-auth";
const EVENT = "hanmadi:admin-auth-change";

interface AdminSession {
  username: string;
  loggedInAt: string;
}

const read = (): AdminSession | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
};

export const useAdminAuth = () => {
  const [session, setSession] = useState<AdminSession | null>(() => read());

  useEffect(() => {
    const sync = () => setSession(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const login = useCallback((username: string, password: string): boolean => {
    if (
      username.trim() === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      const next: AdminSession = { username, loggedInAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(EVENT));
      setSession(next);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(EVENT));
    setSession(null);
  }, []);

  return { session, isAdmin: !!session, login, logout };
};
