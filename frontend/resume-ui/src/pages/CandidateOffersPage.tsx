// src/pages/CandidateOffersPage.tsx
import { useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
interface Job {
  id: number;
  title: string;
  description: string;
  createdAt: string;
}

export default function CandidateOffersPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get<Job[]>("/api/jobs/public");
        setJobs(res.data);
      } catch (err: any) {
        console.error("Erreur chargement offres:", err);
        const status = err?.response?.status;
        setError(
          status === 403
            ? "🔒 Accès refusé (vérifie que tu es bien connecté)."
            : "❌ Impossible de charger les offres."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Utilitaire pour formater la date
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div>
      {/* En-tête de la page */}
      <div style={styles.pageHeader}>
        <h2 style={styles.title}>Offres disponibles</h2>
        <span style={styles.badge}>{jobs.length} offres</span>
      </div>

      {/* État de chargement */}
      {loading && (
        <div style={styles.centerMessage}>
          <div style={styles.spinner}></div>
          <p style={{ color: "#6b7280" }}>Recherche des meilleures opportunités...</p>
        </div>
      )}

      {/* État d'erreur */}
      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      {/* État vide */}
      {!loading && !error && jobs.length === 0 && (
        <div style={styles.emptyState}>
          <p style={{ fontSize: "18px", marginBottom: "8px" }}>📭 Aucune offre pour le moment</p>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>Revenez un peu plus tard !</p>
        </div>
      )}

      {/* Grille des offres */}
      <div style={styles.grid}>
        {jobs.map((job) => (
          <div key={job.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>{job.title}</h3>
              <span style={styles.date}>{formatDate(job.createdAt)}</span>
            </div>
            
            <p style={styles.cardDescription}>
              {job.description?.slice(0, 140) ?? "Pas de description"}
              {job.description?.length > 140 ? "..." : ""}
            </p>

            <div style={styles.cardFooter}>
              {/* On remplace <button> par <Link> */}
              <Link 
                to={`/candidate/jobs/${job.id}`} 
                style={{
                  ...styles.applyButton, 
                  textDecoration: "none", 
                  display: "inline-block" 
                }}
              >
                Voir l'offre
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- STYLES (Compatible avec le Layout précédent) ---
const styles: Record<string, React.CSSProperties> = {
  pageHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#111827",
    margin: 0,
  },
  badge: {
    backgroundColor: "#dbeafe", // Bleu très clair
    color: "#1e40af", // Bleu foncé
    padding: "2px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: 600,
  },
  // Grille responsive
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", // Magie CSS Grid
    gap: "24px",
  },
  // Carte Job
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "180px",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  cardHeader: {
    marginBottom: "12px",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#1f2937",
    margin: "0 0 4px 0",
    lineHeight: "1.4",
  },
  date: {
    fontSize: "12px",
    color: "#9ca3af",
  },
  cardDescription: {
    color: "#4b5563",
    fontSize: "14px",
    lineHeight: "1.5",
    marginBottom: "20px",
    flexGrow: 1, // Pousse le bouton vers le bas
  },
  cardFooter: {
    borderTop: "1px solid #f3f4f6",
    paddingTop: "16px",
    display: "flex",
    justifyContent: "flex-end", // Bouton à droite
  },
  applyButton: {
    backgroundColor: "white",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: 500,
    color: "#374151",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  // États divers
  centerMessage: {
    textAlign: "center",
    padding: "40px",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "white",
    borderRadius: "12px",
    border: "1px dashed #e5e7eb",
  },
  errorBox: {
    padding: "16px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fee2e2",
    color: "#991b1b",
    borderRadius: "8px",
    marginBottom: "24px",
  },
  // Petit spinner CSS maison
  spinner: {
    width: "30px",
    height: "30px",
    border: "3px solid #e5e7eb",
    borderTop: "3px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 12px auto",
  }
};