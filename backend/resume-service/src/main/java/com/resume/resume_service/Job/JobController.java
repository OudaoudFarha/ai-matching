// src/main/java/com/resume/resume_service/Job/JobController.java
package com.resume.resume_service.Job;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resume.resume_service.nlp.NlpClient;
import com.resume.resume_service.nlp.dto.RecruiterResultDto;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobRepository repo;
    private final NlpClient nlp;
    private final ObjectMapper om = new ObjectMapper();

    public JobController(JobRepository repo, NlpClient nlp) {
        this.repo = repo;
        this.nlp = nlp;
    }

    // ─────────────── CRÉATION D'UNE OFFRE (recruteur) ───────────────
    @PreAuthorize("hasRole('RECRUITER')")
    @PostMapping
    public Job create(@RequestBody Job job, Authentication auth) {
        job.setId(null);
        job.setRecruiterEmail(auth.getName());
        return repo.save(job);
    }

    // ─────────────── OFFRES DU RECRUTEUR CONNECTÉ ───────────────
    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping("/mine")
    public List<Job> listMine(Authentication auth) {
        System.out.println("Auth = " + auth.getName() + " | " + auth.getAuthorities());
        return repo.findByRecruiterEmail(auth.getName());
    }

    // ─────────────── LISTE PUBLIQUE POUR LES CANDIDATS ───────────────
    // utilisée par le front candidat
    @PreAuthorize("hasAnyRole('CANDIDATE','RECRUITER')")
    @GetMapping("/public")
    public List<Job> listPublicJobs() {
        return repo.findAll();
    }



    @PostMapping("/{jobId}/screening")
    @PreAuthorize("hasRole('RECRUITER')")
    public List<RecruiterResultDto> screening(
            @PathVariable Long jobId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("topN") int topN

    ) {
        Job job = repo.findById(jobId).orElseThrow();

        // On envoie les fichiers uploadés + la description de l'offre au FastAPI
        return nlp.screeningRecruiter(job.getDescription(), files, topN);
    }
    // ─────────────── INDEXATION D'UNE OFFRE ───────────────
    @PreAuthorize("hasRole('RECRUITER')")
    @PostMapping("/{id}/index")
    public Job index(@PathVariable Long id) throws Exception {
        Job j = repo.findById(id).orElseThrow();
        float[] vec = nlp.embed(j.getTitle() + " " + j.getDescription());
        j.setEmbeddingJson(om.writeValueAsString(vec));
        return repo.save(j);
    }

    // ─────────────── DÉTAIL D'UNE OFFRE ───────────────
    @PreAuthorize("hasAnyRole('RECRUITER','CANDIDATE')")
    @GetMapping("/{id}")
    public Job get(@PathVariable Long id) {
        return repo.findById(id).orElseThrow();
    }
}
