package com.resume.resume_service.resume;

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
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String candidateEmail;

    private String minioKey;

    @Column(columnDefinition = "TEXT")
    private String competences;

    private Integer experienceYears;

    @Column(columnDefinition = "TEXT")
    private String embeddingJson;

    private String filename;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
