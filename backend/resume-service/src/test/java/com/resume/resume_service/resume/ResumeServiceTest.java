package com.resume.resume_service.resume;

import com.resume.resume_service.Job.JobMatchRepository;
import com.resume.resume_service.Services.MinioService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResumeServiceTest {

    @Mock private ResumeRepository resumeRepository;
    @Mock private JobMatchRepository jobMatchRepository;
    @Mock private MinioService minioService;

    @InjectMocks
    private ResumeService resumeService;

    @Test
    void saveNewResume_should_build_and_save_resume() {
        // given
        String email = "test@mail.com";
        String filename = "cv.pdf";
        String minioKey = "minio/cv.pdf";

        // on simule le retour du repository (souvent save retourne l'objet persisté)
        when(resumeRepository.save(any(Resume.class))).thenAnswer(inv -> inv.getArgument(0));

        // when
        Resume saved = resumeService.saveNewResume(email, filename, minioKey);

        // then
        assertNotNull(saved);
        assertEquals(email, saved.getCandidateEmail());
        assertEquals(filename, saved.getFilename());
        assertEquals(minioKey, saved.getMinioKey());

        ArgumentCaptor<Resume> captor = ArgumentCaptor.forClass(Resume.class);
        verify(resumeRepository).save(captor.capture());

        Resume toSave = captor.getValue();
        assertEquals(email, toSave.getCandidateEmail());
        assertEquals(filename, toSave.getFilename());
        assertEquals(minioKey, toSave.getMinioKey());

        verifyNoInteractions(jobMatchRepository);
        verifyNoInteractions(minioService);
    }
}
