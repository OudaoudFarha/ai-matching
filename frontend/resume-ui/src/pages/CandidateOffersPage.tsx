// src/pages/CandidateOffersPage.tsx
import { useEffect, useState } from "react";
import api from "../api";

interface Job {
  id: number;
  title: string;
  description: string;
  createdAt?: string;
}

export default function CandidateOffersPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<Job[]>("/api/jobs");
        setJobs(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p>Chargement des offres...</p>;

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Offres disponibles</h2>
      {jobs.length === 0 && <p>Aucune offre pour le moment.</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
          gap: 16,
        }}
      >
        {jobs.map((job) => (
          <article
            key={job.id}
            style={{
              padding: 16,
              borderRadius: 12,
              background: "#1e1e1e",
              border: "1px solid #272727",
              boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
            }}
          >
            <h3 style={{ marginBottom: 8 }}>{job.title}</h3>
            <p
              style={{
                fontSize: 14,
                color: "#bbb",
                maxHeight: 80,
                overflow: "hidden",
              }}
            >
              {job.description}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
