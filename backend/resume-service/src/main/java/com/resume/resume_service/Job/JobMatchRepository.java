// JobMatchRepository.java
package com.resume.resume_service.Job;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobMatchRepository extends JpaRepository<JobMatch, Long> {

    List<JobMatch> findByResumeIdOrderByScoreDesc(Long resumeId);

    void deleteByResumeId(Long resumeId);
}
