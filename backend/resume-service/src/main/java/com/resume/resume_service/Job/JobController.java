package com.resume.resume_service.Job;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resume.resume_service.Application.ApplicationRepository;
import com.resume.resume_service.nlp.NlpClient;
import com.resume.resume_service.nlp.dto.RecruiterResultDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobRepository repo;
    private final NlpClient nlp;
    private final ObjectMapper om = new ObjectMapper();
    private final ApplicationRepository applicationRepository;
    public JobController(JobRepository repo, NlpClient nlp , ApplicationRepository applicationRepository) {
        this.repo = repo;
        this.nlp = nlp;
        this.applicationRepository = applicationRepository;
    }

    // ... (Gardez create, listMine, listPublicJobs tels quels) ...
    @PreAuthorize("hasRole('RECRUITER')")
    @PostMapping
    public Job create(@RequestBody Job job, Authentication auth) {
        job.setId(null);
        job.setRecruiterEmail(auth.getName());
        return repo.save(job);
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping("/mine")
    public List<Job> listMine(Authentication auth) {
        return repo.findByRecruiterEmail(auth.getName());
    }

    @PreAuthorize("hasAnyRole('CANDIDATE','RECRUITER')")
    @GetMapping("/public")
    public List<Job> listPublicJobs() {
        return repo.findAll();
    }

    @PreAuthorize("hasAnyRole('RECRUITER','CANDIDATE')")
    @GetMapping("/{id}")
    public Job get(@PathVariable Long id) {
        return repo.findById(id).orElseThrow();
    }

    // ─────────────── NOUVEAU : MODIFIER UNE OFFRE ───────────────
    @PreAuthorize("hasRole('RECRUITER')")
    @PutMapping("/{id}")
    public Job update(@PathVariable Long id, @RequestBody Job updates, Authentication auth) {
        Job job = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offre introuvable"));

        // Sécurité : Vérifier que c'est bien le créateur qui modifie
        if (!job.getRecruiterEmail().equals(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous n'êtes pas le propriétaire de cette offre");
        }

        job.setTitle(updates.getTitle());
        job.setDescription(updates.getDescription());
        // On ne touche pas à createdAt ni recruiterEmail
        return repo.save(job);
    }

    // ─────────────── NOUVEAU : SUPPRIMER UNE OFFRE ───────────────
    @PreAuthorize("hasRole('RECRUITER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        Job job = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offre introuvable"));

        // ✅ Sécurité : vérifier que c’est bien le propriétaire
        if (!job.getRecruiterEmail().equals(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous n'êtes pas le propriétaire de cette offre");
        }

        // ✅ Vérifier s’il existe des candidatures pour cette offre
        boolean hasApplications = applicationRepository.existsByJob_Id(id);
        if (hasApplications) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Impossible de supprimer l'offre : des candidatures existent déjà.");
        }

        // ✅ Pas de candidatures : on peut supprimer
        repo.delete(job);
        return ResponseEntity.noContent().build();
    }


    // ... (Gardez screening et index tels quels) ...
    @PostMapping("/{jobId}/screening")
    @PreAuthorize("hasRole('RECRUITER')")
    public List<RecruiterResultDto> screening(
            @PathVariable Long jobId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("topN") int topN
    ) {
        Job job = repo.findById(jobId).orElseThrow();
        return nlp.screeningRecruiter(job.getDescription(), files, topN);
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @PostMapping("/{id}/index")
    public Job index(@PathVariable Long id) throws Exception {
        Job j = repo.findById(id).orElseThrow();
        float[] vec = nlp.embed(j.getTitle() + " " + j.getDescription());
        j.setEmbeddingJson(om.writeValueAsString(vec));
        return repo.save(j);
    }
}