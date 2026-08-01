package com.fluentgrid.pmo.service;

import com.fluentgrid.pmo.dto.AuthResponse;
import com.fluentgrid.pmo.dto.LoginRequest;
import com.fluentgrid.pmo.dto.RegisterRequest;
import com.fluentgrid.pmo.model.Notification;
import com.fluentgrid.pmo.model.RegistrationRequest;
import com.fluentgrid.pmo.model.User;
import com.fluentgrid.pmo.repository.NotificationRepository;
import com.fluentgrid.pmo.repository.RegistrationRequestRepository;
import com.fluentgrid.pmo.repository.UserRepository;
import com.fluentgrid.pmo.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {

  private final UserRepository userRepository;
  private final RegistrationRequestRepository registrationRequestRepository;
  private final NotificationRepository notificationRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtUtil jwtUtil;

  public AuthService(UserRepository userRepository,
      RegistrationRequestRepository registrationRequestRepository,
      NotificationRepository notificationRepository,
      PasswordEncoder passwordEncoder,
      AuthenticationManager authenticationManager,
      JwtUtil jwtUtil) {
    this.userRepository = userRepository;
    this.registrationRequestRepository = registrationRequestRepository;
    this.notificationRepository = notificationRepository;
    this.passwordEncoder = passwordEncoder;
    this.authenticationManager = authenticationManager;
    this.jwtUtil = jwtUtil;
  }

  public AuthResponse login(LoginRequest request) {
    try {
      authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
      );
    } catch (Exception e) {
      throw new BadCredentialsException("Invalid email or password");
    }

    User user = userRepository.findByEmail(request.getEmail())
      .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

    if (user.getStatus() != User.Status.ACTIVE) {
      throw new BadCredentialsException("Account is not active. Status: " + user.getStatus());
    }

    String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
    return new AuthResponse(token, user.getEmail(), user.getRole().name(), user.getId(), user.getName());
  }

  public String register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.getEmail())) {
      throw new IllegalArgumentException("Email already registered");
    }

    User.Role role;
    try {
      role = User.Role.valueOf(request.getRole().toUpperCase());
    } catch (IllegalArgumentException e) {
      throw new IllegalArgumentException("Invalid role: " + request.getRole());
    }

    User user = new User();
    user.setEmail(request.getEmail());
    user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    user.setName(request.getName());
    user.setRole(role);
    user.setStatus(User.Status.PENDING_APPROVAL);
    userRepository.save(user);

    RegistrationRequest regRequest = new RegistrationRequest();
    regRequest.setUserId(user.getId());
    regRequest.setStatus("PENDING");
    registrationRequestRepository.save(regRequest);

    List<User> pms = userRepository.findAll().stream()
      .filter(u -> u.getRole() == User.Role.PM || u.getRole() == User.Role.ADMIN || u.getRole() == User.Role.SUPER_ADMIN)
      .filter(u -> u.getStatus() == User.Status.ACTIVE)
      .toList();

    for (User pm : pms) {
      Notification notif = new Notification();
      notif.setUserId(pm.getId());
      notif.setTitle("New Registration Request");
      notif.setMessage("User " + user.getName() + " (" + user.getEmail() + ") has requested to join as " + role);
      notif.setType("REGISTRATION");
      notificationRepository.save(notif);
    }

    return "Registration successful. Please wait for approval.";
  }
}
