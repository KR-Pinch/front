import { useEffect, useState, useCallback } from "react";

export interface MockUser {
  username: string;
  avatar: string; // single character for fallback
}

const STORAGE_KEY = "hanmadi:auth";
const EVENT_NAME = "hanmadi:auth-change";

const readUser = (): MockUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MockUser;
  } catch {
    return null;
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<MockUser | null>(() => readUser());

  useEffect(() => {
    const sync = () => setUser(readUser());
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const login = useCallback((u: MockUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    window.dispatchEvent(new Event(EVENT_NAME));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(EVENT_NAME));
    setUser(null);
  }, []);

  return { user, isAuthenticated: !!user, login, logout };
};
