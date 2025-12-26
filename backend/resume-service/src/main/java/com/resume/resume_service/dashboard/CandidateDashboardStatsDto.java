package com.resume.resume_service.dashboard;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class CandidateDashboardStatsDto {
    private long totalApplications;
    private long interviewsCount;   // Nombre de réponses positives ou entretiens
    private double averageScore;    // Score moyen de matching global

    // Répartition par statut (ex: APPLIED: 5, REVIEWED: 2)
    private Map<String, Long> statusDistribution;

    // On réutilise la classe interne ActivityDto existante pour l'historique
    private List<DashboardStatsDto.ActivityDto> recentActivities;
}