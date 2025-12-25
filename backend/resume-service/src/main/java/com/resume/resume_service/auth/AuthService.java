package com.resume.resume_service.auth;

// package com.resume.resume_service.auth;

import com.resume.resume_service.auth.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authManager;
    private final JwtService jwtService;
    private final JpaUserDetailsService uds;

    public AuthResponse register(RegisterRequest req) {
        if (userRepo.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email déjà utilisé");
        }
        User u = User.builder()
                .email(req.getEmail())
                .password(encoder.encode(req.getPassword()))
                .role(req.getRole())
                .build();
        userRepo.save(u);
        UserDetails ud = new SecurityUser(u);
        String token = jwtService.generate(ud, u.getRole());
        return AuthResponse.builder()
                .token(token)
                .email(u.getEmail())
                .role(u.getRole())
                .build();
    }

    public AuthResponse login(LoginRequest req) {

        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
        );

        SecurityUser su = (SecurityUser) uds.loadUserByUsername(req.getEmail());
        User user = su.getUser();

        String token = jwtService.generate(su, user.getRole());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

}

