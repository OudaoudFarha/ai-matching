package com.resume.resume_service.Services;

import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import io.minio.RemoveObjectArgs;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Profile("!test")
public class MinioService {

    private final MinioClient minioClient;

    @Value("${app.minio.bucket}")
    private String bucket;

    // MinioService.java (upload)
    public String upload(MultipartFile file) throws Exception {
        String safeName = file.getOriginalFilename() == null ? "cv" : file.getOriginalFilename();
        String objectName = java.util.UUID.randomUUID() + "_" + safeName;

        minioClient.putObject(
                PutObjectArgs.builder()
                        .bucket(bucket)
                        .object(objectName)
                        .stream(file.getInputStream(), file.getSize(), -1)
                        .contentType(file.getContentType())
                        .build()
        );

        return objectName;
    }


    public byte[] download(String key) throws Exception {
        try (var stream = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(bucket)
                        .object(key)
                        .build()
        )) {
            return stream.readAllBytes();
        }
    }

    public void delete(String key) throws Exception {
        minioClient.removeObject(
                RemoveObjectArgs.builder().bucket(bucket).object(key).build()
        );
    }

}

