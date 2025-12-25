package com.resume.resume_service.Application;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id")
    private User candidate;

    private String cvPath;
    private String cvOriginalName;

    @Builder.Default
    private Instant appliedAt = Instant.now();

    @Enumerated(EnumType.STRING)
    private ApplicationStatus status = ApplicationStatus.APPLIED;

    // ✅ AJOUT CRUCIAL : Le score de matching (0.0 à 1.0)
    // Tu devras remplir ce champ quand tu fais l'IA ou quand le candidat postule
    private Double matchScore;
}