import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";

// Pages Communes
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Pages Candidat
import CandidateOffersPage from "./pages/CandidateOffersPage";
import CandidateUploadPage from "./pages/CandidateUploadPage";
import CandidateMatchingPage from "./pages/CandidateMatchingPage";
import CondidatProfil from "./pages/CondidatProfil"; 
import CandidateJobDetailsPage from "./pages/CandidateJobDetailsPage";
import CandidateApplicationsPage from "./pages/CandidateApplicationsPage"; 
import CandidateDashboardPage from "./pages/CandidateDashboardPage"; // ✅ NOUVEL IMPORT
import CandidateLayout from "./layouts/CandidateLayout";

// Pages Recruteur
import RecruiterLayout from "./layouts/RecruiterLayout";
import RecruiterProfile from "./pages/RecruiterProfile"; 
import RecruiterJobsPage from "./pages/RecruiterJobsPage";
import RecruiterCvScreeningPage from "./pages/RecruiterCvScreeningPage";
import JobApplicationsPage from "./pages/JobApplicationsPage";
import RecruiterDashboardPage from "./pages/RecruiterDashboardPage";

function ProtectedRoute({ children, allowedRoles }: { children: JSX.Element, allowedRoles?: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
     return <Navigate to={user.role === 'CANDIDATE' ? '/candidate' : '/recruiter'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ================= AUTH ================= */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ================= CANDIDAT ================= */}
          
          {/* 1. ✅ DASHBOARD (Route par défaut pour le candidat) */}
          <Route
            path="/candidate"
            element={
              <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                <CandidateLayout>
                  <CandidateDashboardPage />
                </CandidateLayout>
              </ProtectedRoute>
            }
          />

          {/* 2. Liste des offres (Déplacée sur /jobs) */}
          <Route
            path="/candidate/jobs"
            element={
              <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                <CandidateLayout>
                  <CandidateOffersPage />
                </CandidateLayout>
              </ProtectedRoute>
            }
          />

          {/* 3. Mes Candidatures */}
          <Route
            path="/candidate/applications"
            element={
              <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                <CandidateLayout>
                  <CandidateApplicationsPage />
                </CandidateLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/candidate/upload"
            element={
              <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                <CandidateLayout>
                  <CandidateUploadPage />
                </CandidateLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/candidate/matching"
            element={
              <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                <CandidateLayout>
                  <CandidateMatchingPage />
                </CandidateLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/candidate/profile"
            element={
              <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                <CandidateLayout>
                  <CondidatProfil />
                </CandidateLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/candidate/jobs/:id"
            element={
              <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                <CandidateLayout>
                  <CandidateJobDetailsPage />
                </CandidateLayout>
              </ProtectedRoute>
            }
          />

          {/* ================= RECRUTEUR ================= */}
          
          <Route
            path="/recruiter"
            element={
              <ProtectedRoute allowedRoles={["RECRUITER"]}>
                <RecruiterLayout>
                  <RecruiterDashboardPage />
                </RecruiterLayout>
              </ProtectedRoute>
            }
          />

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

          {/* ================= FALLBACK ================= */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}