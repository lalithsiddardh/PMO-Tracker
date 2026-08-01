package com.fluentgrid.pmo.controller;

import com.fluentgrid.pmo.model.Incident;
import com.fluentgrid.pmo.repository.IncidentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

  private final IncidentRepository repository;

  public IncidentController(IncidentRepository repository) {
    this.repository = repository;
  }

  @GetMapping
  public ResponseEntity<List<Incident>> getAll(@RequestParam(required = false) Long projectId) {
    if (projectId != null) {
      return ResponseEntity.ok(repository.findByProjectId(projectId));
    }
    return ResponseEntity.ok(repository.findAll());
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<Incident> create(@RequestBody Incident incident) {
    return ResponseEntity.ok(repository.save(incident));
  }

  @PatchMapping("/{id}")
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<Incident> update(@PathVariable Long id, @RequestBody Incident updated) {
    Incident incident = repository.findById(id)
      .orElseThrow(() -> new RuntimeException("Incident not found with id: " + id));
    if (updated.getTitle() != null) incident.setTitle(updated.getTitle());
    if (updated.getDescription() != null) incident.setDescription(updated.getDescription());
    if (updated.getSeverity() != null) incident.setSeverity(updated.getSeverity());
    if (updated.getStatus() != null) incident.setStatus(updated.getStatus());
    if (updated.getAssignee() != null) incident.setAssignee(updated.getAssignee());
    if (updated.getReportedDate() != null) incident.setReportedDate(updated.getReportedDate());
    if (updated.getResolutionDate() != null) incident.setResolutionDate(updated.getResolutionDate());
    return ResponseEntity.ok(repository.save(incident));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
    repository.deleteById(id);
    return ResponseEntity.ok(Map.of("message", "Incident deleted successfully"));
  }
}
