import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // ✅ Ajout de useNavigate
import { useAuth } from "../auth/AuthContext";
import api from "../api";

interface Props {
  children: ReactNode;
}

interface User {
  email: string;
  role: string;
}

export default function RecruiterLayout({ children }: Props) {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate(); // ✅ Hook de navigation
  
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
    if (!user || !user.email) return "Recruteur";
    return user.email.split('@')[0];
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        
        {/* --- PARTIE GAUCHE (Logo + Profil) --- */}
        <div style={styles.leftSection}>
            
            {/* LOGO CLIQUABLE VERS DASHBOARD */}
            <div 
              style={styles.logoContainer} 
              onClick={() => navigate('/recruiter')} // ✅ Redirection vers Dashboard
            >
              <div style={styles.logoBadge}>AI</div>
              <span style={styles.logoText}>Matching</span>
              <span style={styles.roleBadge}>Recruteur</span>
            </div>

            {/* Petit séparateur visuel */}
            <div style={styles.separator}></div>

            {/* PROFIL (Aligné à gauche) */}
            <Link to="/recruiter/profile" style={styles.profileSection} title="Mon Profil">
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
            to="/recruiter/jobs"
            style={isActive("/recruiter/jobs") ? styles.linkActive : styles.link}
          >
            📋 Mes Offres
          </Link>

          <div style={styles.separator}></div>

          <button onClick={logout} style={styles.logoutBtn}>
            Déconnexion
          </button>
        </nav>
      </header>

      {/* CONTENU PRINCIPAL */}
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
    backgroundColor: "#f1f5f9",
    color: "#0f172a", 
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 32px",
    height: "70px",
    backgroundColor: "#ffffff",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  
  // Conteneur Gauche
  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },

  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 700,
    fontSize: "20px",
    cursor: "pointer", // ✅ Changé de 'default' à 'pointer'
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
    color: "#0f172a",
    letterSpacing: "-0.5px",
  },
  roleBadge: {
    backgroundColor: "#0f172a",
    color: "white",
    fontSize: "11px",
    padding: "2px 8px",
    borderRadius: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontWeight: 600,
    marginLeft: "8px",
  },
  nav: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  link: {
    color: "#64748b",
    textDecoration: "none",
    fontWeight: 500,
    fontSize: "14px",
    transition: "color 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  linkActive: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  separator: {
    width: "1px",
    height: "24px",
    backgroundColor: "#e2e8f0",
    margin: "0 4px",
  },
  
  // --- STYLE PROFIL ---
  profileSection: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "10px", 
    textDecoration: "none",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: "30px",
    border: "1px solid #f3f4f6", 
    backgroundColor: "#f9fafb", 
    transition: "background 0.2s, border 0.2s",
  },
  avatarCircle: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    border: "1px solid #e2e8f0",
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
    color: "#334155",
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
    transition: "color 0.2s",
  },
  main: {
    maxWidth: "1100px",
    margin: "40px auto",
    padding: "0 24px",
  },
};