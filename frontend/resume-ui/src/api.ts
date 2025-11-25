// src/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    const value = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
    config.headers.Authorization = value;
    // DEBUG : voir réellement ce qui part
    // console.log("🔐 Authorization:", value);
  }
  return config;
});

export default api;
