package com.fluentgrid.pmo.controller;

import com.fluentgrid.pmo.model.DeleteProjectRequest;
import com.fluentgrid.pmo.model.Project;
import com.fluentgrid.pmo.model.ProjectAssignment;
import com.fluentgrid.pmo.model.User;
import com.fluentgrid.pmo.model.UserProjectAssignment;
import com.fluentgrid.pmo.repository.ProjectAssignmentRepository;
import com.fluentgrid.pmo.repository.UserProjectAssignmentRepository;
import com.fluentgrid.pmo.repository.UserRepository;
import com.fluentgrid.pmo.service.ProjectService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ProjectController {

  private final ProjectService projectService;
  private final UserRepository userRepository;
  private final ProjectAssignmentRepository projectAssignmentRepository;
  private final UserProjectAssignmentRepository userProjectAssignmentRepository;

  public ProjectController(ProjectService projectService, UserRepository userRepository,
      ProjectAssignmentRepository projectAssignmentRepository,
      UserProjectAssignmentRepository userProjectAssignmentRepository) {
    this.projectService = projectService;
    this.userRepository = userRepository;
    this.projectAssignmentRepository = projectAssignmentRepository;
    this.userProjectAssignmentRepository = userProjectAssignmentRepository;
  }

  @GetMapping("/projects")
  public ResponseEntity<List<Project>> getAllProjects(Authentication auth) {
    String email = (String) auth.getPrincipal();
    User user = userRepository.findByEmail(email).orElseThrow();
    return ResponseEntity.ok(projectService.getProjectsForUser(user.getId(), user.getRole().name()));
  }

  @PostMapping("/projects")
  @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<Project> createProject(@RequestBody Project project) {
    return ResponseEntity.ok(projectService.createProject(project));
  }

  @GetMapping("/projects/{id}")
  public ResponseEntity<Project> getProjectById(@PathVariable Long id) {
    return ResponseEntity.ok(projectService.getProjectById(id));
  }

  @PatchMapping("/projects/{id}")
  @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<Project> updateProject(@PathVariable Long id, @RequestBody Project project) {
    return ResponseEntity.ok(projectService.updateProject(id, project));
  }

  @DeleteMapping("/projects/{id}")
  @PreAuthorize("hasRole('SUPER_ADMIN')")
  public ResponseEntity<Map<String, String>> deleteProject(@PathVariable Long id) {
    projectService.deleteProject(id);
    return ResponseEntity.ok(Map.of("message", "Project deleted successfully"));
  }

  @PostMapping("/projects/{id}/request-delete")
  @PreAuthorize("hasRole('PM')")
  public ResponseEntity<?> requestDeleteProject(@PathVariable Long id, Authentication auth) {
    Long userId = (Long) auth.getCredentials();
    try {
      DeleteProjectRequest request = projectService.requestDeleteProject(id, userId);
      return ResponseEntity.ok(Map.of(
        "message", "Delete request submitted for admin approval",
        "requestId", request.getId(),
        "status", request.getStatus()
      ));
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  @GetMapping("/projects/{id}/delete-request-status")
  public ResponseEntity<?> getDeleteRequestStatus(@PathVariable Long id) {
    DeleteProjectRequest request = projectService.getDeleteRequestForProject(id);
    if (request == null) {
      return ResponseEntity.ok(Map.of("hasPendingRequest", false));
    }
    return ResponseEntity.ok(Map.of(
      "hasPendingRequest", true,
      "requestId", request.getId(),
      "status", request.getStatus(),
      "requestedByName", request.getRequestedByName(),
      "createdAt", request.getCreatedAt() != null ? request.getCreatedAt().toString() : null
    ));
  }

  @GetMapping("/projects/delete-requests")
  @PreAuthorize("hasRole('SUPER_ADMIN')")
  public ResponseEntity<List<DeleteProjectRequest>> getDeleteRequests(
      @RequestParam(required = false, defaultValue = "PENDING") String status) {
    return ResponseEntity.ok(projectService.getDeleteRequests(status));
  }

  @PatchMapping("/projects/delete-requests/{id}/approve")
  @PreAuthorize("hasRole('SUPER_ADMIN')")
  public ResponseEntity<Map<String, String>> approveDeleteRequest(
      @PathVariable Long id, Authentication auth) {
    Long reviewerId = (Long) auth.getCredentials();
    projectService.approveDeleteRequest(id, reviewerId);
    return ResponseEntity.ok(Map.of("message", "Delete request approved and project deleted"));
  }

  @PatchMapping("/projects/delete-requests/{id}/reject")
  @PreAuthorize("hasRole('SUPER_ADMIN')")
  public ResponseEntity<Map<String, String>> rejectDeleteRequest(
      @PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
    Long reviewerId = (Long) auth.getCredentials();
    String notes = body.getOrDefault("notes", null);
    projectService.rejectDeleteRequest(id, reviewerId, notes);
    return ResponseEntity.ok(Map.of("message", "Delete request rejected"));
  }

  @GetMapping("/projects/{id}/assignments")
  public ResponseEntity<List<UserProjectAssignment>> getProjectUserAssignments(@PathVariable Long id) {
    return ResponseEntity.ok(userProjectAssignmentRepository.findByProjectId(id));
  }

  @GetMapping("/projects/{id}/pm-assignments")
  public ResponseEntity<List<ProjectAssignment>> getProjectPmAssignments(@PathVariable Long id) {
    return ResponseEntity.ok(projectAssignmentRepository.findByProjectId(id));
  }

  @PutMapping("/projects/{projectId}/change-pm")
  @PreAuthorize("hasRole('SUPER_ADMIN')")
  public ResponseEntity<?> changePm(@PathVariable Long projectId, @RequestBody Map<String, Long> body, Authentication auth) {
    Long newPmId = body.get("pmId");
    if (newPmId == null) {
      return ResponseEntity.badRequest().body(Map.of("error", "pmId is required"));
    }
    Long changedBy = (Long) auth.getCredentials();
    try {
      Project project = projectService.changePm(projectId, newPmId, changedBy);
      return ResponseEntity.ok(Map.of("message", "PM changed successfully", "project", project));
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  @GetMapping("/projects/check-name")
  public ResponseEntity<Map<String, Boolean>> checkDuplicateName(
      @RequestParam String name,
      @RequestParam(required = false) String bu) {
    boolean duplicate = bu != null && !bu.isBlank()
      ? projectService.isDuplicateNameAndBu(name, bu)
      : projectService.isDuplicateName(name);
    return ResponseEntity.ok(Map.of("duplicate", duplicate));
  }
}
