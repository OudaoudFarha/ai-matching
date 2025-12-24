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
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await api.post("/api/auth/register", { email, password, role });
      // On redirige vers le login après succès (ou on pourrait auto-login)
      nav("/login");
    } catch (err: any) {
      setError("Impossible de créer le compte (cet email est peut-être déjà pris).");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      
      {/* CÔTÉ GAUCHE : FORMULAIRE */}
      <div style={styles.leftSection}>
        <div style={styles.formContainer}>
          
          <div style={{ marginBottom: 32 }}>
            <div style={styles.logoBadge}>AI</div>
            <h1 style={styles.title}>Créer un compte</h1>
            <p style={styles.subtitle}>Rejoignez la plateforme de recrutement nouvelle génération.</p>
          </div>

          <form onSubmit={onSubmit} style={styles.form}>
            
            {/* SÉLECTEUR DE RÔLE (Custom UI) */}
            <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
              <label style={styles.label}>Je suis...</label>
              <div style={styles.roleSelector}>
                <button
                  type="button"
                  onClick={() => setRole("CANDIDATE")}
                  style={role === "CANDIDATE" ? styles.roleBtnActive : styles.roleBtn}
                >
                  👨‍💻 Candidat
                </button>
                <button
                  type="button"
                  onClick={() => setRole("RECRUITER")}
                  style={role === "RECRUITER" ? styles.roleBtnActive : styles.roleBtn}
                >
                  👔 Recruteur
                </button>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Adresse Email</label>
              <input
                placeholder="name@exemple.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Mot de passe</label>
              <input
                placeholder="8 caractères minimum"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
            </div>

            {error && <div style={styles.errorAlert}>{error}</div>}

            <button
              type="submit"
              disabled={isLoading}
              style={isLoading ? styles.btnDisabled : styles.btnPrimary}
            >
              {isLoading ? "Création en cours..." : "S'inscrire gratuitement"}
            </button>
          </form>

          <div style={styles.footer}>
            Déjà un compte ? <Link to="/login" style={styles.link}>Se connecter</Link>
          </div>
        </div>
      </div>

      {/* CÔTÉ DROIT : VISUEL */}
      <div style={styles.rightSection}>
        <div style={styles.visualContent}>
          <h2 style={styles.visualTitle}>Lancez votre carrière.</h2>
          <p style={styles.visualText}>
            Que vous cherchiez le job de vos rêves ou le candidat idéal, 
            notre IA fait le travail difficile pour vous.
          </p>
          {/* Décoration géométrique */}
          <div style={styles.abstractSquare}></div>
        </div>
      </div>

    </div>
  );
}

// --- STYLES (Identiques Login Page + Role Selector) ---
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    fontFamily: "'Inter', sans-serif",
    backgroundColor: "white",
  },
  // GAUCHE
  leftSection: {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px",
    backgroundColor: "white",
    zIndex: 2,
  },
  formContainer: {
    width: "100%",
    maxWidth: "400px", // Un peu plus large pour les boutons rôles
  },
  logoBadge: {
    display: "inline-block",
    backgroundColor: "#0f172a",
    color: "white",
    fontWeight: 800,
    padding: "8px 12px",
    borderRadius: "8px",
    marginBottom: "24px",
    fontSize: "18px",
  },
  title: {
    fontSize: "32px",
    fontWeight: 800,
    color: "#0f172a",
    margin: "0 0 12px 0",
    letterSpacing: "-1px",
  },
  subtitle: { color: "#64748b", fontSize: "16px", margin: 0, lineHeight: "1.5" },
  
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "14px", fontWeight: 600, color: "#334155" },
  
  // SELECTEUR DE ROLE (NOUVEAU)
  roleSelector: {
    display: "flex",
    gap: "12px",
  },
  roleBtn: {
    flex: 1,
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    backgroundColor: "white",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  roleBtnActive: {
    flex: 1,
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #0f172a", // Bordure noire
    backgroundColor: "#f1f5f9", // Fond grisé léger
    color: "#0f172a", // Texte noir
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 0 0 1px #0f172a", // Effet "gras"
  },

  input: {
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    fontSize: "16px",
    outline: "none",
    transition: "all 0.2s",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
  },
  btnPrimary: {
    marginTop: "8px",
    padding: "16px",
    backgroundColor: "#0f172a",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  btnDisabled: {
    marginTop: "8px",
    padding: "16px",
    backgroundColor: "#cbd5e1",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "not-allowed",
  },
  errorAlert: {
    padding: "12px",
    backgroundColor: "#fef2f2",
    color: "#ef4444",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
  },
  footer: { marginTop: "32px", textAlign: "center", color: "#64748b", fontSize: "14px" },
  link: { color: "#0f172a", fontWeight: 700, textDecoration: "none", marginLeft: "4px" },
  
  // DROITE
  rightSection: {
    flex: "1",
    background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "60px",
    position: "relative",
    overflow: "hidden",
    color: "white",
  },
  visualContent: { position: "relative", zIndex: 10, maxWidth: "480px" },
  visualTitle: { fontSize: "48px", fontWeight: 800, marginBottom: "24px", lineHeight: "1.1" },
  visualText: { fontSize: "18px", lineHeight: "1.6", opacity: 0.9 },
  // Forme différente pour varier du cercle de la page login
  abstractSquare: {
    position: "absolute",
    top: "10%",
    right: "-10%",
    width: "400px",
    height: "400px",
    background: "rgba(255,255,255,0.08)",
    zIndex: 1,
    transform: "rotate(45deg)", 
    borderRadius: "40px",
  },
};