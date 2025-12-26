import { useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom"; // Assure-toi que Link est importé

type MatchRow = {
  jobId: number;
  title: string;
  description: string;
  score: number;
};

type Recommendation = {
  score: number;
  missingSkills: string[];
  suggestedKeywords: string[];
  experienceAdvice: string;
  commonSkills: string[];     // NEW
  extraSkills: string[];      // NEW
  skillsAdvice: string;       // NEW
};
// 🔹 Helpers GLOBAUX (en dehors du composant)

const getScoreEmojiAndText = (score: number) => {
  if (score >= 80) return { emoji: "🟢", text: "Excellent" };
  if (score >= 60) return { emoji: "🟠", text: "Moyen" };
  return { emoji: "🔴", text: "À renforcer" };
};

const TRAINING_SUGGESTIONS: Record<string, string> = {
  DOCKER: "Docker for Data Science (Udemy)",
  AWS: "AWS Certified Machine Learning (Coursera)",
  "CLOUD AWS": "AWS Certified Machine Learning (Coursera)",
  "CI/CD": "CI/CD Pipelines with GitHub Actions (Coursera)",
  KUBERNETES: "Kubernetes Hands-On (Udemy)",
  "MACHINE LEARNING": "Machine Learning – Andrew Ng (Coursera)",
};

const getSuggestedTrainings = (missingSkills: string[]): string[] => {
  const suggestions: string[] = [];

  missingSkills.forEach((skill) => {
    Object.entries(TRAINING_SUGGESTIONS).forEach(([key, value]) => {
      if (skill.toUpperCase().includes(key) && !suggestions.includes(value)) {
        suggestions.push(value);
      }
    });
  });

  return suggestions.slice(0, 3);
};

export default function CandidateMatchingPage() {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
const [recommendations, setRecommendations] = useState<Record<number, Recommendation | null>>({});
const [openRecJobId, setOpenRecJobId] = useState<number | null>(null);
const [recLoadingJobId, setRecLoadingJobId] = useState<number | null>(null);
const [recErrorJobId, setRecErrorJobId] = useState<number | null>(null);

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
  const handleToggleRecommendations = async (jobId: number) => {
  // Si on reclique sur la même carte => on referme
  if (openRecJobId === jobId) {
    setOpenRecJobId(null);
    return;
  }
 


const getSuggestedTrainings = (missingSkills: string[]): string[] => {
  const suggestions: string[] = [];

  missingSkills.forEach((skill) => {
    Object.entries(TRAINING_SUGGESTIONS).forEach(([key, value]) => {
      if (skill.toUpperCase().includes(key) && !suggestions.includes(value)) {
        suggestions.push(value);
      }
    });
  });

  return suggestions.slice(0, 3);
};


  setRecErrorJobId(null);

  // Si on n'a pas encore de reco pour ce job, on va les chercher
  if (!recommendations[jobId]) {
    try {
      setRecLoadingJobId(jobId);
      const res = await api.get<Recommendation>(`/api/candidate/jobs/${jobId}/recommendations`);
      setRecommendations(prev => ({
        ...prev,
        [jobId]: res.data,
      }));
    } catch (e) {
      console.error(e);
      setRecErrorJobId(jobId);
    } finally {
      setRecLoadingJobId(null);
    }
  }

  // On ouvre la section pour ce job
  setOpenRecJobId(jobId);
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

  // ✅ on récupère la reco pour ce job
  const recommendation = recommendations[m.jobId];

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
  {/* Lien existant vers la page de détails */}
  <Link 
    to={`/candidate/jobs/${m.jobId}`} 
    style={styles.btnOutlineLink}
  >
    Voir les détails
  </Link>

  {/* Bouton pour afficher les recommandations CV */}
  <button
    style={{ ...styles.btnOutlineLink, marginTop: 8 }}
    onClick={() => handleToggleRecommendations(m.jobId)}
  >
    {openRecJobId === m.jobId ? "Masquer les recommandations" : "Voir les recommandations CV"}
  </button>

  {/* Zone de recommandations pour ce job */}

  {openRecJobId === m.jobId && (
    <div style={styles.recoBox}>
      {recLoadingJobId === m.jobId && (
        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
          Analyse des recommandations en cours...
        </p>
      )}

      {recErrorJobId === m.jobId && (
        <p style={{ fontSize: 13, color: "#b91c1c", margin: 0 }}>
          Impossible de charger les recommandations pour ce poste.
        </p>
      )}

      {recLoadingJobId !== m.jobId &&
  recErrorJobId !== m.jobId &&
  recommendation && (
    <>
      {(() => {
        const localScore = Math.round(recommendation.score);
        const { emoji, text } = getScoreEmojiAndText(localScore);
        const criticalMissing = recommendation.missingSkills || [];
        const trainings = getSuggestedTrainings(criticalMissing);

        return (
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>
            {/* Titre + score comme ton exemple */}
            <p style={{ margin: "4px 0" }}>
              <strong>Titre du poste :</strong> {m.title}
            </p>
            <p style={{ margin: "4px 0" }}>
              <strong>Votre score actuel :</strong>{" "}
              {emoji} {localScore}% ({text})
            </p>

            {/* Compétences manquantes / critiques */}
            {criticalMissing.length > 0 && (
              <>
                <p style={{ marginTop: 8 }}>
                  <strong>⚠️ Compétences manquantes (clés) :</strong>
                </p>
                <ul style={styles.recoList}>
                  {criticalMissing.map((s, idx) => (
                    <li key={idx}>❌ {s}</li>
                  ))}
                </ul>
              </>
            )}

            {/* Nos conseils pour ce poste */}
            <p style={{ marginTop: 10, marginBottom: 4 }}>
              <strong>💡 Nos conseils pour ce poste :</strong>
            </p>
            <ul style={styles.recoList}>
              {/* Mettre en avant ce que tu as déjà */}
              {recommendation.commonSkills?.length > 0 && (
                <li>
                  Mettez en avant dans votre CV vos expériences avec :{" "}
                  <strong>{recommendation.commonSkills.join(", ")}</strong>.
                </li>
              )}

              {/* Ajouter les mots-clés manquants */}
              {recommendation.suggestedKeywords?.length > 0 && (
                <li>
                  Ajoutez explicitement ces technologies ou mots-clés dans votre CV
                  (section Compétences ou Projets) :{" "}
                  <strong>{recommendation.suggestedKeywords.join(", ")}</strong>.
                </li>
              )}

              {/* Conseil expérience venant du backend */}
              {recommendation.experienceAdvice && (
                <li>{recommendation.experienceAdvice}</li>
              )}
            </ul>

            {/* Formations suggérées (bonus) */}
            {trainings.length > 0 && (
              <>
                <p style={{ marginTop: 10, marginBottom: 4 }}>
                  <strong>🎓 Formations suggérées (bonus) :</strong>
                </p>
                <ul style={styles.recoList}>
                  {trainings.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        );
      })()}
    </>
  )}

    </div>
  )}

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

  recoBox: {
  marginTop: 10,
  padding: 10,
  backgroundColor: "#f9fafb",
  borderRadius: 8,
  border: "1px dashed #cbd5e1",
  textAlign: "left",
},
recoList: {
  margin: "4px 0 0 16px",
  padding: 0,
  fontSize: 13,
  color: "#4b5563",
},

};