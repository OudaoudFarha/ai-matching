import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

interface Job {
  id: number;
  title: string;
  description: string;
  createdAt: string;
}

// --- ICONES SVG ---
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);
const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default function RecruiterJobsPage() {
  const navigate = useNavigate();
// en haut du composant
const goApplications = (jobId: number) => {
  navigate(`/recruiter/jobs/${jobId}/applications`);
};

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Focus state pour le style (optionnel en inline style, mais ajoute du polish)
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const loadJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get<Job[]>("/api/jobs/mine");
      setJobs(res.data.reverse());
    } catch (e) {
      console.error(e);
      setError("Impossible de charger vos offres.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setSubmitting(true);
    try {
      if (editingId) {
        const res = await api.put<Job>(`/api/jobs/${editingId}`, {
          title: newTitle,
          description: newDescription,
        });
        setJobs((prev) => prev.map((j) => (j.id === editingId ? res.data : j)));
      } else {
        const res = await api.post<Job>("/api/jobs", {
          title: newTitle,
          description: newDescription,
        });
        setJobs((prev) => [res.data, ...prev]);
      }
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (job: Job) => {
    setNewTitle(job.title);
    setNewDescription(job.description);
    setEditingId(job.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteJob = async (jobId: number) => {
  if (!window.confirm("Supprimer définitivement cette offre ?")) return;

  try {
    await api.delete(`/api/jobs/${jobId}`);
    setJobs((prev) => prev.filter((j) => j.id !== jobId)); // enlever la carte
  } catch (err: any) {
    const status = err?.response?.status;
    const msg = err?.response?.data || "Erreur lors de la suppression de l'offre.";

    if (status === 409) {
      alert(msg); // "Impossible de supprimer l'offre : des candidatures existent déjà."
    } else {
      alert("Impossible de supprimer l'offre.");
    }
    console.error(err);
  }
};


  const resetForm = () => {
    setNewTitle("");
    setNewDescription("");
    setEditingId(null);
    setShowForm(false);
  };

  const goScreening = (jobId: number) => {
    navigate(`/recruiter/jobs/${jobId}/screening`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <div>
      {/* Animation CSS injectée */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .form-animate { animation: slideDown 0.3s ease-out forwards; }
      `}</style>

      {/* HEADER + BOUTON AJOUTER */}
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>Mes Offres</h2>
          <p style={styles.subtitle}>Gérez vos recrutements et lancez les screenings IA.</p>
        </div>
        
        <button
          onClick={() => {
            if (showForm && !editingId) {
                setShowForm(false);
            } else {
                resetForm();
                setShowForm(true);
            }
          }}
          style={showForm && !editingId ? styles.btnCancelTop : styles.btnAdd}
        >
          {showForm && !editingId ? (
             <>Fermer</>
          ) : (
             <>
               <PlusIcon /> Nouvelle offre
             </>
          )}
        </button>
      </div>

      {/* --- FORMULAIRE MODERNISÉ --- */}
      {showForm && (
        <div style={styles.formCard} className="form-animate">
          {/* Indicateur latéral bleu */}
          <div style={styles.accentBar}></div>

          <div style={styles.formContent}>
            <div style={styles.formHeader}>
               <div>
                  <h3 style={styles.formTitle}>
                    {editingId ? "Modifier l'offre" : "Créer une nouvelle opportunité"}
                  </h3>
                  <p style={styles.formSubtitle}>Remplissez les détails du poste ci-dessous</p>
               </div>
               <button onClick={resetForm} style={styles.btnCloseIcon} title="Fermer"><CloseIcon/></button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              {/* CHAMP TITRE */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Intitulé du poste</label>
                <input
                  placeholder="Ex: Développeur Fullstack React/Node"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onFocus={() => setFocusedField('title')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    ...styles.input,
                    ...(focusedField === 'title' ? styles.inputFocus : {})
                  }}
                  autoFocus
                />
              </div>
              
              {/* CHAMP DESCRIPTION */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Description du poste (JD)</label>
                <textarea
                  placeholder="Responsabilités, pré-requis, stack technique..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  onFocus={() => setFocusedField('desc')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    ...styles.textarea,
                    ...(focusedField === 'desc' ? styles.inputFocus : {})
                  }}
                />
                <p style={styles.helperText}>L'IA utilisera cette description pour le screening.</p>
              </div>

              {/* ACTIONS */}
              <div style={styles.formActions}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={styles.btnGhost}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={styles.btnSubmit}
                >
                  {submitting 
                    ? "Enregistrement..." 
                    : (editingId ? "Mettre à jour" : "Publier l'offre")
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ETATS */}
      {loading && !jobs.length && (
        <div style={styles.centerBox}>
          <div style={styles.spinner}></div>
          <p>Chargement de vos offres...</p>
        </div>
      )}
      {error && <div style={styles.errorAlert}>{error}</div>}

      {!loading && !error && jobs.length === 0 && !showForm && (
        <div style={styles.emptyState}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>📭</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#334155" }}>Aucune offre publiée</h3>
          <p style={{ color: "#64748b", margin: 0 }}>
            Commencez par créer votre première offre d'emploi.
          </p>
        </div>
      )}

      {/* GRILLE DES OFFRES */}
      <div style={styles.grid}>
        {jobs.map((job) => (
          <div key={job.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTopRow}>
                  <div style={styles.cardDate}>{formatDate(job.createdAt)}</div>
                  <div style={styles.cardActions}>
                      <button onClick={() => handleEdit(job)} style={styles.actionBtnEdit} title="Modifier">
                        <EditIcon />
                      </button>
                      <button onClick={() => handleDeleteJob(job.id)} style={styles.actionBtnDelete} title="Supprimer">
                        <TrashIcon />
                      </button>
                  </div>
              </div>
              <h3 style={styles.cardTitle}>{job.title}</h3>
            </div>
            <p style={styles.cardDesc}>
              {job.description?.slice(0, 120)}
              {job.description?.length > 120 ? "..." : ""}
            </p>
            <div style={styles.cardFooter}>
              <button onClick={() => goScreening(job.id)} style={styles.btnScreening}>
                🔍 Lancer Screening CV
              </button>

              <button onClick={() => goApplications(job.id)} style={{ ...styles.btnScreening, marginTop: 8, borderColor: "#e5e7eb", color: "#374151",}}>
                 📄 Voir candidatures
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- STYLES MODERNES ---
const styles: any = {
  headerRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px",
  },
  title: { fontSize: "28px", fontWeight: 800, color: "#1e293b", margin: "0 0 4px 0" },
  subtitle: { color: "#64748b", margin: 0, fontSize: "15px" },
  
  // Bouton Ajouter
  btnAdd: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "12px 24px", borderRadius: "10px", border: "none",
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", // Dégradé subtil
    color: "#fff", cursor: "pointer",
    fontWeight: 600, fontSize: "14px",
    boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.3)",
    transition: "transform 0.2s, background 0.2s",
  },
  btnCancelTop: {
    padding: "10px 20px", borderRadius: "8px", border: "1px solid #e2e8f0",
    background: "white", color: "#64748b", cursor: "pointer",
    fontWeight: 600, fontSize: "14px",
  },

  // --- FORMULAIRE DESIGN ---
  formCard: { 
    backgroundColor: "white", 
    borderRadius: "16px", 
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)", // Ombre profonde
    marginBottom: "40px", 
    position: "relative",
    overflow: "hidden", // Pour la barre d'accent
    display: "flex",
    border: "1px solid #f1f5f9",
  },
  accentBar: {
    width: "6px",
    backgroundColor: "#2563eb",
    flexShrink: 0,
  },
  formContent: {
    padding: "32px",
    width: "100%",
  },
  formHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  formTitle: { fontSize: "20px", fontWeight: 700, color: "#1e293b", margin: "0 0 4px 0" },
  formSubtitle: { fontSize: "14px", color: "#64748b", margin: 0 },
  btnCloseIcon: { background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", padding: "4px" },
  
  form: { display: "flex", flexDirection: "column", gap: "24px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  
  label: { fontSize: "14px", fontWeight: 600, color: "#334155" },
  helperText: { fontSize: "12px", color: "#94a3b8", marginTop: "4px" },

  // Champs de saisie
  input: { 
    width: "100%", padding: "14px", 
    borderRadius: "8px", 
    border: "1px solid #e2e8f0", 
    backgroundColor: "#f8fafc", // Fond gris très clair par défaut
    fontSize: "15px", 
    outline: "none", 
    transition: "all 0.2s ease",
    boxSizing: "border-box", 
    color: "#0f172a"
  },
  textarea: { 
    width: "100%", padding: "14px", 
    borderRadius: "8px", 
    border: "1px solid #e2e8f0", 
    backgroundColor: "#f8fafc",
    fontSize: "15px", 
    minHeight: "150px", 
    fontFamily: "inherit", 
    outline: "none", 
    resize: "vertical", 
    transition: "all 0.2s ease",
    boxSizing: "border-box",
    color: "#0f172a",
    lineHeight: "1.6"
  },
  // Style appliqué au focus (simulé via state)
  inputFocus: {
    backgroundColor: "white",
    borderColor: "#3b82f6",
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)" // Glow bleu
  },

  formActions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" },
  
  btnSubmit: { 
    padding: "12px 28px", borderRadius: "8px", border: "none", 
    background: "#0f172a", color: "#fff", cursor: "pointer", 
    fontWeight: 600, fontSize: "14px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
  },
  btnGhost: { 
    padding: "12px 24px", background: "transparent", border: "none", 
    color: "#64748b", cursor: "pointer", fontWeight: 600, fontSize: "14px",
    transition: "color 0.2s"
  },

  // --- GRILLE & CARTES ---
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" },
  card: { backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", transition: "transform 0.2s, box-shadow 0.2s", overflow: "hidden" },
  cardHeader: { padding: "20px 20px 0 20px" },
  cardTopRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" },
  cardActions: { display: "flex", gap: "8px" },

  actionBtnEdit: {
    width: "32px", height: "32px", borderRadius: "50%", 
    border: "1px solid #e2e8f0", background: "white", color: "#64748b",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transition: "all 0.2s",
  },
  actionBtnDelete: {
    width: "32px", height: "32px", borderRadius: "50%", 
    border: "1px solid #fee2e2", background: "#fff1f2", color: "#ef4444",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transition: "all 0.2s",
  },

  cardDate: { fontSize: "12px", color: "#94a3b8", fontWeight: 600, marginTop: "6px" },
  cardTitle: { fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: 0, lineHeight: 1.4 },
  cardDesc: { padding: "0 20px", color: "#64748b", fontSize: "14px", lineHeight: 1.6, flex: 1, margin: "12px 0 20px 0" },
  cardFooter: { padding: "16px 20px", backgroundColor: "#f8fafc", borderTop: "1px solid #f1f5f9" },
  btnScreening: { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #2563eb", background: "white", color: "#2563eb", cursor: "pointer", fontWeight: 600, fontSize: "14px", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
  
  centerBox: { textAlign: "center", padding: "40px", color: "#64748b" },
  spinner: { width: "30px", height: "30px", border: "3px solid #e2e8f0", borderTop: "3px solid #2563eb", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px auto" },
  errorAlert: { padding: "16px", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "8px", border: "1px solid #fecaca", marginBottom: "20px" },
  emptyState: { textAlign: "center", padding: "60px 20px", backgroundColor: "white", borderRadius: "16px", border: "2px dashed #e2e8f0" },
};