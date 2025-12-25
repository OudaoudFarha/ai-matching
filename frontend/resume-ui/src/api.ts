// src/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  console.log('🔐 [API Interceptor] Requête:', {
    method: config.method?.toUpperCase(),
    url: config.url
  });

  const token = localStorage.getItem("token");
  
  console.log('🔑 [API Interceptor] Token brut:', token ? `${token.substring(0, 20)}...` : 'NULL');
  console.log('🔑 [API Interceptor] Token existe?', !!token);
  
  if (token) {
    const value = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    console.log('✅ [API Interceptor] Authorization header ajouté');

    // ✅ compatible axios v1 + TS
    config.headers?.set?.("Authorization", value);

    // fallback si headers n'a pas set() (rare)
    if (!config.headers?.set) {
      (config.headers as any) = config.headers ?? {};
      (config.headers as any)["Authorization"] = value;
    }
  } else {
    console.error('❌ [API Interceptor] AUCUN TOKEN - La requête sera rejetée avec 403!');
    console.error('❌ [API Interceptor] localStorage contient:', Object.keys(localStorage));
  }
  
  return config;
});

// Intercepteur de réponse pour mieux voir les erreurs
api.interceptors.response.use(
  (response) => {
    console.log('✅ [API Response]', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ [API Response Error]', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });
    
    if (error.response?.status === 403) {
      console.error('🚫 [API] 403 FORBIDDEN - Vérifiez:');
      console.error('  1. Le token existe dans localStorage?', !!localStorage.getItem('token'));
      console.error('  2. Le token est valide?');
      console.error('  3. L\'utilisateur a le rôle CANDIDATE?');
    }
    
    return Promise.reject(error);
  }
);

export default api;