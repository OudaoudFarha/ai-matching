// src/auth/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
// src/auth/AuthContext.tsx

import type { ReactNode } from "react";


import { useAuth } from "./AuthContext";

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: string[];
}) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // accès refusé → rediriger vers sa home
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
