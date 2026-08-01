package com.fluentgrid.pmo.controller;

import com.fluentgrid.pmo.model.Risk;
import com.fluentgrid.pmo.repository.RiskRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/risks")
public class RiskController {

  private final RiskRepository repository;

  public RiskController(RiskRepository repository) {
    this.repository = repository;
  }

  @GetMapping
  public ResponseEntity<List<Risk>> getAll(@RequestParam(required = false) Long projectId) {
    if (projectId != null) {
      return ResponseEntity.ok(repository.findByProjectId(projectId));
    }
    return ResponseEntity.ok(repository.findAll());
  }

  @PostMapping
  public ResponseEntity<Risk> create(@RequestBody Risk risk) {
    return ResponseEntity.ok(repository.save(risk));
  }

  @PatchMapping("/{id}")
  public ResponseEntity<Risk> update(@PathVariable Long id, @RequestBody Risk updated) {
    Risk risk = repository.findById(id)
      .orElseThrow(() -> new RuntimeException("Risk not found with id: " + id));
    if (updated.getTitle() != null) risk.setTitle(updated.getTitle());
    if (updated.getDescription() != null) risk.setDescription(updated.getDescription());
    if (updated.getCategory() != null) risk.setCategory(updated.getCategory());
    if (updated.getImpact() != null) risk.setImpact(updated.getImpact());
    if (updated.getProbability() != null) risk.setProbability(updated.getProbability());
    if (updated.getStatus() != null) risk.setStatus(updated.getStatus());
    if (updated.getOwner() != null) risk.setOwner(updated.getOwner());
    if (updated.getMitigationPlan() != null) risk.setMitigationPlan(updated.getMitigationPlan());
    if (updated.getDueDate() != null) risk.setDueDate(updated.getDueDate());
    return ResponseEntity.ok(repository.save(risk));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
    repository.deleteById(id);
    return ResponseEntity.ok(Map.of("message", "Risk deleted successfully"));
  }
}
