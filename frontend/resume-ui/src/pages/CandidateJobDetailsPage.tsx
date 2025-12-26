// src/pages/CandidateJobDetailsPage.tsx

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";


interface Job {
  id: number;
  title: string;
  description: string;
  recruiterEmail: string;
  createdAt: string;
}

type ResumeSummaryDto = {
  id: number;
  filename: string;
  createdAt: string;
};

type ApplyMode = "existing" | "upload";

export default function CandidateJobDetailsPage() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  
const [existingResume, setExistingResume] = useState<ResumeSummaryDto | null>(null);
const [loadingResume, setLoadingResume] = useState(false);
const [applyMode, setApplyMode] = useState<ApplyMode>("upload");

  // 🔹 POST /api/candidate/jobs/{id}/apply
  const handleApply = async () => {
  if (applyMode === "upload" && !cvFile) {
    alert("Veuillez sélectionner un CV avant de postuler.");
    return;
  }

  if (applyMode === "existing" && !existingResume) {
    alert("Vous n'avez pas encore de CV enregistré. Veuillez en uploader un.");
    return;
  }

  const formData = new FormData();
  formData.append("useExisting", applyMode === "existing" ? "true" : "false");

  if (applyMode === "upload" && cvFile) {
    formData.append("cv", cvFile);
  }

  try {
    setApplyLoading(true);

    await api.post(`/api/candidate/jobs/${id}/apply`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    alert("Votre candidature a été envoyée avec succès 🎉");
    setAlreadyApplied(true);
  } catch (err: any) {
    const status = err?.response?.status;
    const message =
      err?.response?.data || "Erreur lors de l'envoi de votre candidature.";

    if (status === 409) {
      alert("Vous avez déjà postulé à cette offre ✅");
      setAlreadyApplied(true);
    } else {
      alert(message);
    }
    console.error(err);
  } finally {
    setApplyLoading(false);
  }
};


type HasAppliedResponse = {
  hasApplied: boolean;
};

useEffect(() => {
  const loadJobAndResume = async () => {
    try {
      setLoading(true);
      setLoadingResume(true);

      const [jobRes, resumeRes, hasAppliedRes] = await Promise.all([
        api.get(`/api/jobs/${id}`),
        api.get<ResumeSummaryDto>("/api/resumes/candidate/me").catch((err) => {
          if (err?.response?.status === 204 || err?.response?.status === 404) {
            return { data: null } as any;
          }
          throw err;
        }),
        api.get<HasAppliedResponse>(`/api/candidate/jobs/${id}/has-applied`),
      ]);

      setJob(jobRes.data);
      setExistingResume(resumeRes.data);

      // ✅ très important : on met à jour déjà postulé depuis le backend
      setAlreadyApplied(hasAppliedRes.data.hasApplied);

      if (resumeRes.data) {
        setApplyMode("existing");
      }
    } catch (err) {
      console.error("Erreur chargement offre / CV / has-applied", err);
    } finally {
      setLoading(false);
      setLoadingResume(false);
    }
  };

  loadJobAndResume();
}, [id]);


  if (loading)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Chargement...
      </div>
    );
  if (!job)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Offre introuvable.
      </div>
    );

  return (
    <div style={styles.container}>
      {/* Bouton Retour */}
      <Link to="/candidate" style={styles.backLink}>
        ← Retour aux offres
      </Link>

      <div style={styles.card}>
        {/* En-tête de l’offre */}
        <div style={styles.header}>
          <h1 style={styles.title}>{job.title}</h1>
          <span style={styles.date}>
            Publié le {new Date(job.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div style={styles.divider}></div>

        {/* Description */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Description du poste</h3>
          <p style={styles.description}>{job.description}</p>
        </div>

        <div style={styles.divider}></div>

        {/* Candidature : upload + bouton */}
    {/* Candidature : choix CV + upload éventuel + bouton */}
<div style={styles.applySection}>
  <div style={{ flex: 1 }}>
    <h3 style={styles.sectionTitle}>Candidature</h3>
    <p style={styles.applyHelpText}>
      Vous pouvez utiliser votre CV déjà enregistré ou uploader un nouveau fichier.
    </p>

    {/* Radios de choix */}
    {loadingResume ? (
      <p style={{ fontSize: 13, color: "#6b7280" }}>Vérification de votre CV...</p>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {existingResume && (
          <label style={{ fontSize: 14, color: "#374151", cursor: "pointer" }}>
            <input
              type="radio"
              value="existing"
              checked={applyMode === "existing"}
              onChange={() => setApplyMode("existing")}
              style={{ marginRight: 8 }}
            />
            Utiliser mon CV existant :{" "}
            <strong>{existingResume.filename}</strong>
          </label>
        )}

        <label style={{ fontSize: 14, color: "#374151", cursor: "pointer" }}>
          <input
            type="radio"
            value="upload"
            checked={applyMode === "upload"}
            onChange={() => setApplyMode("upload")}
            style={{ marginRight: 8 }}
          />
          Uploader un nouveau CV
        </label>
      </div>
    )}

    {/* Zone d'upload uniquement si mode "upload" */}
    {applyMode === "upload" && (
      <>
        <label style={{ ...styles.uploadLabel, marginTop: 12 }}>
          📂 Sélectionner un fichier
          <input
            type="file"
            accept="application/pdf"
            style={styles.hiddenFileInput}
            onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {cvFile && (
          <p style={styles.selectedFile}>
            CV sélectionné : <strong>{cvFile.name}</strong>
          </p>
        )}
      </>
    )}
  </div>

  {/* Bouton POSTULER */}
  {alreadyApplied ? (
    <button
      disabled
      style={{ ...styles.applyButton, ...styles.applyButtonDisabled }}
    >
      Vous avez déjà postulé
    </button>
  ) : (
    <button
      style={{
        ...styles.applyButton,
        ...(
          applyLoading ||
          (applyMode === "upload" && !cvFile) ||
          (applyMode === "existing" && !existingResume)
            ? styles.applyButtonDisabled
            : {}
        ),
      }}
      onClick={handleApply}
      disabled={
        applyLoading ||
        (applyMode === "upload" && !cvFile) ||
        (applyMode === "existing" && !existingResume)
      }
    >
      {applyLoading ? "Envoi en cours..." : "Postuler maintenant"}
    </button>
  )}
</div>

        {/* Infos recruteur */}
        <div style={{ ...styles.footer, marginTop: 24 }}>
          <div style={styles.recruiterInfo}>
            <span style={{ color: "#6b7280", fontSize: "14px" }}>
              Recruteur :
            </span>
            <span style={{ fontWeight: 500 }}>{job.recruiterEmail}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- STYLES (ancien design conservé) ---
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    paddingBottom: "40px",
  },
  backLink: {
    display: "inline-block",
    marginBottom: "20px",
    color: "#6b7280",
    textDecoration: "none",
    fontWeight: 500,
    fontSize: "14px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "40px",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  },
  header: {
    marginBottom: "24px",
  },
  title: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#111827",
    marginBottom: "8px",
    marginTop: 0,
  },
  date: {
    color: "#6b7280",
    fontSize: "14px",
  },
  divider: {
    height: "1px",
    backgroundColor: "#e5e7eb",
    margin: "24px 0",
  },
  section: {
    marginBottom: "24px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#374151",
    marginBottom: "16px",
  },
  description: {
    color: "#4b5563",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
    fontSize: "16px",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "32px",
  },
  recruiterInfo: {
    display: "flex",
    flexDirection: "column",
  },
  applySection: {
    marginTop: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
    flexWrap: "wrap",
  },
  applyHelpText: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "12px",
  },
  uploadLabel: {
    display: "inline-block",
    padding: "10px 16px",
    borderRadius: "999px",
    border: "1px dashed #2563eb",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
  },
  hiddenFileInput: {
    display: "none",
  },
  selectedFile: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#4b5563",
  },
  applyButton: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "16px",
    cursor: "pointer",
    boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
  },
  applyButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
    boxShadow: "none",
  },
};
