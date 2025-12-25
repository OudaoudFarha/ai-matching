import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";

type Application = {
  id: number;
  jobId: number;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  cvOriginalName: string;
  cvDownloadUrl: string;
  appliedAt: string;
  status: "APPLIED" | "SHORTLISTED" | "REJECTED";
  score?: number;
};

export default function JobApplicationsPage() {
  const { jobId } = useParams();
  const [apps, setApps] = useState<Application[]>([]);
  const [jobTitle, setJobTitle] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Charger l'offre (titre) + candidatures scorées
  useEffect(() => {
    const load = async () => {
      if (!jobId) return;
      setLoading(true);
      setError("");
      try {
        const [jobRes, appsRes] = await Promise.all([
          api.get(`/api/jobs/${jobId}`),
          api.get<Application[]>(`/api/recruiter/jobs/${jobId}/applications`),
        ]);

        setJobTitle(jobRes.data.title ?? `Offre #${jobId}`);

        // backend trie déjà, mais on sécurise côté front
        const sorted = [...appsRes.data].sort((a, b) => {
          const s1 = b.score ?? -1;
          const s2 = a.score ?? -1;
          return s1 - s2;
        });
        setApps(sorted);
      } catch (err: any) {
        console.error(err);
        setError("Impossible de charger les candidatures.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [jobId]);

  const formatDate = (d?: string) => {
    if (!d) return "";
    return new Date(d).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score?: number) => {
    if (score == null) return "#9ca3af";
    if (score >= 70) return "#16a34a";
    if (score >= 50) return "#2563eb";
    return "#d97706";
  };

  const getStatusLabel = (status: Application["status"]) => {
    switch (status) {
      case "APPLIED":
        return "Candidature reçue";
      case "SHORTLISTED":
        return "Présélectionné(e)";
      case "REJECTED":
        return "Rejeté(e)";
      default:
        return status;
    }
  };

  const handleDownload = async (app: Application) => {
    try {
      const res = await api.get(app.cvDownloadUrl, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = app.cvOriginalName || "cv.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Erreur lors du téléchargement du CV.");
    }
  };

  return (
    <div>
      {/* Back */}
      <Link to="/recruiter/jobs" style={styles.backLink}>
        ← Retour à mes offres
      </Link>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>
            Candidatures –{" "}
            <span style={{ color: "#2563eb" }}>{jobTitle}</span>
          </h2>
          <p style={styles.subtitle}>
            Les candidats sont triés par pertinence (score de matching IA).
          </p>
        </div>
        <div style={styles.badge}>
          {apps.length} candidature{apps.length > 1 ? "s" : ""}
        </div>
      </div>

      {loading && (
        <div style={styles.centerBox}>
          <div style={styles.spinner}></div>
          <p>Analyse des candidatures...</p>
        </div>
      )}

      {error && <div style={styles.errorBox}>{error}</div>}

      {!loading && !error && apps.length === 0 && (
        <div style={styles.emptyState}>
          <p style={{ fontSize: 18, marginBottom: 8 }}>📭 Aucune candidature</p>
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            Personne n'a encore postulé à cette offre.
          </p>
        </div>
      )}

      {!loading && !error && apps.length > 0 && (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Rang</th>
                <th style={styles.th}>Candidat</th>
                <th style={styles.th}>Score</th>
                <th style={styles.th}>CV</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app, index) => {
                const s = app.score ?? -1;
                const color = getScoreColor(app.score);

                return (
                  <tr key={app.id} style={styles.tr}>
                    <td style={styles.tdRank}>#{index + 1}</td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 600 }}>
                          {app.candidateEmail}
                        </span>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>
                          ID : {app.candidateId}
                        </span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      {s < 0 ? (
                        <span style={{ color: "#9ca3af", fontSize: 12 }}>
                          Non calculé
                        </span>
                      ) : (
                        <div style={styles.scoreCell}>
                          <span
                            style={{
                              fontWeight: 700,
                              color,
                              minWidth: 40,
                              textAlign: "right",
                            }}
                          >
                            {Math.round(s)}%
                          </span>
                          <div style={styles.scoreBarBg}>
                            <div
                              style={{
                                ...styles.scoreBarFill,
                                width: `${Math.max(
                                  5,
                                  Math.min(100, s)
                                )}%`,
                                backgroundColor: color,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: 13, color: "#4b5563" }}>
                        {app.cvOriginalName}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: 13, color: "#6b7280" }}>
                        {formatDate(app.appliedAt)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.statusBadge(app.status)}>
                        {getStatusLabel(app.status)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleDownload(app)}
                        style={styles.btnCv}
                      >
                        📄 Télécharger CV
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// --- styles ---
const styles: any = {
  backLink: {
    display: "inline-block",
    marginBottom: 12,
    color: "#6b7280",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    color: "#111827",
    margin: 0,
  },
  subtitle: { margin: 0, color: "#6b7280", fontSize: 14 },
  badge: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    padding: "4px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  },
  centerBox: {
    textAlign: "center",
    padding: 40,
  },
  spinner: {
    width: 30,
    height: 30,
    border: "3px solid #e5e7eb",
    borderTop: "3px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 12px auto",
  },
  errorBox: {
    padding: 16,
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    borderRadius: 8,
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: "white",
    borderRadius: 12,
    border: "1px dashed #e5e7eb",
    padding: "40px 20px",
    textAlign: "center",
  },
  tableWrapper: {
    overflowX: "auto",
    backgroundColor: "white",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: "#f9fafb",
    color: "#6b7280",
    fontWeight: 600,
    fontSize: 13,
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid #f3f4f6",
  },
  td: {
    padding: "10px 16px",
    verticalAlign: "middle",
  },
  tdRank: {
    padding: "10px 16px",
    fontWeight: 700,
    color: "#4b5563",
  },
  scoreCell: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  scoreBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.4s ease",
  },
  statusBadge: (status: Application["status"]) => {
    let bg = "#e5e7eb";
    let color = "#374151";
    if (status === "APPLIED") {
      bg = "#eff6ff";
      color = "#1d4ed8";
    } else if (status === "SHORTLISTED") {
      bg = "#ecfdf3";
      color = "#16a34a";
    } else if (status === "REJECTED") {
      bg = "#fef2f2";
      color = "#b91c1c";
    }
    return {
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: 999,
      backgroundColor: bg,
      color,
      fontSize: 12,
      fontWeight: 600,
    };
  },
  btnCv: {
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
  },
};
