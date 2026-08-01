package com.fluentgrid.pmo.controller;

import com.fluentgrid.pmo.model.ComplianceItem;
import com.fluentgrid.pmo.repository.ComplianceItemRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/compliance")
public class ComplianceController {

  private final ComplianceItemRepository repository;

  public ComplianceController(ComplianceItemRepository repository) {
    this.repository = repository;
  }

  @GetMapping
  public ResponseEntity<List<ComplianceItem>> getAll(@RequestParam(required = false) Long projectId) {
    if (projectId != null) {
      return ResponseEntity.ok(repository.findByProjectId(projectId));
    }
    return ResponseEntity.ok(repository.findAll());
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<ComplianceItem> create(@RequestBody ComplianceItem item) {
    return ResponseEntity.ok(repository.save(item));
  }

  @PatchMapping("/{id}")
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<ComplianceItem> update(@PathVariable Long id, @RequestBody ComplianceItem updated) {
    ComplianceItem item = repository.findById(id)
      .orElseThrow(() -> new RuntimeException("ComplianceItem not found with id: " + id));
    if (updated.getTitle() != null) item.setTitle(updated.getTitle());
    if (updated.getCategory() != null) item.setCategory(updated.getCategory());
    if (updated.getStatus() != null) item.setStatus(updated.getStatus());
    if (updated.getOwner() != null) item.setOwner(updated.getOwner());
    if (updated.getDueDate() != null) item.setDueDate(updated.getDueDate());
    if (updated.getCompletedDate() != null) item.setCompletedDate(updated.getCompletedDate());
    return ResponseEntity.ok(repository.save(item));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
    repository.deleteById(id);
    return ResponseEntity.ok(Map.of("message", "Compliance item deleted successfully"));
  }
}
