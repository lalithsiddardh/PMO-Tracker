package com.fluentgrid.pmo.controller;

import com.fluentgrid.pmo.model.SecurityTask;
import com.fluentgrid.pmo.repository.SecurityTaskRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/security/tasks")
public class SecurityTaskController {

  private final SecurityTaskRepository repository;

  public SecurityTaskController(SecurityTaskRepository repository) {
    this.repository = repository;
  }

  @GetMapping
  public ResponseEntity<List<SecurityTask>> getAll(@RequestParam(required = false) Long projectId) {
    if (projectId != null) {
      return ResponseEntity.ok(repository.findByProjectId(projectId));
    }
    return ResponseEntity.ok(repository.findAll());
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<SecurityTask> create(@RequestBody SecurityTask task) {
    return ResponseEntity.ok(repository.save(task));
  }

  @PatchMapping("/{id}")
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<SecurityTask> update(@PathVariable Long id, @RequestBody SecurityTask updated) {
    SecurityTask task = repository.findById(id)
      .orElseThrow(() -> new RuntimeException("SecurityTask not found with id: " + id));
    if (updated.getTitle() != null) task.setTitle(updated.getTitle());
    if (updated.getCategory() != null) task.setCategory(updated.getCategory());
    if (updated.getStatus() != null) task.setStatus(updated.getStatus());
    if (updated.getSeverity() != null) task.setSeverity(updated.getSeverity());
    if (updated.getAssignee() != null) task.setAssignee(updated.getAssignee());
    if (updated.getStartDate() != null) task.setStartDate(updated.getStartDate());
    if (updated.getDueDate() != null) task.setDueDate(updated.getDueDate());
    if (updated.getCompletedDate() != null) task.setCompletedDate(updated.getCompletedDate());
    if (updated.getNotes() != null) task.setNotes(updated.getNotes());
    return ResponseEntity.ok(repository.save(task));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
    repository.deleteById(id);
    return ResponseEntity.ok(Map.of("message", "Security task deleted successfully"));
  }
}
