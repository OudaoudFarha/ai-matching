// src/pages/RecruiterJobsPage.tsx
import { useEffect, useState } from "react";
import api from "../api";

interface Job {
  id: number;
  title: string;
  description: string;
  createdAt: string;
}

export default function RecruiterJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // état pour le formulaire de création
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // 🔹 Charger les offres du recruteur
  const loadJobs = async () => {
    setLoading(true);
    setError("");
    try {
      // IMPORTANT : endpoint qui existe dans ton backend
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

  // 🔹 Soumission du formulaire "Nouvelle offre"
  const submitNewJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setCreating(true);
    try {
      // le backend met recruiterEmail à partir du JWT
      const res = await api.post<Job>("/api/jobs", {
        title: newTitle,
        description: newDescription,
      });

      // on ajoute la nouvelle offre à la liste
      setJobs((prev) => [res.data, ...prev]);

      // on reset le formulaire
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

  return (
    <div>
      {/* HEADER + bouton */}
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

      {/* FORMULAIRE DE CRÉATION */}
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

      {/* MESSAGES D’ÉTAT */}
      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: "#f97373" }}>{error}</p>}

      {!loading && !error && jobs.length === 0 && (
        <p>Vous n’avez encore publié aucune offre.</p>
      )}

      {/* LISTE DES OFFRES */}
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
              {job.description?.slice(0, 160) || ""}…
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
