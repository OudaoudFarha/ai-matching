package com.resume.resume_service.nlp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RecommendationDto {
    private double score;
    private List<String> missingSkills;
    private List<String> suggestedKeywords;
    private String experienceAdvice;
}
