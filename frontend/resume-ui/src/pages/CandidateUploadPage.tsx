// src/pages/CandidateUploadPage.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import api from "../api";

export default function CandidateUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setResult("");

    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    setLoading(true);
    try {
      // ⚠ tu peux ENLEVER le header "Content-Type",
      // axios le mettra tout seul avec le bon boundary.
      const res = await api.post("/api/resumes", form /*, {
        headers: { "Content-Type": "multipart/form-data" },
      }*/);

      setResult(JSON.stringify(res.data, null, 2));
      alert("CV uploadé avec succès ✅");
    } catch (err: any) {
      console.error("❌ Erreur upload CV:", err);

      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.message || err?.message;

      const msg =
        status === 403
          ? "403 : Accès refusé (token ou rôle invalide)."
          : status === 401
          ? "401 : Non authentifié (pas de token)."
          : status === 415
          ? "415 : Format de fichier non supporté."
          : status
          ? `Erreur ${status} lors de l'upload du CV : ${backendMsg ?? ""}`
          : `Erreur réseau lors de l'upload du CV : ${backendMsg ?? ""}`;

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Uploader mon CV</h2>

      <form
        onSubmit={submit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: 460,
        }}
      >
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          style={{
            padding: 8,
            borderRadius: 6,
            border: "1px solid #333",
            background: "#181818",
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
          }}
        >
          {loading ? "Envoi..." : "Envoyer"}
        </button>
      </form>

      {error && (
        <p style={{ marginTop: 12, color: "#f97373", fontSize: 14 }}>{error}</p>
      )}

      {result && (
        <pre
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            background: "#101010",
            border: "1px solid #222",
            fontSize: 12,
          }}
        >
          {result}
        </pre>
      )}
    </div>
  );
}
