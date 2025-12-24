import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import api from "../api";

interface Props {
  children: ReactNode;
}

interface User {
  email: string;
  role: string;
}

export default function CandidateLayout({ children }: Props) {
  const { logout } = useAuth();
  const location = useLocation();
  
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api.get("/api/users/me")
      .then((res) => setUser(res.data))
      .catch(() => console.log("Non connecté"));
  }, []);

  const getInitials = () => {
    if (!user || !user.email) return "👤";
    return user.email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    if (!user || !user.email) return "Utilisateur";
    return user.email.split('@')[0];
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        
        {/* --- PARTIE GAUCHE (Logo + Profil) --- */}
        <div style={styles.leftSection}>
          
          {/* 1. LOGO */}
          <div style={styles.logoContainer}>
            <div style={styles.logoBadge}>AI</div>
            <span style={styles.logoText}>Matching</span>
          </div>

          {/* Petit séparateur visuel entre Logo et Profil */}
          <div style={styles.separator}></div>

          {/* 2. PROFIL (Déplacé ici à gauche) */}
          <Link to="/candidate/profile" style={styles.profileSection} title="Mon Profil">
            <div style={styles.avatarCircle}>
              {getInitials()}
            </div>
            <span style={styles.userName}>
              {getDisplayName()}
            </span>
          </Link>

        </div>

        {/* --- PARTIE DROITE (Navigation) --- */}
        <nav style={styles.nav}>
          <Link 
            to="/candidate" 
            style={isActive('/candidate') ? styles.linkActive : styles.link}
          >
            Offres
          </Link>

          <Link
            to="/candidate/upload"
            style={styles.btnSecondary}
          >
            📄 Uploader CV
          </Link>

          <Link
            to="/candidate/matching"
            style={styles.btnPrimary}
          >
            ✨ Matching IA
          </Link>

          <div style={styles.separator}></div>

          <button onClick={logout} style={styles.logoutBtn}>
            Déconnexion
          </button>
        </nav>
      </header>

      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
}

// --- STYLES ---
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
    color: "#1f2937",
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between", // Sépare la Gauche (Logo+Profil) de la Droite (Nav)
    alignItems: "center",
    padding: "0 32px",
    height: "70px",
    backgroundColor: "#ffffff",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  
  // NOUVEAU : Conteneur pour grouper Logo et Profil à gauche
  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "24px", // Espace entre le logo et le profil
  },

  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 700,
    fontSize: "20px",
    cursor: "pointer",
  },
  logoBadge: {
    backgroundColor: "#2563eb",
    color: "white",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 800,
  },
  logoText: {
    color: "#111827",
    letterSpacing: "-0.5px",
  },
  nav: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  link: {
    color: "#4b5563",
    textDecoration: "none",
    fontWeight: 500,
    fontSize: "14px",
    transition: "color 0.2s",
  },
  linkActive: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "14px",
  },
  btnSecondary: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    backgroundColor: "white",
    color: "#374151",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
  },
  btnPrimary: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
  },
  separator: {
    width: "1px",
    height: "24px",
    backgroundColor: "#e2e8f0",
    margin: "0 4px",
  },
  
  // --- SECTION PROFIL (Modifiée pour s'intégrer à gauche) ---
  profileSection: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "10px", 
    textDecoration: "none",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: "30px",
    border: "1px solid #f3f4f6", // Petit bord gris pour bien séparer
    transition: "background 0.2s, border 0.2s",
    backgroundColor: "#f9fafb", // Fond très léger pour le distinguer
  },
  avatarCircle: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#eff6ff", 
    color: "#2563eb",
    border: "1px solid #dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "12px",
    flexShrink: 0,
  },
  userName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
    maxWidth: "140px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  
  logoutBtn: {
    border: "none",
    background: "transparent",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    padding: "4px 8px",
  },
  main: {
    maxWidth: "1024px",
    margin: "40px auto",
    padding: "0 24px",
  },
};