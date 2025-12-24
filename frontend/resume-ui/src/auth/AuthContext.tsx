// src/auth/AuthContext.tsx
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import api from "../api";

type Role = "CANDIDATE" | "RECRUITER" | "ADMIN";

interface AuthUser {
  email: string;
  role: Role;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadUserFromStorage(): AuthUser | null {
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");
  const role = localStorage.getItem("role") as Role | null;

  if (token && email && role) return { token, email, role };
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // ✅ lecture synchro dès le départ
  const [user, setUser] = useState<AuthUser | null>(() => loadUserFromStorage());

  const login = async (email: string, password: string) => {
    const res = await api.post("/api/auth/login", { email, password });

    const token: string = res.data.token;
   const role = res.data.role.replace("ROLE_", "") as Role;

    localStorage.setItem("token", token);
    localStorage.setItem("email", res.data.email ?? email);
    localStorage.setItem("role", role);

    setUser({ email: res.data.email ?? email, role, token });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
