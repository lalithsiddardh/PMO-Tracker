package com.fluentgrid.pmo.controller;

import com.fluentgrid.pmo.dto.AuthResponse;
import com.fluentgrid.pmo.dto.LoginRequest;
import com.fluentgrid.pmo.dto.RegisterRequest;
import com.fluentgrid.pmo.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
    AuthResponse response = authService.login(request);
    return ResponseEntity.ok(response);
  }

  @PostMapping("/register")
  public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
    String message = authService.register(request);
    return ResponseEntity.ok(Map.of("message", message));
  }
}
