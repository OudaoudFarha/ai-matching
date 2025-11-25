// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CandidateOffersPage from "./pages/CandidateOffersPage";
import CandidateUploadPage from "./pages/CandidateUploadPage";
import CandidateLayout from "./layouts/CandidateLayout";
import RecruiterLayout from "./layouts/RecruiterLayout";
import RecruiterJobsPage from "./pages/RecruiterJobsPage";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Candidat - page offres */}
          <Route
            path="/candidate"
            element={
              <ProtectedRoute>
                <CandidateLayout>
                  <CandidateOffersPage />
                </CandidateLayout>
              </ProtectedRoute>
            }
          />

          {/* Candidat - upload CV */}
          <Route
            path="/candidate/upload"
            element={
              <ProtectedRoute>
                <CandidateLayout>
                  <CandidateUploadPage />
                </CandidateLayout>
              </ProtectedRoute>
            }
          />

          {/* Recruteur - mes offres */}
          <Route
            path="/recruiter/jobs"
            element={
              <ProtectedRoute>
                <RecruiterLayout>
                  <RecruiterJobsPage />
                </RecruiterLayout>
              </ProtectedRoute>
            }
          />

          {/* Route par défaut → login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
