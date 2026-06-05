import { useEffect, useState } from "react";
import { fetchMe, loginUser, registerUser } from "@/lib/api";
import type { AuthUser } from "@/types";

const tokenKey = "wenzong-island-auth-token";
const userKey = "wenzong-island-auth-user";

function loadToken() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(tokenKey);
}

function loadUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const saved = window.localStorage.getItem(userKey);
  return saved ? (JSON.parse(saved) as AuthUser) : null;
}

function saveSession(token: string, user: AuthUser) {
  window.localStorage.setItem(tokenKey, token);
  window.localStorage.setItem(userKey, JSON.stringify(user));
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = loadToken();
    const savedUser = loadUser();
    setToken(savedToken);
    setUser(savedUser);

    if (!savedToken) {
      setLoading(false);
      return;
    }

    fetchMe(savedToken)
      .then((data) => {
        setUser(data.user);
        saveSession(savedToken, data.user);
      })
      .catch(() => {
        window.localStorage.removeItem(tokenKey);
        window.localStorage.removeItem(userKey);
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const data = await loginUser({ email, password });
    saveSession(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
  }

  async function register(email: string, password: string, name?: string) {
    const data = await registerUser({ email, password, name });
    saveSession(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    window.localStorage.removeItem(tokenKey);
    window.localStorage.removeItem(userKey);
    setToken(null);
    setUser(null);
  }

  return { loading, login, logout, register, token, user };
}
