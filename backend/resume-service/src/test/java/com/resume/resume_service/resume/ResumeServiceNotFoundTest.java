package com.resume.resume_service.resume;

import com.resume.resume_service.Job.JobMatchRepository;
import com.resume.resume_service.Services.MinioService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResumeServiceNotFoundTest {

    @Mock private ResumeRepository resumeRepository;
    @Mock private JobMatchRepository jobMatchRepository;
    @Mock private MinioService minioService;

    @InjectMocks
    private ResumeService resumeService;

    @Test
    void deleteMyResume_should_throw_when_no_resume_for_email() {
        when(resumeRepository.findTopByCandidateEmailOrderByCreatedAtDesc("x@mail.com"))
                .thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> resumeService.deleteMyResume("x@mail.com"));

        verify(resumeRepository).findTopByCandidateEmailOrderByCreatedAtDesc("x@mail.com");
        verifyNoInteractions(jobMatchRepository);
        verifyNoInteractions(minioService);
    }
}
