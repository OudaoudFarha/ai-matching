import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

type RankedCv = {
  filename: string;
  score: number;
  competences?: string[];
  experience_estimee?: number;
};

export default function RecruiterCvScreeningPage() {
  const { jobId } = useParams();
  const [files, setFiles] = useState<File[]>([]);
  const [topN, setTopN] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<RankedCv[]>([]);

  const topList = useMemo(() => results.slice(0, topN), [results, topN]);
  const restList = useMemo(() => results.slice(topN), [results, topN]);

  const submit = async () => {
    if (!jobId) return;
    if (!files.length) return;

    setLoading(true);
    setError("");

    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      form.append("topN", String(topN));
console.log("TOKEN:", localStorage.getItem("token"));

      const res = await api.post<RankedCv[]>(
        `/api/jobs/${jobId}/screening`,
        form
      );

      setResults(res.data);
    } catch (err: any) {
      const status = err?.response?.status;
      setError(status ? `Erreur ${status}` : "Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Screening CV – Offre #{jobId}</h2>

      <div style={{ marginTop: 14, padding: 16, border: "1px solid #333", borderRadius: 12, background: "#181818" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <input
  type="file"
  multiple
  accept=".pdf,.doc,.docx"
  onChange={(e) => {
    const selected = Array.from(e.target.files ?? []);

    setFiles((prev) => {
      const map = new Map<string, File>();
      // garder anciens
      prev.forEach((f) => map.set(f.name + f.size, f));
      // ajouter nouveaux
      selected.forEach((f) => map.set(f.name + f.size, f));
      return Array.from(map.values());
    });

    // IMPORTANT: permet de re-sélectionner le même fichier après
  }}
  style={{ color: "#eee" }}
/>

{files.length > 0 && (
  <div style={{ marginTop: 10, color: "#bbb", fontSize: 13 }}>
    <div style={{ marginBottom: 6 }}>Fichiers sélectionnés :</div>
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      {files.map((f) => (
        <li key={f.name + f.size}>{f.name}</li>
      ))}
    </ul>
  </div>
)}


          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ color: "#aaa" }}>Top N :</span>
            <input
              type="number"
              min={1}
              value={topN}
              onChange={(e) => setTopN(Math.max(1, Number(e.target.value)))}
              style={{ width: 80, padding: 8, borderRadius: 10, border: "1px solid #333", background: "#101010", color: "#eee" }}
            />
          </div>

          <button
            onClick={submit}
            disabled={loading || !files.length}
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: "none",
              background: loading ? "#333" : "#4f9cff",
              color: "#fff",
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Calcul..." : "Lancer le screening"}
          </button>
        </div>

        {error && <p style={{ color: "#f97373", marginTop: 12 }}>{error}</p>}
      </div>

     {results.length > 0 && (
  <>
    <h3 style={{ marginTop: 24 }}>Top {topN}</h3>
    <div style={{ display: "grid", gap: 12 }}>
      {topList.map((r) => (
        <div
          key={r.filename}
          style={{
            padding: 14,
            borderRadius: 12,
            border: "1px solid #22c55e",
            background: "#151a15",
          }}
        >
          <div style={{ fontWeight: 700 }}>{r.filename}</div>

          <div style={{ color: "#22c55e", marginTop: 6 }}>
            Score: {Number(r.score).toFixed(2)} / 100
          </div>

          {/* mini barre */}
          <div
            style={{
              marginTop: 10,
              height: 8,
              borderRadius: 999,
              background: "#0b0f0b",
              border: "1px solid #1f2a1f",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, Math.max(0, Number(r.score)))}%`,
                background: "#22c55e",
              }}
            />
          </div>
        </div>
      ))}
    </div>

    <h3 style={{ marginTop: 24, color: "#aaa" }}>
      Autres CV ({restList.length})
    </h3>

    {restList.length === 0 ? (
      <p style={{ color: "#777" }}>Aucun autre CV.</p>
    ) : (
      <div style={{ display: "grid", gap: 12 }}>
        {restList.map((r) => (
          <div
            key={r.filename}
            style={{
              padding: 14,
              borderRadius: 12,
              border: "1px solid #333",
              background: "#141414",
              color: "#999",
            }}
          >
            <div style={{ fontWeight: 600 }}>{r.filename}</div>
            <div style={{ marginTop: 6 }}>
              Score: {Number(r.score).toFixed(2)} / 100
            </div>

            <div
              style={{
                marginTop: 10,
                height: 8,
                borderRadius: 999,
                background: "#0b0b0b",
                border: "1px solid #222",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, Math.max(0, Number(r.score)))}%`,
                  background: "#555",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    )}
  </>
)}

    </div>
  );
}
