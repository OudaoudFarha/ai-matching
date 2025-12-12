// src/pages/CandidateOffersPage.tsx
import { useEffect, useState } from "react";
import api from "../api";

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
            ? "Accès refusé (vérifie que tu es bien connecté comme candidat)."
            : "Impossible de charger les offres."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Offres disponibles</h2>

      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: "#f97373" }}>{error}</p>}

      {!loading && !error && jobs.length === 0 && (
        <p>Aucune offre pour le moment.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {jobs.map((job) => (
          <div
            key={job.id}
            style={{
              padding: 12,
              borderRadius: 8,
              background: "#181818",
              border: "1px solid #333",
            }}
          >
            <h3 style={{ margin: 0 }}>{job.title}</h3>
            <p
              style={{
                margin: "4px 0 0",
                color: "#aaa",
                fontSize: 14,
              }}
            >
              {job.description?.slice(0, 200) ?? ""}…
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
