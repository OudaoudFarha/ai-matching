// src/pages/RecruiterJobsPage.tsx
import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

interface Job {
  id: number;
  title: string;
  description: string;
  createdAt: string;
}

function JobCard({
  job,
  onScreening,
}: {
  job: Job;
  onScreening: (jobId: number) => void;
}) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        border: "1px solid #333",
        background: "#181818",
      }}
    >
      <div style={{ fontWeight: 700 }}>{job.title}</div>
      <div style={{ color: "#aaa", marginTop: 6 }}>
        {job.description?.slice(0, 60)}...
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button
          onClick={() => onScreening(job.id)}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #22c55e",
            background: "transparent",
            color: "#22c55e",
            cursor: "pointer",
          }}
        >
          Screening CV
        </button>
      </div>
    </div>
  );
}

export default function RecruiterJobsPage() {
  const navigate = useNavigate(); // ✅ ici seulement

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const loadJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get<Job[]>("/api/jobs/mine");
      setJobs(res.data);
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

  const submitNewJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setCreating(true);
    try {
      const res = await api.post<Job>("/api/jobs", {
        title: newTitle,
        description: newDescription,
      });

      setJobs((prev) => [res.data, ...prev]);
      setNewTitle("");
      setNewDescription("");
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de l'offre.");
    } finally {
      setCreating(false);
    }
  };

  const goScreening = (jobId: number) => {
    navigate(`/recruiter/jobs/${jobId}/screening`);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2>Mes offres publiées</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            border: "none",
            background: "#4f9cff",
            color: "#fff",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          {showForm ? "Annuler" : "+ Nouvelle offre"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={submitNewJob}
          style={{
            marginBottom: 20,
            padding: 16,
            borderRadius: 8,
            background: "#181818",
            border: "1px solid #333",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <input
            placeholder="Titre de l'offre"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{
              padding: 8,
              borderRadius: 6,
              border: "1px solid #444",
              background: "#111",
              color: "#fff",
            }}
          />
          <textarea
            placeholder="Description"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            style={{
              padding: 8,
              borderRadius: 6,
              border: "1px solid #444",
              background: "#111",
              color: "#fff",
              minHeight: 90,
            }}
          />
          <button
            type="submit"
            disabled={creating}
            style={{
              alignSelf: "flex-end",
              padding: "8px 14px",
              borderRadius: 999,
              border: "none",
              background: creating ? "#333" : "#4f9cff",
              color: "#fff",
              cursor: creating ? "default" : "pointer",
              fontSize: 14,
            }}
          >
            {creating ? "Enregistrement..." : "Publier l'offre"}
          </button>
        </form>
      )}

      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: "#f97373" }}>{error}</p>}

      {!loading && !error && jobs.length === 0 && (
        <p>Vous n’avez encore publié aucune offre.</p>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onScreening={goScreening} />
        ))}
      </div>
    </div>
  );
}
