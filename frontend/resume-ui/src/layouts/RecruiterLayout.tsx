// src/layouts/RecruiterLayout.tsx
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

interface Props {
  children: ReactNode;
}

export default function RecruiterLayout({ children }: Props) {
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
          <span style={{ color: "#4f9cff" }}>AI</span> Matching – Recruteur
        </div>

        <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link
            to="/recruiter/jobs"
            style={{ color: "#ddd", textDecoration: "none" }}
          >
            Mes offres
          </Link>

          {/* plus tard tu pourras faire un vrai écran /recruiter/jobs/new */}
          <Link
            to="/recruiter/jobs"
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid #4f9cff",
              color: "#fff",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Ajouter une offre
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
