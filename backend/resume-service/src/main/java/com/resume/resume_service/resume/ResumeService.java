package com.resume.resume_service.resume;

import com.resume.resume_service.Job.JobMatchRepository;
import com.resume.resume_service.Services.MinioService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final JobMatchRepository jobMatchRepository;
    private final MinioService minioService;
    @Transactional
    public void deleteMyResume(String email) {

        Resume resume = resumeRepository
                .findTopByCandidateEmailOrderByCreatedAtDesc(email)
                .orElseThrow();

        // 1️⃣ Supprimer les matches
        jobMatchRepository.deleteByResumeId(resume.getId());

        // 2️⃣ Supprimer le fichier MinIO
        try {
            minioService.delete(resume.getMinioKey());
        } catch (Exception e) {
            // log mais on continue
        }

        // 3️⃣ Supprimer le CV
        resumeRepository.delete(resume);
    }
    public Resume saveNewResume(String email, String filename, String minioKey) {
        Resume resume = Resume.builder()
                .candidateEmail(email)
                .filename(filename)
                .minioKey(minioKey)
                .build();
        return resumeRepository.save(resume);
    }
}
