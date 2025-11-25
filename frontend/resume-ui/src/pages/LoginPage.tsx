// src/pages/LoginPage.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      const role = localStorage.getItem("role");
      if (role === "CANDIDATE") {
        nav("/candidate", { replace: true });
      } else if (role === "RECRUITER") {
        nav("/recruiter/jobs", { replace: true });
      } else {
        nav("/login", { replace: true });
      }
    } catch {
      setError("Email ou mot de passe incorrect");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="logo">AI Matching</h1>
        <p className="subtitle">
          Connectez-vous pour accéder à votre espace.
        </p>

        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Connexion</h2>

        <form onSubmit={onSubmit} className="auth-form">
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Se connecter</button>
          {error && <p className="error">{error}</p>}
        </form>

        <div
          style={{
            marginTop: 16,
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span className="small-text">Pas encore de compte ?</span>
          <Link to="/register" className="link">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
