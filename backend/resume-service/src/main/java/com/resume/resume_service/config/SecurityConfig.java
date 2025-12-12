package com.resume.resume_service.config;

import com.resume.resume_service.auth.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;

@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // IMPORTANT : activer la gestion CORS de Spring Security
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // src/main/java/com/resume/resume_service/config/SecurityConfig.java
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**", "/v3/api-docs/**", "/swagger-ui/**").permitAll()

                        // CANDIDATE : upload CV & analyse
                        .requestMatchers("/api/resumes/**").hasRole("CANDIDATE")


                        // RECRUITER : gestion des offres, matches, indexation
                        .requestMatchers(HttpMethod.POST, "/api/jobs/**").hasRole("RECRUITER")
                        .requestMatchers("/api/jobs/mine", "/api/jobs/*/index", "/api/jobs/*/matches").hasRole("RECRUITER")

                        // CANDIDATE & RECRUITER : lecture des offres
                        .requestMatchers(HttpMethod.GET, "/api/jobs/public", "/api/jobs/*").hasAnyRole("CANDIDATE","RECRUITER")
                        .requestMatchers(HttpMethod.POST, "/api/jobs/*/screening").hasRole("RECRUITER")

                        // matches « classiques » si tu les utilises des deux côtés
                        .requestMatchers("/api/match/**").hasAnyRole("CANDIDATE","RECRUITER")

                        .anyRequest().authenticated()
                )

                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
