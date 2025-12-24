package com.resume.resume_service.Application;


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


}


