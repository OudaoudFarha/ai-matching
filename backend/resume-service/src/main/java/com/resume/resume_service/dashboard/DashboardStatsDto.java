package com.resume.resume_service.dashboard;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;
import java.time.Instant;

@Data
@Builder
public class DashboardStatsDto {
    private long totalJobs;
    private long totalApplications;
    private Map<String, Long> applicationsPerJob;

    // ✅ AJOUT : La liste des activités récentes
    private List<ActivityDto> recentActivities;

    @Data
    @Builder
    public static class ActivityDto {
        private String description; // ex: "amine@gmail.com a postulé..."
        private String type;        // "APPLICATION"
        private Instant time;       // Date de l'action
        private Double score;       // Pour afficher le badge "85%"
        private String candidateName; // ou email
        private String jobTitle;
    }
}