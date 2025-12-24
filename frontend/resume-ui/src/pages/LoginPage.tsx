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
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      const role = localStorage.getItem("role");
      if (role === "CANDIDATE") nav("/candidate", { replace: true });
      else if (role === "RECRUITER") nav("/recruiter/jobs", { replace: true });
      else nav("/", { replace: true });
    } catch (err) {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      
      {/* CÔTÉ GAUCHE : FORMULAIRE */}
      <div style={styles.leftSection}>
        <div style={styles.formContainer}>
          
          {/* Header Mobile/Form */}
          <div style={{ marginBottom: 40 }}>
            <div style={styles.logoBadge}>AI</div>
            <h1 style={styles.title}>Welcome back</h1>
            <p style={styles.subtitle}>Saisissez vos identifiants pour accéder à la plateforme.</p>
          </div>

          <form onSubmit={onSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <input
                placeholder="name@company.com"
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
                placeholder="••••••••"
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
              {isLoading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div style={styles.footer}>
            Pas de compte ? <Link to="/register" style={styles.link}>S'inscrire</Link>
          </div>
        </div>
      </div>

      {/* CÔTÉ DROIT : VISUEL (Caché sur mobile via CSS si besoin, ici flex) */}
      <div style={styles.rightSection}>
        <div style={styles.visualContent}>
          <h2 style={styles.visualTitle}>Le recrutement intelligent.</h2>
          <p style={styles.visualText}>
            Notre IA analyse sémantiquement vos CVs pour trouver le match parfait en quelques secondes.
          </p>
          {/* Illustration abstraite CSS */}
          <div style={styles.abstractCircle1}></div>
          <div style={styles.abstractCircle2}></div>
        </div>
      </div>

    </div>
  );
}

// --- STYLES SPLIT SCREEN ---
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
    maxWidth: "380px",
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
  subtitle: {
    color: "#64748b",
    fontSize: "16px",
    margin: 0,
    lineHeight: "1.5",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#334155",
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
    marginTop: "12px",
    padding: "16px",
    backgroundColor: "#0f172a", // Bouton noir classe
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  btnDisabled: {
    marginTop: "12px",
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
  footer: {
    marginTop: "32px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
  },
  link: {
    color: "#0f172a",
    fontWeight: 700,
    textDecoration: "none",
    marginLeft: "4px",
  },
  
  // DROITE (Visuel)
  rightSection: {
    flex: "1",
    backgroundColor: "#2563eb", // Bleu vibrant
    background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "60px",
    position: "relative",
    overflow: "hidden",
    color: "white",
    // Pour cacher sur mobile, il faudrait une Media Query CSS classique
    // ou utiliser useMediaQuery en JS. Ici on laisse flex par défaut.
  },
  visualContent: {
    position: "relative",
    zIndex: 10,
    maxWidth: "480px",
  },
  visualTitle: {
    fontSize: "48px",
    fontWeight: 800,
    marginBottom: "24px",
    lineHeight: "1.1",
  },
  visualText: {
    fontSize: "18px",
    lineHeight: "1.6",
    opacity: 0.9,
  },
  // Décoration abstraite
  abstractCircle1: {
    position: "absolute",
    top: "-10%",
    right: "-10%",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.1)",
    zIndex: 1,
  },
  abstractCircle2: {
    position: "absolute",
    bottom: "-5%",
    left: "-10%",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.05)",
    zIndex: 1,
  },
};