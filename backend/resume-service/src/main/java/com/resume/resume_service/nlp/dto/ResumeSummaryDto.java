package com.resume.resume_service.nlp.dto;


import java.time.Instant;

public record ResumeSummaryDto(
        Long id,
        String filename,
        Instant createdAt
) {}

