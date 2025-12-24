import { useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom"; // Assure-toi que Link est importé

type MatchRow = {
  jobId: number;
  title: string;
  description: string;
  score: number;
};

export default function CandidateMatchingPage() {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get<MatchRow[]>("/api/resumes/candidate/matches");
        // Tri décroissant
        const sorted = res.data.sort((a, b) => b.score - a.score);
        setRows(sorted);
      } catch (err: any) {
        const status = err?.response?.status;
        setError(
          status === 500 || status === 404
            ? "CV_MISSING"
            : "Impossible de charger le matching."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 70) return "#16a34a"; // Vert
    if (score >= 50) return "#2563eb"; // Bleu
    return "#d97706"; // Orange
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return "Excellent Match";
    if (score >= 50) return "Bon Match";
    return "Match Partiel";
  };

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>✨ Matching Intelligent</h2>
        <p style={styles.subtitle}>
          Offres triées par pertinence (Score sur 100).
        </p>
      </div>

      {loading && (
        <div style={styles.loadingBox}>
          <div style={styles.spinner}></div>
          <p>Analyse de compatibilité en cours...</p>
        </div>
      )}

      {error === "CV_MISSING" && (
        <div style={styles.actionBox}>
          <h3>Aucun matching possible 🧐</h3>
          <p style={{ marginBottom: 16 }}>
            Vous devez d'abord uploader votre CV pour obtenir un score.
          </p>
          <Link to="/candidate/upload" style={styles.btnPrimary}>
            📄 Uploader mon CV
          </Link>
        </div>
      )}

      {error && error !== "CV_MISSING" && (
        <div style={styles.errorAlert}>{error}</div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div style={styles.emptyState}>
          Aucune offre ne correspond à votre profil pour le moment.
        </div>
      )}

      <div style={styles.grid}>
        {rows.map((m) => {
          const safeScore = Math.min(Math.max(m.score, 0), 100);
          const color = getScoreColor(safeScore);
          const displayScore = Math.round(safeScore);

          return (
            <div key={m.jobId} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.scoreBadge(color)}>
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ fontSize: "24px", fontWeight: "800", lineHeight: 1 }}>
                      {displayScore}
                    </span>
                    <span style={{ fontSize: "13px", color: "#94a3b8", marginLeft: "4px", fontWeight: 600 }}>
                      / 100
                    </span>
                  </div>
                  <span style={{ fontSize: "12px", opacity: 0.9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {getScoreLabel(safeScore)}
                  </span>
                </div>
                
                <div style={styles.progressBarBg}>
                  <div
                    style={{
                      ...styles.progressBarFill,
                      width: `${safeScore}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>

              <div style={styles.cardBody}>
                <h3 style={styles.jobTitle}>{m.title}</h3>
                <p style={styles.jobDesc}>
                  {m.description?.slice(0, 150) ?? ""}...
                </p>
              </div>

              <div style={styles.cardFooter}>
                {/* --- MODIFICATION ICI : Lien vers les détails --- */}
                <Link 
                  to={`/candidate/jobs/${m.jobId}`} 
                  style={styles.btnOutlineLink} // Nouveau style pour le lien
                >
                  Voir les détails
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- STYLES ---
const styles: any = {
  header: { marginBottom: "32px" },
  title: { fontSize: "28px", fontWeight: 800, color: "#1e293b", marginBottom: "8px", margin: 0 },
  subtitle: { color: "#64748b", fontSize: "16px", margin: 0 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "24px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.2s",
  },
  cardHeader: { padding: "24px 24px 0 24px" },
  scoreBadge: (color: string) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: color,
    marginBottom: "12px",
  }),
  progressBarBg: {
    height: "10px",
    width: "100%",
    backgroundColor: "#f1f5f9",
    borderRadius: "5px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: "5px",
    transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  cardBody: { padding: "24px", flex: 1 },
  jobTitle: { fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 8px 0" },
  jobDesc: { fontSize: "14px", color: "#64748b", lineHeight: "1.5", margin: 0 },
  cardFooter: { padding: "16px 24px", backgroundColor: "#f8fafc", borderTop: "1px solid #f1f5f9" },
  
  // Style bouton principal (pour upload CV)
  btnPrimary: {
    display: "inline-block",
    padding: "10px 20px",
    backgroundColor: "#2563eb",
    color: "white",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: 600,
    marginTop: "12px",
  },
  
  // Nouveau style pour le lien "Voir les détails" (ressemble à un bouton)
  btnOutlineLink: {
    display: "block",
    width: "100%",
    padding: "10px",
    backgroundColor: "white",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    color: "#475569",
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center",
    textDecoration: "none",
    transition: "all 0.2s",
    boxSizing: "border-box" // Important pour ne pas dépasser
  },
  
  loadingBox: { textAlign: "center", padding: "40px", color: "#64748b" },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 16px auto",
  },
  actionBox: {
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "12px",
    padding: "32px",
    textAlign: "center",
    color: "#1e40af",
  },
  errorAlert: {
    padding: "16px",
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    borderRadius: "8px",
    border: "1px solid #fecaca",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    backgroundColor: "white",
    borderRadius: "12px",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
  },
};