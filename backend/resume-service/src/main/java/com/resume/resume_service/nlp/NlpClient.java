package com.resume.resume_service.nlp;

import com.resume.resume_service.nlp.dto.CandidateResponseDto;
import com.resume.resume_service.nlp.dto.RecruiterResultDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NlpClient {

    private final WebClient nlpWebClient;   // bean défini ailleurs avec baseUrl FastAPI

    public CandidateResponseDto analyzeCandidate(byte[] cvBytes, String filename, String jobsJson) {
        MultipartBodyBuilder mb = new MultipartBodyBuilder();
        mb.part("cv_file", cvBytes)
                .filename(filename)
                .contentType(MediaType.APPLICATION_PDF);
        mb.part("jobs_json", jobsJson);

        return nlpWebClient.post()
                .uri("/analyze-candidate")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(mb.build()))
                .retrieve()
                .bodyToMono(CandidateResponseDto.class)
                .block();
    }

    public List<RecruiterResultDto> analyzeRecruiter(
            String jobDescription,
            Map<String, byte[]> files
    ) {
        MultipartBodyBuilder mb = new MultipartBodyBuilder();

        // ⚠️ Utiliser exactement les mêmes noms que dans FastAPI
        mb.part("jd_text", jobDescription);
        mb.part("top_n", String.valueOf(files.size()));

        files.forEach((name, bytes) -> {
            mb.part("files", bytes)
                    .filename(name)
                    .contentType(MediaType.APPLICATION_OCTET_STREAM);
        });

        return nlpWebClient.post()
                .uri("/analyze-recruiter")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(mb.build()))
                .retrieve()
                .bodyToFlux(RecruiterResultDto.class)
                .collectList()
                .block();
    }


    // utilisé pour l’indexation Qdrant
    public float[] embed(String text) throws Exception {
        // à adapter : appel à FastAPI ou autre service d'embedding
        throw new UnsupportedOperationException("TODO: implémenter embed()");
    }


    public List<RecruiterResultDto> screeningRecruiter(
            String jobDescription,
            List<MultipartFile> files,
            int topN
    ) {
        MultipartBodyBuilder mb = new MultipartBodyBuilder();
        mb.part("jd_text", jobDescription);
        mb.part("top_n", String.valueOf(topN));

        for (MultipartFile f : files) {
            try {
                mb.part("files", f.getBytes())
                        .filename(f.getOriginalFilename())
                        .contentType(MediaType.APPLICATION_OCTET_STREAM);
            } catch (Exception e) {
                throw new RuntimeException("Erreur lecture fichier " + f.getOriginalFilename(), e);
            }
        }

        return nlpWebClient.post()
                .uri("/analyze-recruiter")   // endpoint FastAPI
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(mb.build()))
                .retrieve()
                .bodyToFlux(RecruiterResultDto.class)
                .collectList()
                .block();
    }

}
