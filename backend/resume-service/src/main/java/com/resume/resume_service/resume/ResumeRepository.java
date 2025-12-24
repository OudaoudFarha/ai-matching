// ResumeRepository.java
package com.resume.resume_service.resume;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ResumeRepository extends JpaRepository<Resume, Long> {

    Optional<Resume> findTopByCandidateEmailOrderByCreatedAtDesc(String candidateEmail);
    @Modifying
    @Query("DELETE FROM Resume r WHERE r.candidateEmail = :email")
    void deleteByCandidateEmail(@Param("email") String email);
}



