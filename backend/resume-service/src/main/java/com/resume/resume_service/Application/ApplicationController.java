package com.resume.resume_service.Application;

import com.resume.resume_service.Job.Job;
import com.resume.resume_service.Job.JobRepository;
import com.resume.resume_service.Services.MinioService;
import com.resume.resume_service.auth.User;
import com.resume.resume_service.auth.UserRepository;
import com.resume.resume_service.nlp.NlpClient;
import com.resume.resume_service.nlp.dto.RecommendationDto;
import com.resume.resume_service.resume.ResumeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.resume.resume_service.resume.Resume;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ApplicationController {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final MinioService minioService;
    private final ResumeRepository resumeRepository;
    private final NlpClient nlpClient;
    // 1) Candidat postule à une offre
    @PostMapping("/candidate/jobs/{jobId}/apply")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<?> applyToJob(
            @PathVariable Long jobId,
            @RequestPart(value = "cv", required = false) MultipartFile cvFile,
            @RequestParam(name = "useExisting", defaultValue = "false") boolean useExisting,
            Authentication authentication
    ) throws Exception {

        // 🔹 Candidat connecté
        User candidate = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // 🔹 Offre
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));

        // 🔹 Déjà postulé ?
        boolean alreadyApplied =
                applicationRepository.existsByJob_IdAndCandidate_Id(jobId, candidate.getId());

        if (alreadyApplied) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("Vous avez déjà postulé à cette offre.");
        }

        // ===========================
        //  CHOIX DU CV À UTILISER
        // ===========================
        String objectKey;
        String originalName;

        if (useExisting) {
            // ✅ Utiliser le CV déjà uploadé (Resume)
            Resume resume = resumeRepository
                    .findTopByCandidateEmailOrderByCreatedAtDesc(candidate.getEmail())
                    .orElseThrow(() -> new RuntimeException(
                            "Aucun CV existant trouvé. Veuillez d'abord uploader un CV."));

            objectKey = resume.getMinioKey();
            originalName = resume.getFilename();

        } else {
            // ✅ Uploader un NOUVEAU CV
            if (cvFile == null || cvFile.isEmpty()) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body("Aucun fichier CV envoyé.");
            }

            objectKey = minioService.upload(cvFile);
            originalName = cvFile.getOriginalFilename();
        }

        // 🔹 Créer la candidature
        Application app = new Application();
        app.setJob(job);
        app.setCandidate(candidate);
        app.setCvPath(objectKey);
        app.setCvOriginalName(originalName);
        app.setStatus(ApplicationStatus.APPLIED);
        app.setAppliedAt(Instant.now());

        applicationRepository.save(app);

        return ResponseEntity.ok(ApplicationDto.fromEntity(app));
    }


    // 2) Recruteur voit les candidatures pour une offre
    // 2) Recruteur voit les candidatures pour une offre, triées par score de matching
    @GetMapping("/recruiter/jobs/{jobId}/applications")
    @PreAuthorize("hasRole('RECRUITER')")
    public List<ApplicationDto> listApplicationsForJob(
            @PathVariable Long jobId,
            Authentication authentication
    ) throws Exception {

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));

        // (optionnel) vérifier que l’offre appartient bien au recruteur connecté
        // if (!job.getRecruiterEmail().equals(authentication.getName())) { ... }

        List<Application> apps = applicationRepository.findByJob_Id(jobId);

        if (apps.isEmpty()) {
            return List.of();
        }

        // 1️⃣ Préparer les fichiers pour FastAPI
        Map<String, byte[]> files = new HashMap<>();
        Map<String, Application> filenameToApp = new HashMap<>();

        for (Application app : apps) {
            // Télécharger le CV dans MinIO
            byte[] bytes = minioService.download(app.getCvPath());

            // Nom unique utilisé comme "filename" côté FastAPI
            String safeName = app.getCvOriginalName() != null ? app.getCvOriginalName() : "cv.pdf";
            String partName = "app-" + app.getId() + "-" + safeName;  // unique

            files.put(partName, bytes);
            filenameToApp.put(partName, app);
        }

        // 2️⃣ Appel FastAPI : scoring des CV pour cette offre
        // 2️⃣ Appel FastAPI : scoring des CV pour cette offre
        Map<String, Double> scoreByFilename = new HashMap<>();

        try {
            var results = nlpClient.analyzeRecruiter(
                    job.getDescription(),
                    files
            );

            for (var r : results) {
                scoreByFilename.put(r.filename(), r.score());
            }
        } catch (Exception e) {
            e.printStackTrace(); // log
            // On continue sans score (le front verra "Non calculé")
        }




        // 4️⃣ Construire les DTO avec score
        List<ApplicationDto> out = new java.util.ArrayList<>();

        for (Map.Entry<String, Application> entry : filenameToApp.entrySet()) {
            String partName = entry.getKey();
            Application app = entry.getValue();
            Double score = scoreByFilename.get(partName); // peut être null si pas revenu

            out.add(ApplicationDto.fromEntity(app, score));
        }

        // 5️⃣ Trier par score décroissant (nulls en bas)
        out.sort((a, b) -> {
            double s1 = b.getScore() != null ? b.getScore() : -1.0;
            double s2 = a.getScore() != null ? a.getScore() : -1.0;
            return Double.compare(s1, s2);
        });

        return out;
    }

    // 3) Recruteur télécharge le CV
    @GetMapping("/applications/{id}/cv")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<byte[]> downloadCv(@PathVariable Long id) throws Exception {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidature non trouvée"));

        byte[] data = minioService.download(app.getCvPath());

        String filename = app.getCvOriginalName() != null ? app.getCvOriginalName() : "cv.pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename.replace("\"", "") + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    // Dans ApplicationController.java
    @GetMapping("/candidate/jobs/{jobId}/recommendations")
    @PreAuthorize("hasRole('CANDIDATE')")
    public RecommendationDto getRecommendation(
            @PathVariable Long jobId,
            Authentication auth
    ) throws Exception {
        User candidate = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Dernier CV uploadé par ce candidat
        Resume resume = resumeRepository
                .findTopByCandidateEmailOrderByCreatedAtDesc(candidate.getEmail())
                .orElseThrow(() -> new RuntimeException(
                        "Aucun CV existant trouvé. Veuillez d'abord uploader un CV."
                ));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));

        byte[] cvBytes = minioService.download(resume.getMinioKey());

        return nlpClient.recommendForCandidate(
                job.getDescription(),
                cvBytes,
                resume.getFilename()
        );
    }

    // ✅ Vérifier si le candidat connecté a déjà postulé à cette offre
    @GetMapping("/candidate/jobs/{jobId}/has-applied")
    @PreAuthorize("hasRole('CANDIDATE')")
    public Map<String, Boolean> hasApplied(
            @PathVariable Long jobId,
            Authentication auth
    ) {
        var candidate = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        boolean exists = applicationRepository
                .existsByJob_IdAndCandidate_Id(jobId, candidate.getId());

        Map<String, Boolean> result = new HashMap<>();
        result.put("hasApplied", exists);
        return result;
    }

    // 4) ✅ NOUVEAU : Candidat consulte ses propres candidatures
    @GetMapping("/candidate/my-applications")
    @PreAuthorize("hasRole('CANDIDATE')")
    public List<ApplicationDto> getMyApplications(Authentication authentication) {

        String email = authentication.getName();

        // Récupère via le Repository (Assurez-vous d'avoir ajouté la méthode findByCandidate_Email... dans ApplicationRepository)
        List<Application> myApps = applicationRepository.findByCandidate_EmailOrderByAppliedAtDesc(email);

        // Transforme en DTO
        return myApps.stream()
                .map(app -> ApplicationDto.fromEntity(app, app.getMatchScore()))
                .collect(Collectors.toList());
    }
}
