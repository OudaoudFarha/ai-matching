// src/pages/CandidateUploadPage.tsx
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import api from "../api";

type ResumeSummaryDto = {
  id: number;
  filename: string;
  createdAt: string;
};

export default function CandidateUploadPage() {
  const [current, setCurrent] = useState<ResumeSummaryDto | null>(null);
  const [loadingCurrent, setLoadingCurrent] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadCurrent = async () => {
    setLoadingCurrent(true);
    setError("");
    try {
      const res = await api.get<ResumeSummaryDto>("/api/resumes/candidate/me");
      // si 200 -> existe
      setCurrent(res.data);
    } catch (err: any) {
  if (err?.response?.status === 204) setCurrent(null);
  else if (err?.response?.status === 404) setCurrent(null);
  else if (err?.response?.status === 403) setError("403 : accès refusé (token / rôle).");
  else console.error(err);
} finally {
      setLoadingCurrent(false);
    }
  };

  useEffect(() => {
    loadCurrent();
  }, []);

  const download = async () => {
    setError("");
    try {
      const res = await api.get("/api/resumes/candidate/download", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = current?.filename ?? "cv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError("Impossible de télécharger le CV.");
    }
  };

 const remove = async () => {
  if (!confirm("Supprimer votre CV actuel ?")) return;

  setError("");
  try {
    await api.delete("/api/resumes/me");
    setCurrent(null);
    alert("CV supprimé ✅");
  } catch (err: any) {
    console.error("DELETE /api/resumes/candidate", err);
    const status = err?.response?.status;
    const data = err?.response?.data;

    setError(
      status === 401 ? "401 : Non authentifié (token absent)." :
      status === 403 ? "403 : Accès refusé (rôle/token)." :
      status ? `Erreur ${status} : ${typeof data === "string" ? data : JSON.stringify(data)}` :
      "Erreur réseau."
    );
  }
};


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    setLoading(true);
    try {
      await api.post("/api/resumes/candidate/upload", form);
      alert("CV uploadé + matching recalculé ✅");
      setFile(null);
      await loadCurrent();
    } catch (err: any) {
      const status = err?.response?.status;
      setError(
        status === 403
          ? "Accès refusé (token / rôle)."
          : status
          ? `Erreur ${status} lors de l'upload.`
          : "Erreur réseau lors de l'upload."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Gérer mon CV</h2>

      {loadingCurrent && <p>Chargement...</p>}

      {/* CV actuel */}
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          background: "#181818",
          border: "1px solid #333",
          marginBottom: 20,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Votre CV actuel</h3>

        {!current ? (
          <p style={{ color: "#aaa" }}>
            Aucun CV uploadé pour le moment.
          </p>
        ) : (
          <>
            <div style={{ color: "#ddd", fontWeight: 600 }}>
              {current.filename}
            </div>
            <div style={{ color: "#888", fontSize: 13, marginTop: 6 }}>
              Uploadé le {new Date(current.createdAt).toLocaleString()}
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
              <button
                onClick={download}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #4f9cff",
                  background: "transparent",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Télécharger
              </button>

              <button
                onClick={remove}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #ef4444",
                  background: "transparent",
                  color: "#ef4444",
                  cursor: "pointer",
                }}
              >
                Supprimer
              </button>
            </div>
          </>
        )}
      </div>

      {/* Remplacer */}
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          background: "#181818",
          border: "1px solid #333",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          {current ? "Remplacer mon CV" : "Uploader mon CV"}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 12 }}>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 10,
              border: "1px solid #333",
              background: "#101010",
              color: "#eee",
            }}
          />
          <button
            type="submit"
            disabled={!file || loading}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: "none",
              background: loading ? "#333" : "#4f9cff",
              color: "#fff",
              cursor: loading ? "default" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Envoi..." : "Envoyer"}
          </button>
        </form>

        {error && <p style={{ marginTop: 12, color: "#f97373" }}>{error}</p>}
      </div>
    </div>
  );
}
