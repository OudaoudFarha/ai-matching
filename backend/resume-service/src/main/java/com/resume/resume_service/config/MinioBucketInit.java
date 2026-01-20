package com.resume.resume_service.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Profile("!test")
public class MinioBucketInit implements CommandLineRunner {

    private final MinioClient minioClient;

    @Value("${app.minio.bucket}")
    private String bucket;

    @Override
    public void run(String... args) throws Exception {
        boolean exists = minioClient.bucketExists(
                BucketExistsArgs.builder().bucket(bucket).build()
        );
        if (!exists) {
            minioClient.makeBucket(
                    MakeBucketArgs.builder().bucket(bucket).build()
            );
            System.out.println("✅ Bucket créé : " + bucket);
        } else {
            System.out.println("✅ Bucket déjà présent : " + bucket);
        }
    }
}

