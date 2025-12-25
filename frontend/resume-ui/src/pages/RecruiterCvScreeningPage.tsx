// src/pages/RecruiterCvScreeningPage.tsx
import { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";

type RankedCv = {
  filename: string;
  score: number;
  competences?: string[];
  experience_estimee?: number;
};

export default function RecruiterCvScreeningPage() {
  const { jobId } = useParams();
  
  // États
  const [jobTitle, setJobTitle] = useState<string>(""); // Pour stocker le titre
  const [files, setFiles] = useState<File[]>([]);
  const [topN, setTopN] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<RankedCv[]>([]);

  // 1. Récupérer le titre de l'offre au chargement
  useEffect(() => {
    const fetchJobTitle = async () => {
      try {
        // On suppose que tu as un endpoint GET /api/jobs/{id}
        // Sinon, tu peux récupérer la liste et trouver le bon ID
        const res = await api.get(`/api/jobs/${jobId}`); 
        // Adapte selon la structure de retour de ton API (res.data.title ou res.data)
        setJobTitle(res.data.title || `Offre #${jobId}`);
      } catch (e) {
        console.error("Erreur titre job", e);
        setJobTitle(`Offre #${jobId}`);
      }
    };
    if (jobId) fetchJobTitle();
  }, [jobId]);

  // Séparation Top N / Autres
  const topList = useMemo(() => results.slice(0, topN), [results, topN]);
  const restList = useMemo(() => results.slice(topN), [results, topN]);

  const submit = async () => {
    if (!jobId || !files.length) return;

    setLoading(true);
    setError("");

    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      form.append("topN", String(topN));

      const res = await api.post<RankedCv[]>(
        `/api/jobs/${jobId}/screening`,
        form
      );
      
      const sorted = res.data.sort((a, b) => b.score - a.score);
      setResults(sorted);
    } catch (err: any) {
      const status = err?.response?.status;
      setError(status ? `Erreur ${status}` : "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => {
      const map = new Map<string, File>();
      prev.forEach((f) => map.set(f.name + f.size, f));
      selected.forEach((f) => map.set(f.name + f.size, f));
      return Array.from(map.values());
    });
  };

  // Supprimer un fichier de la liste avant upload
  const removeFile = (fileName: string) => {
    setFiles(files.filter(f => f.name !== fileName));
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "#16a34a";
    if (score >= 50) return "#2563eb";
    return "#d97706";
  };

  // Si on a des résultats, on cache la grosse zone d'upload pour gagner de la place
  const showResultsMode = results.length > 0;

  return (
    <div>
      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <Link to="/recruiter/jobs" style={styles.backLink}>
          ← Retour aux offres
        </Link>
        <h2 style={styles.pageTitle}>
          Screening IA – <span style={{color: '#2563eb'}}>{jobTitle}</span>
        </h2>
        {!showResultsMode && (
            <p style={styles.pageSubtitle}>
            Importez les CVs des candidats pour obtenir un classement instantané.
            </p>
        )}
      </div>

      {/* ZONE CONFIGURATION (S'affiche en grand si pas de résultats, ou réduit si résultats) */}
      {!showResultsMode ? (
          // MODE UPLOAD (GRAND)
          <div style={styles.configCard}>
            <div style={styles.uploadZone}>
            <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                style={styles.hiddenInput}
                id="cv-upload-input"
            />
            <label htmlFor="cv-upload-input" style={styles.uploadLabel}>
                <span style={{ fontSize: "32px", display: "block", marginBottom: 8 }}>📂</span>
                <span style={{ fontWeight: 600, fontSize: "18px", color: "#1e293b" }}>
                    Cliquez pour ajouter des CVs
                </span>
                <span style={{ fontSize: "14px", color: "#64748b", display: "block", marginTop: 4 }}>
                Formats acceptés : PDF, Word
                </span>
            </label>
            </div>

            {/* 2. LISTE DES FICHIERS VISIBLES */}
            {files.length > 0 && (
                <div style={styles.fileSection}>
                    <h4 style={styles.fileSectionTitle}>
                        Fichiers sélectionnés ({files.length}) :
                    </h4>
                    <div style={styles.fileGrid}>
                        {files.map((f) => (
                            <div key={f.name} style={styles.fileBadge}>
                                <span style={{marginRight: 6}}>📄</span>
                                <span style={styles.fileNameTruncate}>{f.name}</span>
                                <button 
                                    onClick={() => removeFile(f.name)} 
                                    style={styles.removeBtn}
                                    title="Retirer ce fichier"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>

                    <div style={styles.actionRow}>
                        <div style={styles.controlGroup}>
                            <label style={styles.controlLabel}>Nombre de top profils à afficher :</label>
                            <input
                            type="number"
                            min={1}
                            max={files.length}
                            value={topN}
                            onChange={(e) => setTopN(Math.max(1, Number(e.target.value)))}
                            style={styles.numberInput}
                            />
                        </div>

                        <button
                            onClick={submit}
                            disabled={loading}
                            style={loading ? styles.btnDisabled : styles.btnPrimary}
                        >
                            {loading ? "Analyse en cours..." : "🚀 Lancer le Screening"}
                        </button>
                    </div>
                </div>
            )}
            {error && <div style={styles.errorAlert}>{error}</div>}
          </div>
      ) : (
          // MODE RÉSULTATS (PETIT HEADER DE RELANCE)
          <div style={styles.miniHeader}>
              <div style={{display:'flex', alignItems:'center', gap: 10}}>
                  <span style={{fontSize: 20}}>✅</span>
                  <strong>Analyse terminée pour {files.length} CVs</strong>
              </div>
              <button 
                onClick={() => { setResults([]); setFiles([]); }}
                style={styles.btnSecondary}
              >
                  🔄 Nouvelle analyse
              </button>
          </div>
      )}

      {/* 3. AFFICHAGE DES RÉSULTATS (PREND TOUTE LA PLACE) */}
      {results.length > 0 && (
        <div style={{ marginTop: 32, animation: "fadeIn 0.5s" }}>
          
          <h3 style={styles.sectionTitleBig}>
            🏆 Top {Math.min(topN, results.length)} Candidats
          </h3>
          
          {/* GRILLE AGRANDIE POUR LES RÉSULTATS */}
          <div style={styles.gridTopBig}>
            {topList.map((r, index) => {
              const safeScore = Math.min(Math.max(r.score, 0), 100);
              const color = getScoreColor(safeScore);

              return (
                <div key={index} style={styles.cardTopBig}>
                  <div style={styles.rankBadgeBig}>#{index + 1}</div>
                  
                  <div style={styles.cardHeader}>
                    <div style={styles.filenameBig}>{r.filename}</div>
                  </div>

                  {/* SCORE EN GROS */}
                  <div style={{ display:'flex', alignItems:'flex-end', gap: 8, marginBottom: 12 }}>
                    <span style={{ color: color, fontWeight: 800, fontSize: "36px", lineHeight: 1 }}>
                      {safeScore.toFixed(0)}
                    </span>
                    <span style={{fontSize: 14, color: '#94a3b8', marginBottom: 4}}>/100</span>
                  </div>
                  
                  {/* BARRE DE PROGRESSION ÉPAISSE */}
                  <div style={styles.progressBgBig}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${safeScore}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  
                  {r.competences && (
                     <div style={styles.competencesTag}>
                        {r.competences.slice(0, 4).map(c => (
                            <span key={c} style={styles.tag}>{c}</span>
                        ))}
                     </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* AUTRES PROFILS */}
          {restList.length > 0 && (
            <div style={{marginTop: 40}}>
                <h3 style={{...styles.sectionTitleBig, fontSize: 20, color: "#64748b"}}>
                    Les autres profils analysés ({restList.length})
                </h3>
                <div style={styles.gridRest}>
                    {restList.map((r, index) => {
                    const safeScore = Math.min(Math.max(r.score, 0), 100);
                    return (
                        <div key={index} style={styles.cardRest}>
                        <div style={styles.filenameSmall}>{r.filename}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{fontWeight: 700, color: '#64748b'}}>{safeScore.toFixed(0)}%</div>
                            <div style={{ ...styles.progressBg, width: 80, height: 8 }}>
                            <div
                                style={{
                                ...styles.progressFill,
                                width: `${safeScore}%`,
                                backgroundColor: "#cbd5e1",
                                }}
                            />
                            </div>
                        </div>
                        </div>
                    );
                    })}
                </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- STYLES MIS À JOUR ---
const styles: any = {
  // ... (Garder les styles de base du Layout Recruiter)
  backLink: {
    textDecoration: "none",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: 500,
    marginBottom: "8px",
    display: "inline-block",
  },
  pageTitle: {
    fontSize: "32px", // Plus gros
    fontWeight: 800,
    color: "#1e293b",
    margin: "0 0 4px 0",
  },
  pageSubtitle: { color: "#64748b", margin: 0, fontSize: "16px" },
  
  // CONFIG & UPLOAD
  configCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "32px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  uploadZone: { marginBottom: "24px" },
  hiddenInput: { display: 'none' },
  uploadLabel: {
    display: "block",
    border: "2px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "40px",
    textAlign: "center",
    backgroundColor: "#f8fafc",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  
  // LISTE DES FICHIERS (NOUVEAU)
  fileSection: {
      borderTop: "1px solid #e2e8f0",
      paddingTop: "20px",
  },
  fileSectionTitle: {
      margin: "0 0 12px 0",
      color: "#334155",
      fontSize: "15px",
  },
  fileGrid: {
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      marginBottom: "24px",
      maxHeight: "200px", // Scroll si trop de fichiers
      overflowY: "auto",
  },
  fileBadge: {
      display: "flex",
      alignItems: "center",
      backgroundColor: "#eff6ff",
      color: "#1e3a8a",
      padding: "6px 12px",
      borderRadius: "8px",
      fontSize: "13px",
      border: "1px solid #dbeafe",
  },
  fileNameTruncate: {
      maxWidth: "200px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
  },
  removeBtn: {
      background: "transparent",
      border: "none",
      color: "#9ca3af",
      marginLeft: "8px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "bold",
  },

  actionRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#f8fafc",
      padding: "16px",
      borderRadius: "12px",
  },
  controlGroup: { display: "flex", alignItems: "center", gap: "12px" },
  controlLabel: { fontSize: "14px", fontWeight: 600, color: "#475569" },
  numberInput: {
    padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1",
    width: "50px", textAlign: "center", fontWeight: "bold"
  },
  
  // BOUTONS
  btnPrimary: {
    padding: "12px 28px", backgroundColor: "#2563eb", color: "white",
    border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "15px",
    cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.3)",
  },
  btnSecondary: {
    padding: "8px 16px", backgroundColor: "white", color: "#475569",
    border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: 600, cursor: "pointer"
  },
  btnDisabled: {
    padding: "12px 28px", backgroundColor: "#94a3b8", color: "white",
    border: "none", borderRadius: "8px", cursor: "not-allowed",
  },
  errorAlert: {
    marginTop: "16px", padding: "12px", backgroundColor: "#fef2f2",
    color: "#991b1b", borderRadius: "8px", border: "1px solid #fecaca",
  },

  // MINI HEADER (QUAND RÉSULTATS AFFICHÉS)
  miniHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      backgroundColor: '#f0fdf4', // Vert très clair
      border: '1px solid #bbf7d0',
      borderRadius: '12px',
      color: '#166534',
  },

  // GRANDE SECTION RÉSULTATS
  sectionTitleBig: {
      fontSize: "24px", fontWeight: 800, color: "#1e293b",
      marginBottom: "24px",
  },
  gridTopBig: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", // Plus large
    gap: "24px",
  },
  cardTopBig: {
    position: "relative",
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "32px", // Plus de padding
    border: "1px solid #e2e8f0",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    display: "flex",
    flexDirection: "column",
  },
  rankBadgeBig: {
    position: "absolute", top: "20px", right: "20px",
    backgroundColor: "#f1f5f9", color: "#475569",
    fontSize: "14px", fontWeight: 800, padding: "6px 12px", borderRadius: "8px",
  },
  filenameBig: {
      fontSize: "18px", fontWeight: 700, color: "#1e293b",
      marginBottom: "16px", wordBreak: "break-word",
      paddingRight: "40px",
  },
  progressBgBig: {
    height: "12px", width: "100%", backgroundColor: "#f1f5f9",
    borderRadius: "6px", overflow: "hidden", marginBottom: "20px",
  },
  progressFill: { height: "100%", borderRadius: "6px", transition: "width 0.8s ease-out" },
  
  competencesTag: {
      display: 'flex', flexWrap: 'wrap', gap: '8px',
  },
  tag: {
      fontSize: '12px', padding: '4px 10px', borderRadius: '20px',
      backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600,
  },

  // LISTE DES AUTRES
  gridRest: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "16px",
  },
  cardRest: {
    backgroundColor: "white", borderRadius: "12px", padding: "16px 20px",
    border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  filenameSmall: { fontSize: "14px", color: "#334155", fontWeight: 500 },
  progressBg: { backgroundColor: "#f1f5f9", borderRadius: "4px", overflow: "hidden" },
};