package com.resume.resume_service.nlp.dto;

import java.util.List;

public record CandidateResponseDto(
        String cv_competences,
        int experience_estimee,
        List<RankedJobDto> offres_classees
) {}
