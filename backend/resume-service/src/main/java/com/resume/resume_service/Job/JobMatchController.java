package com.resume.resume_service.Job;

import com.resume.resume_service.nlp.NlpClient;
import com.resume.resume_service.nlp.dto.RecruiterResultDto;
import com.resume.resume_service.resume.Resume;
import com.resume.resume_service.resume.ResumeRepository;
import com.resume.resume_service.Services.MinioService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobMatchController {

    private final JobRepository jobRepository;
    private final ResumeRepository resumeRepository;
    private final JobMatchRepository jobMatchRepository;
    private final NlpClient nlpClient;
    private final MinioService minioService;

    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping("/{id}/matches")
    public List<RecruiterResultDto> matchJob(@PathVariable Long id) throws Exception {
        Job job = jobRepository.findById(id).orElseThrow();

        // 1) Récupérer tous les CV (plus tard, tu pourras filtrer)
        List<Resume> resumes = resumeRepository.findAll();

        // 2) Télécharger les fichiers depuis MinIO
        Map<String, byte[]> files = new HashMap<>();
        for (Resume r : resumes) {
            byte[] bytes = minioService.download(r.getMinioKey());
            files.put(r.getFilename(), bytes);
        }

        // 3) Appeler FastAPI
        List<RecruiterResultDto> results = nlpClient.analyzeRecruiter(
                job.getDescription(),
                files
        );

        // 4) Sauvegarder les matchings en base
        for (RecruiterResultDto r : results) {
            Resume resume = resumes.stream()
                    .filter(rv -> rv.getFilename().equals(r.filename()))
                    .findFirst()
                    .orElse(null);
            if (resume == null) continue;

            JobMatch match = new JobMatch();
            match.setJob(job);
            match.setResume(resume);
            match.setScore(r.score());
            jobMatchRepository.save(match);
        }

        return results;
    }
}
