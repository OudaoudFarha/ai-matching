package com.resume.resume_service.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173") // Vérifie que c'est le bon port de ton React
public class UserController {

    private final UserRepository userRepository;

    // 1. Récupérer l'utilisateur connecté
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser() {
        // On récupère l'email depuis le token JWT (SecurityContext)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = authentication.getName();

        return userRepository.findByEmail(currentEmail)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 2. Mettre à jour l'email
    @PutMapping("/me")
    public ResponseEntity<User> updateProfile(@RequestBody UserUpdateDto updateDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = authentication.getName();

        return userRepository.findByEmail(currentEmail)
                .map(user -> {
                    if (updateDto.getEmail() != null && !updateDto.getEmail().isEmpty()) {
                        user.setEmail(updateDto.getEmail());
                    }
                    return ResponseEntity.ok(userRepository.save(user));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}