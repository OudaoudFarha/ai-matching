// src/pages/CandidateUploadPage.tsx
import { useEffect, useState, type FormEvent } from "react";
import api from "../api";

type ResumeSummaryDto = {
  id: number;
  filename: string;
  createdAt: string;
};

export default function CandidateUploadPage() {
  const [current, setCurrent] = useState<ResumeSummaryDto | null>(null);
  const [loadingCurrent, setLoadingCurrent] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Charger le CV actuel
  const loadCurrent = async () => {
    setLoadingCurrent(true);
    setError("");
    try {
      const res = await api.get<ResumeSummaryDto>("/api/resumes/candidate/me");
      setCurrent(res.data);
    } catch (err: any) {
      // 204 ou 404 = Pas de CV, c'est normal
      if (err?.response?.status === 204 || err?.response?.status === 404) {
        setCurrent(null);
      } else {
        console.error("Erreur chargement CV:", err);
        setError("Impossible de vérifier votre CV actuel.");
      }
    } finally {
      setLoadingCurrent(false);
    }
  };

  useEffect(() => {
    loadCurrent();
  }, []);

  // Télécharger
  const download = async () => {
    setError("");
    try {
      const res = await api.get("/api/resumes/candidate/download", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = current?.filename ?? "mon-cv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError("Erreur lors du téléchargement.");
    }
  };

  // Supprimer
  const remove = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer votre CV ?")) return;
    
    setError("");
    try {
      await api.delete("/api/resumes/me");
      setCurrent(null);
    } catch (err: any) {
      setError("Erreur lors de la suppression.");
    }
  };

  // Uploader
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    setLoading(true);
    setError("");
    
    try {
      await api.post("/api/resumes/candidate/upload", form);
      setFile(null); // Reset input
      // Petit délai pour l'UX
      setTimeout(() => loadCurrent(), 500);
    } catch (err: any) {
      console.error(err);
      const status = err?.response?.status;
      setError(
        status === 413 ? "Le fichier est trop volumineux." :
        "Erreur lors de l'envoi du fichier."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Mon Curriculum Vitae</h2>
        <p style={styles.subtitle}>Gérez votre document pour le matching automatique.</p>
      </div>

      {error && <div style={styles.errorAlert}>{error}</div>}

      {loadingCurrent ? (
        <div style={styles.loadingBox}>Chargement des infos...</div>
      ) : (
        <>
          {/* CAS 1 : L'utilisateur a déjà un CV */}
          {current && (
            <div style={styles.currentCard}>
              <div style={styles.fileInfo}>
                <div style={styles.fileIcon}>📄</div>
                <div>
                  <div style={styles.fileName}>{current.filename}</div>
                  <div style={styles.fileDate}>
                    Ajouté le {new Date(current.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div style={styles.actions}>
                <button onClick={download} style={styles.btnOutline}>
                  Télécharger
                </button>
                <button onClick={remove} style={styles.btnDanger}>
                  Supprimer
                </button>
              </div>
            </div>
          )}

          {/* CAS 2 : Upload (soit aucun CV, soit pour remplacer) */}
          <div style={styles.uploadSection}>
            <h3 style={styles.sectionTitle}>
              {current ? "Remplacer le fichier" : "Ajouter un CV"}
            </h3>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              {/* Zone d'input stylisée */}
              <div style={styles.fileInputWrapper}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  style={styles.hiddenInput}
                  id="cv-upload"
                />
                <label htmlFor="cv-upload" style={styles.fileLabel}>
                  {file ? (
                    <span style={{ color: "#2563eb", fontWeight: 600 }}>
                      📎 {file.name}
                    </span>
                  ) : (
                    <span style={{ color: "#6b7280" }}>
                      Cliquez pour sélectionner un fichier (PDF, DOCX)
                    </span>
                  )}
                </label>
              </div>

              <button
                type="submit"
                disabled={!file || loading}
                style={!file || loading ? styles.btnDisabled : styles.btnPrimary}
              >
                {loading ? "Envoi en cours..." : "Uploader & Analyser"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

// --- STYLES ---
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "600px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#111827",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#6b7280",
    fontSize: "15px",
  },
  // Carte du CV Actuel
  currentCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    marginBottom: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "16px",
  },
  fileInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  fileIcon: {
    fontSize: "24px",
    backgroundColor: "#eff6ff",
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: {
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: "2px",
  },
  fileDate: {
    fontSize: "12px",
    color: "#9ca3af",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  // Upload Section
  uploadSection: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    border: "1px dashed #d1d5db", // Bordure pointillée style "Drop zone"
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "16px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  fileInputWrapper: {
    position: "relative",
  },
  hiddenInput: {
    opacity: 0,
    position: "absolute",
    zIndex: -1,
    width: "1px",
    height: "1px",
  },
  fileLabel: {
    display: "block",
    padding: "30px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  // Boutons
  btnPrimary: {
    padding: "10px 20px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "14px",
    width: "100%",
    transition: "background 0.2s",
  },
  btnDisabled: {
    padding: "10px 20px",
    backgroundColor: "#e5e7eb",
    color: "#9ca3af",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    cursor: "not-allowed",
    fontSize: "14px",
    width: "100%",
  },
  btnOutline: {
    padding: "8px 12px",
    backgroundColor: "white",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    color: "#374151",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
  },
  btnDanger: {
    padding: "8px 12px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fee2e2",
    borderRadius: "6px",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
  },
  // Messages
  errorAlert: {
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "14px",
    textAlign: "center",
  },
  loadingBox: {
    textAlign: "center",
    padding: "40px",
    color: "#6b7280",
  },
};