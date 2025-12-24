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
    private Long candidateId;
    private String candidateName;     // ici : on va mettre l'email
    private String candidateEmail;    // et ici aussi, pour plus de clarté
    private String cvOriginalName;
    private String cvDownloadUrl;
    private Instant appliedAt;
    private ApplicationStatus status;
    // 🆕 Score de matching (0–100, par ex.)
    private Double score;
    // ====== FACTORY METHODS ======

    public static ApplicationDto fromEntity(Application app) {
        return fromEntity(app, null);
    }
    public static ApplicationDto fromEntity(Application app , Double score) {

        // Endpoint pour télécharger le CV
        String downloadUrl = "/api/applications/" + app.getId() + "/cv";

        String candidateName = null;
        String candidateEmail = null;
        Long candidateId = null;

        if (app.getCandidate() != null) {
            var user = app.getCandidate();
            candidateId = user.getId();
            candidateEmail = user.getEmail();
            candidateName = user.getEmail();   // ✅ on utilise l’email comme "nom"
        }

        return ApplicationDto.builder()
                .id(app.getId())
                .jobId(app.getJob() != null ? app.getJob().getId() : null)
                .candidateId(candidateId)
                .candidateName(candidateName)
                .candidateEmail(candidateEmail)
                .cvOriginalName(app.getCvOriginalName())
                .cvDownloadUrl(downloadUrl)
                .appliedAt(app.getAppliedAt())
                .status(app.getStatus())
                .score(score)             // 🆕 on renseigne le score ici
                .build();
    }
}
