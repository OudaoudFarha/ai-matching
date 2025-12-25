package com.resume.resume_service.dashboard;

import com.resume.resume_service.Application.Application;
import com.resume.resume_service.Application.ApplicationRepository;
import com.resume.resume_service.Application.ApplicationStatus;
import com.resume.resume_service.Job.Job;
import com.resume.resume_service.Job.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;

    // ==========================================
    // 1. STATS RECRUTEUR (Code existant)
    // ==========================================
    @GetMapping("/recruiter/stats")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<DashboardStatsDto> getRecruiterStats(Authentication auth) {
        String email = auth.getName();
        List<Job> myJobs = jobRepository.findByRecruiterEmail(email);

        long totalJobs = myJobs.size();
        long totalApplications = 0;
        Map<String, Long> appsPerJob = new HashMap<>();

        if (!myJobs.isEmpty()) {
            totalApplications = applicationRepository.countByJobIn(myJobs);
            for (Job job : myJobs) {
                long count = applicationRepository.countByJob(job);
                String label = job.getTitle();
                if (label.length() > 20) label = label.substring(0, 17) + "...";
                appsPerJob.put(label, count);
            }
        }

        List<Application> recentApps = applicationRepository.findTop5ByJob_RecruiterEmailOrderByAppliedAtDesc(email);

        List<DashboardStatsDto.ActivityDto> activities = recentApps.stream().map(app -> {
            String candidateName = app.getCandidate().getEmail();
            int atIndex = candidateName.indexOf('@');
            if(atIndex > 0) candidateName = candidateName.substring(0, atIndex);

            return DashboardStatsDto.ActivityDto.builder()
                    .candidateName(candidateName)
                    .jobTitle(app.getJob().getTitle())
                    .time(app.getAppliedAt())
                    .type("APPLICATION")
                    .score(app.getMatchScore())
                    .build();
        }).collect(Collectors.toList());

        return ResponseEntity.ok(DashboardStatsDto.builder()
                .totalJobs(totalJobs)
                .totalApplications(totalApplications)
                .applicationsPerJob(appsPerJob)
                .recentActivities(activities)
                .build());
    }

    // ==========================================
    // 2. ✅ STATS CANDIDAT (Nouveau)
    // ==========================================
    @GetMapping("/candidate/stats")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<CandidateDashboardStatsDto> getCandidateStats(Authentication auth) {
        String email = auth.getName();

        // 1. Récupérer toutes les candidatures du candidat
        List<Application> myApps = applicationRepository.findByCandidate_EmailOrderByAppliedAtDesc(email);

        long total = myApps.size();

        // 2. Compter les entretiens (Statut REVIEWED ou ACCEPTED par exemple)
        long interviews = myApps.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.REVIEWED || a.getStatus() == ApplicationStatus.ACCEPTED)
                .count();

        // 3. Calculer le score moyen de matching
        double avgScore = myApps.stream()
                .filter(a -> a.getMatchScore() != null)
                .mapToDouble(Application::getMatchScore)
                .average()
                .orElse(0.0);

        // 4. Répartition par statut pour le graphique
        Map<String, Long> statusDist = new HashMap<>();
        for (Application app : myApps) {
            String status = app.getStatus().name();
            statusDist.put(status, statusDist.getOrDefault(status, 0L) + 1);
        }

        // 5. Activité récente (Les 5 dernières candidatures)
        List<DashboardStatsDto.ActivityDto> activities = myApps.stream()
                .limit(5)
                .map(app -> DashboardStatsDto.ActivityDto.builder()
                        .candidateName("Moi")
                        .jobTitle(app.getJob().getTitle())
                        .time(app.getAppliedAt())
                        .type("STATUS_UPDATE")
                        .score(app.getMatchScore())
                        .description("Statut actuel : " + app.getStatus())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(CandidateDashboardStatsDto.builder()
                .totalApplications(total)
                .interviewsCount(interviews)
                .averageScore(avgScore)
                .statusDistribution(statusDist)
                .recentActivities(activities)
                .build());
    }
}