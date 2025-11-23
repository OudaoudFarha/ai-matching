package com.resume.resume_service.nlp;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Component
public class NlpClient {
    private final WebClient http;

    public NlpClient(@Value("${app.nlp.baseUrl}") String baseUrl) {
        this.http = WebClient.builder().baseUrl(baseUrl).build();
    }

    public float[] embed(String text) {
        Map<String, Object> resp = http.get()
                .uri(uri -> uri.path("/embed").queryParam("text", text).build())
                .retrieve()
                .bodyToMono(Map.class)
                .block();
        var list = (java.util.List<Number>) resp.get("embedding");
        float[] vec = new float[list.size()];
        for (int i = 0; i < vec.length; i++) vec[i] = list.get(i).floatValue();
        return vec;
    }
}

