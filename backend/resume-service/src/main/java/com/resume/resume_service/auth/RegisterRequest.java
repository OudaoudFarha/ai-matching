package com.resume.resume_service.auth;

// package com.resume.resume_service.auth.dto;

import com.resume.resume_service.auth.Role;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RegisterRequest {
    private String email;
    private String password;
    private Role role; // CANDIDATE ou RECRUITER
}



