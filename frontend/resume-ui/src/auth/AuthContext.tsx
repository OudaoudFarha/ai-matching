// src/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  // 🔁 Charger l'utilisateur depuis localStorage au démarrage
  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role") as Role | null;

    if (token && email && role) {
      setUser({ token, email, role });
    }
  }, []);

  // 🔐 Login
  const login = async (email: string, password: string) => {
    const res = await api.post("/api/auth/login", { email, password });

    // d'après ton screenshot :
    // {
    //   "token": "...",
    //   "email": "farha2@gmail.com",
    //   "role": "CANDIDATE"
    // }
    const token: string = res.data.token;
    const role: Role = res.data.role;

    // stocker pour les prochains appels
    localStorage.setItem("token", token);
    localStorage.setItem("email", email);
    localStorage.setItem("role", role);

    setUser({ email, role, token });
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
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
