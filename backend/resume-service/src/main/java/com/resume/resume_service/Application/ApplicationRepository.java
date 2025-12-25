package com.resume.resume_service.Application;


import com.resume.resume_service.Job.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    // Pour que le recruteur voie les candidatures d'une offre

    List<Application> findByCandidateId(Long candidateId);

    // Toutes les candidatures d’une offre
    List<Application> findByJob_Id(Long jobId);

    // ⚠️ AJOUTER CECI :
    // Savoir s'il existe au moins une candidature pour une offre
    boolean existsByJob_Id(Long jobId);

    // Vérifier si un candidat a déjà postulé à une offre
    boolean existsByJob_IdAndCandidate_Id(Long jobId, Long candidateId);

    long countByJobIn(List<Job> jobs);

    // ✅ NOUVEAU : Compter pour un job spécifique (pour le graph)
    long countByJob(Job job);
    List<Application> findTop5ByJob_RecruiterEmailOrderByAppliedAtDesc(String recruiterEmail);
    List<Application> findByCandidate_EmailOrderByAppliedAtDesc(String email);
}


