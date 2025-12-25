import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { 
  Briefcase, 
  Users, 
  TrendingUp, 
  MoreHorizontal
} from "lucide-react";

import "./RecruiterDashboard.css";

// --- TYPES ---
interface Activity {
  candidateName: string;
  jobTitle: string;
  time: string;
  type: string;
  score?: number;
}

interface DashboardStats {
  totalJobs: number;
  totalApplications: number;
  applicationsPerJob: Record<string, number>;
  recentActivities: Activity[];
}

// --- HELPER : TEMPS ÉCOULÉ ---
function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " an(s)";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " mois";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " jour(s)";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " heure(s)";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minute(s)";
  return "à l'instant";
}

export default function RecruiterDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/api/dashboard/recruiter/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Erreur chargement dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="dashboard-container">Chargement...</div>;
  if (!stats) return <div className="dashboard-container">Erreur ou aucune donnée.</div>;

  // Préparation données Graphique
  const chartData = Object.keys(stats.applicationsPerJob).map((key) => ({
    name: key,
    candidats: stats.applicationsPerJob[key],
  }));

  const barColors = ["#4F46E5", "#6366F1", "#818CF8", "#A5B4FC"];

  const avg = stats.totalJobs > 0 
      ? (stats.totalApplications / stats.totalJobs).toFixed(1) 
      : "0";

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Vue d'ensemble</h1>
          <p className="dashboard-subtitle">Bienvenue sur votre espace de recrutement IA</p>
        </div>
        <button 
          className="btn-create-job"
          onClick={() => navigate('/recruiter/jobs')} 
        >
          + Gérer les Offres
        </button>
      </div>
      
      {/* KPI CARDS */}
      <div className="kpi-grid">
        {/* ✅ MODIFICATION : Ajout du onClick pour rediriger vers les offres */}
        <div 
          className="kpi-card" 
          onClick={() => navigate('/recruiter/jobs')}
          style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
          title="Cliquez pour voir vos offres"
        >
          <div className="kpi-icon-wrapper blue">
            <Briefcase size={24} color="#2563EB" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Offres Actives</span>
            <div className="kpi-value">{stats.totalJobs}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper green">
            <Users size={24} color="#16A34A" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Candidatures</span>
            <div className="kpi-value">{stats.totalApplications}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper purple">
            <TrendingUp size={24} color="#9333EA" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Moyenne / Offre</span>
            <div className="kpi-value">{avg}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content-grid">
        {/* GRAPHIQUE */}
        <div className="chart-section">
          <div className="section-header">
            <h2 className="section-title">Performance des Offres</h2>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#6B7280', fontSize: 12}} 
                  dy={10}
                />
                
                <YAxis 
                  allowDecimals={false} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#6B7280', fontSize: 12}} 
                />
                
                <Tooltip 
                  cursor={{fill: '#F3F4F6'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="candidats" radius={[4, 4, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
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
            <h2 className="section-title">Activité Récente</h2>
            <MoreHorizontal size={20} className="text-gray-400" />
          </div>
          
          <div className="activity-list">
            {stats.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((activity, index) => (
                <div className="activity-item" key={index}>
                  <div className="avatar">
                    {activity.candidateName ? activity.candidateName.charAt(0).toUpperCase() : '?'}
                  </div>
                  
                  <div className="activity-info">
                    <p className="activity-text">
                      <strong>{activity.candidateName}</strong> a postulé à <strong>{activity.jobTitle}</strong>
                    </p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span className="activity-time">
                        Il y a {timeAgo(activity.time)}
                      </span>
                      
                      {activity.score !== undefined && activity.score !== null && (
                        <span style={{ 
                          fontSize: '11px', 
                          backgroundColor: '#DCFCE7', 
                          color: '#16A34A', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          fontWeight: 'bold'
                        }}>
                          {(activity.score * 100).toFixed(0)}% Match
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic' }}>
                Aucune activité récente.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}