package com.resume.resume_service.Job;

import java.util.List;

// JobRepository
public interface JobRepository extends org.springframework.data.jpa.repository.JpaRepository<Job, Long> {
    List<Job> findByRecruiterEmail(String recruiterEmail);

}

