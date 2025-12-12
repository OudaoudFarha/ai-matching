// src/layouts/CandidateLayout.tsx
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

interface Props {
  children: ReactNode;
}

export default function CandidateLayout({ children }: Props) {
  const { logout } = useAuth();

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: "#f5f5f5" }}>
      {/* HEADER */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 32px",
          borderBottom: "1px solid #222",
          background: "#181818",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 20 }}>
          <span style={{ color: "#4f9cff" }}>AI</span> Matching – Candidat
        </div>

        <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link to="/candidate" style={{ color: "#ddd", textDecoration: "none" }}>
            Offres
          </Link>

          <Link
            to="/candidate/upload"
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid #4f9cff",
              color: "#fff",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Uploader mon CV
          </Link>

<Link
  to="/candidate/matching"
  style={{
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid #22c55e",
    color: "#fff",
    textDecoration: "none",
    fontSize: 14,
  }}
>
  Matching IA
</Link>

          <button
            onClick={logout}
            style={{
              border: "none",
              background: "transparent",
              color: "#aaa",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Déconnexion
          </button>
        </nav>
      </header>

      {/* CONTENU */}
      <main style={{ maxWidth: 960, margin: "24px auto", padding: "0 24px" }}>
        {children}
      </main>
    </div>
  );
}
