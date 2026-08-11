package com.voyagent.backend.controller;

import com.voyagent.backend.dto.AuthResponse;
import com.voyagent.backend.dto.LoginRequest;
import com.voyagent.backend.dto.MessageResponse;
import com.voyagent.backend.dto.SignupRequest;
import com.voyagent.backend.dto.UserDto;
import com.voyagent.backend.model.User;
import com.voyagent.backend.security.AuthInterceptor;
import com.voyagent.backend.security.JwtService;
import com.voyagent.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        User user = authService.signup(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, jwtService.authCookie(jwtService.createToken(user.getId())).toString())
                .body(new AuthResponse(true, "User registered successfully", UserDto.from(user)));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        User user = authService.login(request);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtService.authCookie(jwtService.createToken(user.getId())).toString())
                .body(new AuthResponse(true, "Login successful", UserDto.from(user)));
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout() {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtService.expiredCookie().toString())
                .body(new MessageResponse(true, "Logged out successfully"));
    }

    @GetMapping("/me")
    public AuthResponse me(@RequestAttribute(AuthInterceptor.CURRENT_USER) User user) {
        return new AuthResponse(true, null, UserDto.from(user));
    }
}
