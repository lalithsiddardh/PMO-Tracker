package com.fluentgrid.pmo.controller;

import com.fluentgrid.pmo.model.RegistrationRequest;
import com.fluentgrid.pmo.model.User;
import com.fluentgrid.pmo.repository.UserRepository;
import com.fluentgrid.pmo.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class UserController {

  private final UserService userService;
  private final UserRepository userRepository;

  public UserController(UserService userService, UserRepository userRepository) {
    this.userService = userService;
    this.userRepository = userRepository;
  }

  @GetMapping("/admin/users")
  @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<List<User>> getAllUsers() {
    return ResponseEntity.ok(userService.getAllUsers());
  }

  @GetMapping("/users")
  public ResponseEntity<List<User>> getActiveUsers() {
    return ResponseEntity.ok(userRepository.findAll().stream()
        .filter(u -> u.getStatus() == User.Status.ACTIVE)
        .collect(java.util.stream.Collectors.toList()));
  }

  @PostMapping("/admin/assign-pm")
  @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<Map<String, String>> assignPm(@RequestBody Map<String, Long> body) {
    String message = userService.assignPm(body.get("userId"), body.get("pmId"));
    return ResponseEntity.ok(Map.of("message", message));
  }

  @PostMapping("/admin/assign-project")
  @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<Map<String, String>> assignProjectToPm(@RequestBody Map<String, Long> body) {
    String message = userService.assignProjectToPm(
      body.get("projectId"), body.get("pmId"), body.get("adminId"));
    return ResponseEntity.ok(Map.of("message", message));
  }

  @PostMapping("/admin/assign-user-project")
  @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<Map<String, String>> assignUserToProject(@RequestBody Map<String, Long> body) {
    String message = userService.assignUserToProject(
      body.get("userId"), body.get("projectId"), body.get("assignedBy"));
    return ResponseEntity.ok(Map.of("message", message));
  }

  @DeleteMapping("/admin/users/{id}")
  @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
    userService.deleteUser(id);
    return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
  }

  @GetMapping("/pm/pending-requests")
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<List<Map<String, Object>>> getPendingRegistrations() {
    List<RegistrationRequest> requests = userService.getPendingRegistrations();
    List<Map<String, Object>> result = requests.stream().map(req -> {
      Map<String, Object> map = new HashMap<>();
      map.put("id", req.getId());
      map.put("userId", req.getUserId());
      map.put("status", req.getStatus());
      map.put("reviewedBy", req.getReviewedBy());
      map.put("reviewNotes", req.getReviewNotes());
      map.put("createdAt", req.getCreatedAt());
      map.put("updatedAt", req.getUpdatedAt());
      userRepository.findById(req.getUserId()).ifPresent(u -> {
        map.put("email", u.getEmail());
        map.put("name", u.getName());
        map.put("role", u.getRole().name());
      });
      return map;
    }).toList();
    return ResponseEntity.ok(result);
  }

  @PatchMapping("/pm/approve-request/{id}")
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<Map<String, String>> approveRequest(
      @PathVariable Long id, Authentication authentication) {
    Long reviewerId = (Long) authentication.getCredentials();
    String message = userService.approveRegistration(id, reviewerId);
    return ResponseEntity.ok(Map.of("message", message));
  }

  @PatchMapping("/pm/reject-request/{id}")
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<Map<String, String>> rejectRequest(
      @PathVariable Long id,
      @RequestBody(required = false) Map<String, String> body,
      Authentication authentication) {
    Long reviewerId = (Long) authentication.getCredentials();
    String notes = body != null ? body.get("notes") : null;
    String message = userService.rejectRegistration(id, reviewerId, notes);
    return ResponseEntity.ok(Map.of("message", message));
  }
}
