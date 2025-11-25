// src/pages/RegisterPage.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

type Role = "CANDIDATE" | "RECRUITER";

export default function RegisterPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CANDIDATE");
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/auth/register", { email, password, role });
      alert("Compte créé avec succès, vous pouvez vous connecter.");
      nav("/login");
    } catch {
      setError("Impossible de créer le compte (email déjà utilisé ?).");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="logo">AI Matching</h1>
        <p className="subtitle">
          Créez votre compte candidat ou recruteur.
        </p>

        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Inscription</h2>

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
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="CANDIDATE">Candidat</option>
            <option value="RECRUITER">Recruteur</option>
          </select>

          <button type="submit">Créer un compte</button>
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
          <span className="small-text">Déjà inscrit(e) ?</span>
          <Link to="/login" className="link">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
