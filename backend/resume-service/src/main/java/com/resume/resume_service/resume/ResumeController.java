package com.resume.resume_service.resume;

import com.resume.resume_service.nlp.NlpClient;
import com.resume.resume_service.parser.PdfParserService;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeRepository resumeRepository;
    private final PdfParserService pdfParserService;
    private final NlpClient nlpClient;
    private final MinioClient minioClient;

    @Value("${app.minio.bucket}")
    private String bucket;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Resume upload(@RequestParam("file") MultipartFile file) throws Exception {

        // 1) upload dans MinIO
        String objectName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        try (InputStream is = file.getInputStream()) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .contentType(file.getContentType())
                            .stream(is, file.getSize(), -1)
                            .build()
            );
        }

        // 2) extraire le texte du PDF
        String text;
        try (InputStream is = file.getInputStream()) {
            text = pdfParserService.extractText(is);
        }

        // 3) appeler le service NLP
        float[] embedding = nlpClient.embed(text);

        // 4) sauvegarder en base
        Resume resume = Resume.builder()
                .filename(file.getOriginalFilename())
                .objectName(objectName)
                .text(text)
                .embeddingJson(java.util.Arrays.toString(embedding))
                .build();

        return resumeRepository.save(resume);
    }
}
