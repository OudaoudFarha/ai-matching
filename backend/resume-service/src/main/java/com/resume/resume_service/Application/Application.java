package com.resume.resume_service.Application;
// package com.resume.resume_service.application;

import com.resume.resume_service.Job.Job;
import com.resume.resume_service.auth.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@ToString
@Table(name = "applications")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Offre associée
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    private Job job;

    // Utilisateur candidat
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id")
    private User candidate;

    // CV stocké dans MinIO
    private String cvObjectName;      // chemin dans MinIO (ex: jobs/3/candidates/12/cv.pdf)
    private String cvOriginalName;    // nom original du fichier
    // ✅ chemin / key MinIO
    private String cvPath;
    private Instant appliedAt = Instant.now();

    @Enumerated(EnumType.STRING)
    private ApplicationStatus status = ApplicationStatus.APPLIED;

    // getters / setters
}

