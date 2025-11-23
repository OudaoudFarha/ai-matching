package com.resume.resume_service.resume;

// src/main/java/.../resume/Resume.java
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
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String filename;
    private String objectName;
    @Lob
    private String text;             // texte extrait
    @Lob
    private String embeddingJson;    // JSON de float[]
    private Instant createdAt = Instant.now();

}
