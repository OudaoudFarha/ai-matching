// src/api.ts
// src/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    const value = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

    // ✅ compatible axios v1 + TS
    config.headers?.set?.("Authorization", value);

    // fallback si headers n'a pas set() (rare)
    if (!config.headers?.set) {
      (config.headers as any) = config.headers ?? {};
      (config.headers as any)["Authorization"] = value;
    }
  }
  return config;
});

export default api;
