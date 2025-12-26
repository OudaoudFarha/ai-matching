import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { Calendar, Briefcase, CheckCircle, XCircle, Clock } from "lucide-react";

interface Application {
  id: number;
  jobId: number;
  jobTitle: string;
  status: string;
  appliedAt: string;
  score?: number;
}

export default function CandidateApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/candidate/my-applications")
      .then((res) => setApplications(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return <span style={{...styles.badge, backgroundColor: "#dcfce7", color: "#16a34a"}}>Accepté</span>;
      case "REJECTED":
        return <span style={{...styles.badge, backgroundColor: "#fee2e2", color: "#dc2626"}}>Refusé</span>;
      default:
        return <span style={{...styles.badge, backgroundColor: "#dbeafe", color: "#2563eb"}}>Envoyé</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric"
    });
  };

  if (loading) return <div style={styles.container}>Chargement...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Mes Candidatures</h1>
      
      {applications.length === 0 ? (
        <div style={styles.emptyState}>
          <p>Vous n'avez pas encore postulé à une offre.</p>
          <Link to="/candidate" style={styles.btnPrimary}>Voir les offres</Link>
        </div>
      ) : (
        <div style={styles.grid}>
          {applications.map((app) => (
            <div key={app.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.iconBox}>
                  <Briefcase size={20} color="#4b5563" />
                </div>
                <div>
                  <h3 style={styles.jobTitle}>{app.jobTitle}</h3>
                  <div style={styles.dateRow}>
                    <Calendar size={14} />
                    <span>Postulé le {formatDate(app.appliedAt)}</span>
                  </div>
                </div>
              </div>

              <div style={styles.divider}></div>

              <div style={styles.cardFooter}>
                <div style={styles.statusBox}>
                  <span style={styles.label}>Statut :</span>
                  {getStatusBadge(app.status)}
                </div>

                {/* Affichage du score si disponible (Feedback IA) */}
                {app.score !== undefined && app.score !== null && (
                  <div style={styles.scoreBox}>
                    <span style={styles.label}>Matching IA :</span>
                    <span style={styles.scoreValue}>{(app.score * 100).toFixed(0)}%</span>
                  </div>
                )}
                
                <Link to={`/candidate/jobs/${app.jobId}`} style={styles.linkDetails}>
                   Voir l'offre →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: "20px" },
  title: { fontSize: "24px", fontWeight: "bold", marginBottom: "24px", color: "#111827" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" },
  card: { backgroundColor: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb" },
  cardHeader: { display: "flex", gap: "16px", marginBottom: "16px" },
  iconBox: { width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" },
  jobTitle: { fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: "0 0 4px 0" },
  dateRow: { display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6b7280" },
  divider: { height: "1px", backgroundColor: "#f3f4f6", margin: "0 -20px 16px -20px" },
  cardFooter: { display: "flex", flexDirection: "column", gap: "12px" },
  statusBox: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  scoreBox: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: "13px", color: "#6b7280", fontWeight: "500" },
  badge: { padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  scoreValue: { fontWeight: "bold", color: "#2563eb" },
  linkDetails: { fontSize: "13px", color: "#2563eb", textDecoration: "none", fontWeight: "500", marginTop: "4px" },
  emptyState: { textAlign: "center", padding: "40px", backgroundColor: "white", borderRadius: "12px" },
  btnPrimary: { display: "inline-block", marginTop: "10px", padding: "8px 16px", backgroundColor: "#2563eb", color: "white", borderRadius: "6px", textDecoration: "none" }
};