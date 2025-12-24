package com.resume.resume_service.nlp.dto;

// com.resume.resume_service.nlp.dto

public record RankedJobDto(
        String job_id,
        String titre_offre,
        double score_pertinence,
        String details_score
) {}





