package com.resume.resume_service.resume;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resume.resume_service.Job.Job;
import com.resume.resume_service.Job.JobMatch;
import com.resume.resume_service.Job.JobMatchRepository;
import com.resume.resume_service.Job.JobRepository;
import com.resume.resume_service.Services.MinioService;
import com.resume.resume_service.nlp.NlpClient;
import com.resume.resume_service.nlp.dto.CandidateResponseDto;
import com.resume.resume_service.nlp.dto.RankedJobDto;
import com.resume.resume_service.nlp.dto.ResumeSummaryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeRepository resumeRepository;
    private final JobRepository jobRepository;
    private final JobMatchRepository jobMatchRepository;
    private final NlpClient nlpClient;
    private final MinioService minioService;
    private final ResumeService resumeService;
    private final ObjectMapper objectMapper;

    // 1️⃣ Récupérer le CV actuel
    @PreAuthorize("hasRole('CANDIDATE')")
    @GetMapping("/candidate/me")
    public ResponseEntity<ResumeSummaryDto> getMyResume(Authentication auth) {
        return resumeRepository.findTopByCandidateEmailOrderByCreatedAtDesc(auth.getName())
                .map(r -> ResponseEntity.ok(
                        new ResumeSummaryDto(r.getId(), r.getFilename(), r.getCreatedAt())
                ))
                .orElse(ResponseEntity.noContent().build());
    }

    // 2️⃣ Télécharger le CV
    @PreAuthorize("hasRole('CANDIDATE')")
    @GetMapping("/candidate/download")
    public ResponseEntity<byte[]> downloadMyResume(Authentication auth) throws Exception {

        Resume r = resumeRepository
                .findTopByCandidateEmailOrderByCreatedAtDesc(auth.getName())
                .orElseThrow();

        byte[] bytes = minioService.download(r.getMinioKey());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + r.getFilename() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(bytes);
    }

    // 3️⃣ Supprimer le CV
    @PreAuthorize("hasRole('CANDIDATE')")
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMyResume(Authentication auth) {
        resumeService.deleteMyResume(auth.getName());
        return ResponseEntity.ok().build();
    }

    // 4️⃣ Upload + analyse NLP
    @PreAuthorize("hasRole('CANDIDATE')")
    @PostMapping("/candidate/upload")
    public CandidateResponseDto uploadAndAnalyze(
            @RequestParam("file") MultipartFile file,
            Authentication auth
    ) throws Exception {

        String email = auth.getName();

        // Supprimer ancien CV s'il existe
        Resume old = resumeRepository
                .findTopByCandidateEmailOrderByCreatedAtDesc(email)
                .orElse(null);

        if (old != null) {
            jobMatchRepository.deleteByResumeId(old.getId());
            try {
                minioService.delete(old.getMinioKey());
            } catch (Exception ignored) {}
            resumeRepository.delete(old);
        }

        // Upload MinIO + DB
        String minioKey = minioService.upload(file);
        Resume resume = resumeService.saveNewResume(
                email,
                file.getOriginalFilename(),
                minioKey
        );

        // Préparer jobs pour NLP
        List<Job> jobs = jobRepository.findAll();
        List<Map<String, Object>> jobsJsonList = jobs.stream()
                .map(j -> Map.<String, Object>of(
                        "id", j.getId().toString(),
                        "titre", j.getTitle(),
                        "texte_brut", j.getDescription()
                ))
                .toList();

        String jobsJson = objectMapper.writeValueAsString(jobsJsonList);

        // Appel FastAPI
        CandidateResponseDto nlpRes = nlpClient.analyzeCandidate(
                file.getBytes(),
                file.getOriginalFilename(),
                jobsJson
        );

        // Update Resume
        resume.setCompetences(nlpRes.cv_competences());
        resume.setExperienceYears(nlpRes.experience_estimee());
        resumeRepository.save(resume);

        // Sauvegarde JobMatch
        for (RankedJobDto r : nlpRes.offres_classees()) {
            Job job = jobRepository
                    .findById(Long.parseLong(r.job_id()))
                    .orElseThrow();

            JobMatch match = new JobMatch();
            match.setJob(job);
            match.setResume(resume);
            match.setScore(r.score_pertinence());

            jobMatchRepository.save(match);
        }

        return nlpRes;
    }

    // 5️⃣ Récupérer les matches
    @PreAuthorize("hasRole('CANDIDATE')")
    @GetMapping("/candidate/matches")
    public List<Map<String, Object>> getMyMatches(Authentication auth) {

        Resume r = resumeRepository
                .findTopByCandidateEmailOrderByCreatedAtDesc(auth.getName())
                .orElseThrow();

        return jobMatchRepository
                .findByResumeIdOrderByScoreDesc(r.getId())
                .stream()
                .map(m -> Map.<String, Object>of(
                        "jobId", m.getJob().getId(),
                        "title", m.getJob().getTitle(),
                        "description", m.getJob().getDescription(),
                        "score", m.getScore()
                ))
                .toList();
    }
}
