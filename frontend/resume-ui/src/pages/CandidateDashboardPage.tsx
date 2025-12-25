import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { 
  FileText, CheckCircle, TrendingUp, Clock
} from "lucide-react";
import "./RecruiterDashboard.css"; // On réutilise le CSS existant

// Types
interface Activity {
  jobTitle: string;
  time: string;
  score?: number;
  description?: string;
}

interface CandidateStats {
  totalApplications: number;
  interviewsCount: number;
  averageScore: number;
  statusDistribution: Record<string, number>;
  recentActivities: Activity[];
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} j`;
}

export default function CandidateDashboardPage() {
  const [stats, setStats] = useState<CandidateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Appel au nouvel endpoint candidat
    api.get("/api/dashboard/candidate/stats")
      .then(res => setStats(res.data))
      .catch(err => console.error("Erreur stats candidat", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="dashboard-container">Chargement...</div>;
  if (!stats) return <div className="dashboard-container">Aucune donnée disponible.</div>;

  // Données pour le graphique (Statuts)
  const chartData = Object.keys(stats.statusDistribution).map(key => ({
    name: key,
    value: stats.statusDistribution[key]
  }));

  const barColors = ["#3B82F6", "#10B981", "#EF4444", "#F59E0B"];

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Mon Espace Candidat</h1>
          <p className="dashboard-subtitle">Suivez l'impact de vos candidatures</p>
        </div>
        <button className="btn-create-job" onClick={() => navigate('/candidate/jobs')}>
          🔍 Chercher un emploi
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="kpi-grid">
        <div 
          className="kpi-card" 
          onClick={() => navigate('/candidate/applications')}
          style={{ cursor: 'pointer' }}
        >
          <div className="kpi-icon-wrapper blue">
            <FileText size={24} color="#2563EB" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Candidatures</span>
            <div className="kpi-value">{stats.totalApplications}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper green">
            <CheckCircle size={24} color="#16A34A" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Entretiens / Positifs</span>
            <div className="kpi-value">{stats.interviewsCount}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper purple">
            <TrendingUp size={24} color="#9333EA" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Score Moyen</span>
            <div className="kpi-value">{(stats.averageScore * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content-grid">
        {/* GRAPHIQUE */}
        <div className="chart-section">
          <div className="section-header">
            <h2 className="section-title">État de mes demandes</h2>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={50}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ACTIVITÉ RÉCENTE */}
        <div className="recent-section">
          <div className="section-header">
            <h2 className="section-title">Historique Récent</h2>
            <Clock size={20} className="text-gray-400" />
          </div>
          <div className="activity-list">
            {stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((act, idx) => (
                <div className="activity-item" key={idx}>
                  <div className="avatar" style={{backgroundColor: '#EFF6FF', color: '#2563EB'}}>
                    Moi
                  </div>
                  <div className="activity-info">
                    <p className="activity-text">
                      Candidature : <strong>{act.jobTitle}</strong>
                    </p>
                    <div style={{display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center'}}>
                      <span className="activity-time">Il y a {timeAgo(act.time)}</span>
                      <span style={{fontSize: '11px', background: '#F3F4F6', color: '#374151', padding: '2px 6px', borderRadius: '4px'}}>
                        {act.description}
                      </span>
                      {act.score !== null && act.score !== undefined && (
                        <span style={{fontSize: '11px', background: '#DCFCE7', color: '#16A34A', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold'}}>
                          {(act.score * 100).toFixed(0)}% Match
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic', padding: '20px'}}>
                Aucune activité récente.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}