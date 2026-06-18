import { useEffect, useState } from "react";
import { fetchMe, loginUser, registerUser } from "@/lib/api";
import type { AuthUser } from "@/types";
import type { UserRole } from "@/types/education";

const tokenKey = "wenzong-island-auth-token";
const userKey = "wenzong-island-auth-user";
const testTokenPrefix = "sayhi-test-session:";

const testAccounts: Record<string, AuthUser> = {
  "admin@test.com": { email: "admin@test.com", id: "test-admin", name: "测试管理员", role: "admin" },
  "student@test.com": { email: "student@test.com", id: "test-student", name: "测试学生", role: "student" },
  "teacher@test.com": { email: "teacher@test.com", id: "test-teacher", name: "测试教师", role: "teacher" }
};

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

    if (savedToken.startsWith(testTokenPrefix) && savedUser) {
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

  async function login(email: string, password: string, requestedRole?: UserRole) {
    const normalizedEmail = email.trim().toLowerCase();
    const testUser = testAccounts[normalizedEmail];
    if (testUser && password === "123456") {
      if (requestedRole && testUser.role !== requestedRole && testUser.role !== "admin") {
        throw new Error(`该测试账号属于${testUser.role === "teacher" ? "教师" : "学生"}身份`);
      }
      const testToken = `${testTokenPrefix}${testUser.id}`;
      saveSession(testToken, testUser);
      setToken(testToken);
      setUser(testUser);
      return testUser;
    }

    const data = await loginUser({ email, password });
    saveSession(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(email: string, password: string, name?: string) {
    const data = await registerUser({ email, password, name });
    saveSession(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    window.localStorage.removeItem(tokenKey);
    window.localStorage.removeItem(userKey);
    setToken(null);
    setUser(null);
  }

  return { loading, login, logout, register, token, user };
}
