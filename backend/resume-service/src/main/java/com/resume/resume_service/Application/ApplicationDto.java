package com.resume.resume_service.Application;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ApplicationDto {

    private Long id;
    private Long jobId;
    private String jobTitle;          // ✅ Utile pour l'espace candidat (savoir à quoi on a postulé)
    private String jobDescription;    // (Optionnel)
    private Long candidateId;
    private String candidateName;
    private String candidateEmail;
    private String cvOriginalName;
    private String cvDownloadUrl;
    private Instant appliedAt;
    private ApplicationStatus status;
    private Double score;             // Score de matching (0.0 à 1.0)

    // ====== FACTORY METHODS ======

    public static ApplicationDto fromEntity(Application app) {
        // Si le score est déjà stocké dans l'entité Application, on l'utilise
        return fromEntity(app, app.getMatchScore());
    }

    public static ApplicationDto fromEntity(Application app, Double score) {

        // Construction de l'URL de téléchargement
        String downloadUrl = "/api/applications/" + app.getId() + "/cv";

        String candidateName = null;
        String candidateEmail = null;
        Long candidateId = null;
        String jobTitle = null;
        String jobDescription = null;
        Long jobId = null;

        // Extraction sécurisée des infos candidat
        if (app.getCandidate() != null) {
            var user = app.getCandidate();
            candidateId = user.getId();
            candidateEmail = user.getEmail();
            // On utilise l'email comme nom par défaut si pas de champ nom/prénom
            candidateName = user.getEmail();
        }

        // Extraction sécurisée des infos Job
        if (app.getJob() != null) {
            jobId = app.getJob().getId();
            jobTitle = app.getJob().getTitle();
            jobDescription = app.getJob().getDescription();
        }

        return ApplicationDto.builder()
                .id(app.getId())
                .jobId(jobId)
                .jobTitle(jobTitle) // ✅ Ajouté
                .jobDescription(jobDescription)
                .candidateId(candidateId)
                .candidateName(candidateName)
                .candidateEmail(candidateEmail)
                .cvOriginalName(app.getCvOriginalName())
                .cvDownloadUrl(downloadUrl)
                .appliedAt(app.getAppliedAt())
                .status(app.getStatus())
                .score(score)
                .build();
    }
}