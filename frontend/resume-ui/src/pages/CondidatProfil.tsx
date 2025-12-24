import { useState, useEffect } from "react";
import api from "../api"; // ✅ Correction de l'import (un seul point de remontée)

interface User {
  id: number;
  email: string;
  role: string;
}

export default function CondidatProfil() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    // Récupérer les infos actuelles
    api.get("/api/users/me")
      .then((res) => {
        setUser(res.data);
        setEmail(res.data.email);
      })
      .catch((err) => console.error("Erreur chargement profil", err));
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await api.put("/api/users/me", { email: email });
      setUser(res.data);
      setMessage({ type: 'success', text: "Profil mis à jour avec succès !" });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: "Erreur lors de la mise à jour." });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div style={{ padding: "40px", textAlign: "center" }}>Chargement...</div>;

  const userInitials = user.email ? user.email.substring(0, 2).toUpperCase() : "??";
  const userName = user.email ? user.email.split('@')[0] : "Utilisateur";

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Mon Profil</h2>
        <p style={styles.subtitle}>Gérez vos informations personnelles</p>

        {message && (
          <div style={message.type === 'success' ? styles.alertSuccess : styles.alertError}>
            {message.text}
          </div>
        )}

        <div style={styles.avatarSection}>
          <div style={styles.largeAvatar}>
            {userInitials}
          </div>
          <div>
              <h3 style={styles.nameTitle}>{userName}</h3>
              <span style={styles.roleBadge}>{user.role}</span>
          </div>
        </div>

        <form onSubmit={handleUpdate} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Adresse Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <button 
              type="submit" 
              style={loading ? styles.buttonDisabled : styles.button}
              disabled={loading}
          >
            {loading ? "Enregistrement..." : "Sauvegarder les modifications"}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- STYLES ---
const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", justifyContent: "center", paddingTop: "40px" },
  card: { backgroundColor: "white", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "550px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" },
  title: { fontSize: "24px", fontWeight: 800, color: "#1f2937", marginBottom: "8px", marginTop: 0 },
  subtitle: { color: "#6b7280", marginBottom: "32px", marginTop: 0 },
  avatarSection: { display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid #f3f4f6' },
  largeAvatar: { width: "84px", height: "84px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "white", fontSize: "32px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" },
  nameTitle: { margin: "0 0 4px 0", fontSize: '20px', color: "#111827" },
  roleBadge: { backgroundColor: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, border: "1px solid #dbeafe" },
  form: { display: "flex", flexDirection: "column", gap: "24px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "14px", fontWeight: 600, color: "#374151" },
  input: { padding: "12px 16px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "16px", outline: "none", backgroundColor: "#f9fafb" },
  button: { backgroundColor: "#2563eb", color: "white", padding: "14px", borderRadius: "8px", border: "none", fontWeight: 600, cursor: "pointer", fontSize: "16px" },
  buttonDisabled: { backgroundColor: "#93c5fd", color: "white", padding: "14px", borderRadius: "8px", border: "none", fontWeight: 600, cursor: "not-allowed" },
  alertSuccess: { padding: "16px", backgroundColor: "#f0fdf4", color: "#166534", borderRadius: "8px", marginBottom: "24px", border: "1px solid #bbf7d0" },
  alertError: { padding: "16px", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "8px", marginBottom: "24px", border: "1px solid #fecaca" }
};