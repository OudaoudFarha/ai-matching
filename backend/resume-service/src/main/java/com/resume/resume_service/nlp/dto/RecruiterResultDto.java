package com.resume.resume_service.nlp.dto;
public record RecruiterResultDto(
        String filename,
        double score,
        String competences_detectees
) {}