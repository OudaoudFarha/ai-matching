package com.resume.resume_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient nlpWebClient(
            WebClient.Builder builder,
            @Value("${nlp.base-url}") String baseUrl
    ) {
        return builder.baseUrl(baseUrl).build();
    }
}
