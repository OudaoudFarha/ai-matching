import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // ✅ Ajout useNavigate
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
    if (!user || !user.email) return "Utilisateur";
    return user.email.split('@')[0];
  };

  // Fonction pour vérifier si une route est active (supporte les sous-routes)
  const isActive = (path: string) => {
    if (path === "/candidate" && location.pathname === "/candidate") return true;
    if (path !== "/candidate" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        
        {/* --- PARTIE GAUCHE (Logo + Profil) --- */}
        <div style={styles.leftSection}>
          
          {/* 1. LOGO CLIQUABLE -> DASHBOARD */}
          <div 
            style={styles.logoContainer} 
            onClick={() => navigate('/candidate')} // ✅ Redirection Dashboard
            title="Aller au tableau de bord"
          >
            <div style={styles.logoBadge}>AI</div>
            <span style={styles.logoText}>Matching</span>
          </div>

          {/* Petit séparateur */}
          <div style={styles.separator}></div>

          {/* 2. PROFIL */}
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
          
          {/* ✅ 1. Lien Tableau de bord */}
          <Link 
            to="/candidate" 
            style={isActive('/candidate') && location.pathname === '/candidate' ? styles.linkActive : styles.link}
          >
            📊 Dashboard
          </Link>

          {/* ✅ 2. Lien Offres (Corrigé vers /candidate/jobs) */}
          <Link 
            to="/candidate/jobs" 
            style={isActive('/candidate/jobs') ? styles.linkActive : styles.link}
          >
            🔍 Offres
          </Link>

          {/* 3. Lien Mes Candidatures */}
          <Link 
            to="/candidate/applications" 
            style={isActive('/candidate/applications') ? styles.linkActive : styles.link}
          >
            📂 Candidatures
          </Link>

          {/* 4. Lien Upload */}
          <Link
            to="/candidate/upload"
            style={styles.btnSecondary}
          >
            📄 Uploader CV
          </Link>

          {/* 5. Lien Matching IA */}
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
    cursor: "pointer", // ✅ Curseur main pour indiquer le clic
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
    display: "flex", 
    alignItems: "center",
    gap: "6px"
  },
  linkActive: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "14px",
    display: "flex", 
    alignItems: "center",
    gap: "6px"
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
  
  // --- SECTION PROFIL ---
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
    transition: "background 0.2s, border 0.2s",
    backgroundColor: "#f9fafb",
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