import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CandidateOffersPage from "./pages/CandidateOffersPage";
import CandidateUploadPage from "./pages/CandidateUploadPage";
import CandidateMatchingPage from "./pages/CandidateMatchingPage";
// ✅ IMPORT DU PROFIL
import CondidatProfil from "./pages/CondidatProfil"; 
import RecruiterProfile from "./pages/RecruiterProfile"; 
import CandidateLayout from "./layouts/CandidateLayout";
import RecruiterLayout from "./layouts/RecruiterLayout";
import RecruiterJobsPage from "./pages/RecruiterJobsPage";
import RecruiterCvScreeningPage from "./pages/RecruiterCvScreeningPage";
import CandidateJobDetailsPage from "./pages/CandidateJobDetailsPage";

import JobApplicationsPage from "./pages/JobApplicationsPage";

function ProtectedRoute({ children, allowedRoles }: { children: JSX.Element, allowedRoles?: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
     // Optionnel : redirection si mauvais rôle
  }
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

          {/* Candidat - matching */}
          <Route
            path="/candidate/matching"
            element={
              <ProtectedRoute>
                <CandidateLayout>
                  <CandidateMatchingPage />
                </CandidateLayout>
              </ProtectedRoute>
            }
          />

          {/* ✅ NOUVELLE ROUTE : Candidat - Profil */}
          <Route
            path="/candidate/profile"
            element={
              <ProtectedRoute>
                <CandidateLayout>
                  <CondidatProfil />
                </CandidateLayout>
              </ProtectedRoute>
            }
          />
          <Route
  path="/candidate/jobs/:id"
  element={
    <ProtectedRoute>
      <CandidateLayout>
        <CandidateJobDetailsPage />
      </CandidateLayout>
    </ProtectedRoute>
  }
/>
          {/* Recruteur */}
          <Route
            path="/recruiter/jobs"
            element={
              <ProtectedRoute allowedRoles={["RECRUITER"]}>
                <RecruiterLayout>
                  <RecruiterJobsPage />
                </RecruiterLayout>
              </ProtectedRoute>
            }
          />
          <Route
  path="/recruiter/profile"
  element={
    <ProtectedRoute allowedRoles={["RECRUITER"]}>
      <RecruiterLayout>
        <RecruiterProfile />
      </RecruiterLayout>
    </ProtectedRoute>
  }
/>
          <Route
            path="/recruiter/jobs/:jobId/screening"
            element={
              <ProtectedRoute allowedRoles={["RECRUITER"]}>
                <RecruiterLayout>
                  <RecruiterCvScreeningPage />
                </RecruiterLayout>
              </ProtectedRoute>
            }
          />

// ...

<Route
  path="/recruiter/jobs/:jobId/applications"
  element={
    <ProtectedRoute allowedRoles={["RECRUITER"]}>
      <RecruiterLayout>
        <JobApplicationsPage />
      </RecruiterLayout>
    </ProtectedRoute>
  }
/>

          {/* Route par défaut */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}