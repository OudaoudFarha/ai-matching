// src/pages/CandidateMatchingPage.tsx
import { useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";

type MatchRow = {
  jobId: number;
  title: string;
  description: string;
  score: number;
};

export default function CandidateMatchingPage() {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get<MatchRow[]>("/api/resumes/candidate/matches");
        setRows(res.data);
      } catch (err: any) {
        const status = err?.response?.status;
        setError(
          status === 500 || status === 404
            ? "Aucun matching trouvé. Uploade ton CV d'abord."
            : "Impossible de charger le matching."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Matching IA</h2>

      <p style={{ color: "#aaa", marginTop: 0 }}>
        Offres triées par score calculé par l’analyse NLP.
      </p>

      {loading && <p>Chargement...</p>}
      {error && (
        <p style={{ color: "#f97373" }}>
          {error}{" "}
          <Link to="/candidate/upload" style={{ color: "#4f9cff" }}>
            Gérer mon CV
          </Link>
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((m) => (
          <div
            key={m.jobId}
            style={{
              padding: 12,
              borderRadius: 10,
              background: "#181818",
              border: "1px solid #333",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>{m.title}</h3>
              <div
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#0b2a4a",
                  border: "1px solid #4f9cff",
                  color: "#cfe7ff",
                  fontSize: 13,
                }}
              >
                Score: {Number(m.score).toFixed(2)}
              </div>
            </div>

            <p style={{ margin: "8px 0 0", color: "#aaa", fontSize: 14 }}>
              {m.description?.slice(0, 220) ?? ""}…
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
