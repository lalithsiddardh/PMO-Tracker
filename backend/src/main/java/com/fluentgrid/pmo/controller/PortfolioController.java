package com.fluentgrid.pmo.controller;

import com.fluentgrid.pmo.model.Project;
import com.fluentgrid.pmo.repository.ProjectRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

  private final ProjectRepository projectRepository;

  public PortfolioController(ProjectRepository projectRepository) {
    this.projectRepository = projectRepository;
  }

  @GetMapping
  public ResponseEntity<List<Map<String, Object>>> getPortfolio() {
    List<Project> projects = projectRepository.findAll();

    Map<String, List<Project>> byBu = projects.stream()
      .filter(p -> p.getBu() != null && !p.getBu().isBlank())
      .collect(Collectors.groupingBy(Project::getBu));

    List<Map<String, Object>> portfolio = new ArrayList<>();
    for (Map.Entry<String, List<Project>> entry : byBu.entrySet()) {
      Map<String, Object> buGroup = new HashMap<>();
      buGroup.put("bu", entry.getKey());
      buGroup.put("total", entry.getValue().size());
      buGroup.put("active", entry.getValue().stream().filter(p -> "ACTIVE".equals(p.getStatus())).count());
      buGroup.put("completed", entry.getValue().stream().filter(p -> "COMPLETED".equals(p.getStatus())).count());
      buGroup.put("budget", entry.getValue().stream().filter(p -> p.getBudget() != null).mapToDouble(Project::getBudget).sum());
      buGroup.put("projects", entry.getValue().stream().map(p -> {
        Map<String, Object> pm = new HashMap<>();
        pm.put("id", p.getId());
        pm.put("name", p.getName());
        pm.put("type", p.getType());
        pm.put("status", p.getStatus());
        pm.put("progress", p.getProgress());
        pm.put("spoc", p.getSpoc());
        pm.put("startDate", p.getStartDate());
        pm.put("endDate", p.getEndDate());
        pm.put("budget", p.getBudget());
        return pm;
      }).toList());
      portfolio.add(buGroup);
    }
    return ResponseEntity.ok(portfolio);
  }
}
