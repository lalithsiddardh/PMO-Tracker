package com.fluentgrid.pmo.controller;

import com.fluentgrid.pmo.model.Deliverable;
import com.fluentgrid.pmo.service.DeliverableService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class DeliverableController {

  private final DeliverableService deliverableService;

  public DeliverableController(DeliverableService deliverableService) {
    this.deliverableService = deliverableService;
  }

  @GetMapping("/project-deliverables")
  public ResponseEntity<List<Map<String, Object>>> getAllDeliverables() {
    return ResponseEntity.ok(deliverableService.getAllDeliverables());
  }

  @GetMapping("/projects/{projectId}/deliverables")
  public ResponseEntity<List<Map<String, Object>>> getProjectDeliverables(@PathVariable Long projectId) {
    return ResponseEntity.ok(deliverableService.getDeliverablesByProject(projectId));
  }

  @PostMapping("/project-deliverables")
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<Deliverable> createDeliverable(@RequestBody Deliverable deliverable) {
    return ResponseEntity.ok(deliverableService.createDeliverable(deliverable));
  }

  @PatchMapping("/project-deliverables/{id}")
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<Deliverable> updateDeliverable(@PathVariable Long id, @RequestBody Deliverable deliverable) {
    return ResponseEntity.ok(deliverableService.updateDeliverable(id, deliverable));
  }

  @DeleteMapping("/project-deliverables/{id}")
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<Map<String, String>> deleteDeliverable(@PathVariable Long id) {
    deliverableService.deleteDeliverable(id);
    return ResponseEntity.ok(Map.of("message", "Deliverable deleted successfully"));
  }

  @PostMapping("/project-deliverables/{id}/done")
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<Deliverable> markDone(@PathVariable Long id) {
    return ResponseEntity.ok(deliverableService.markDone(id));
  }

  @PostMapping("/project-deliverables/{id}/renew")
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<Deliverable> renewDeliverable(@PathVariable Long id) {
    return ResponseEntity.ok(deliverableService.renewDeliverable(id));
  }
}
