package com.fluentgrid.pmo.controller;

import com.fluentgrid.pmo.model.Project;
import com.fluentgrid.pmo.model.Deliverable;
import com.fluentgrid.pmo.repository.ProjectRepository;
import com.fluentgrid.pmo.repository.DeliverableRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class StateController {

  private final ProjectRepository projectRepository;
  private final DeliverableRepository deliverableRepository;

  public StateController(ProjectRepository projectRepository,
      DeliverableRepository deliverableRepository) {
    this.projectRepository = projectRepository;
    this.deliverableRepository = deliverableRepository;
  }

  @GetMapping("/state")
  public ResponseEntity<Map<String, Object>> getState(Authentication authentication) {
    List<Project> projects = projectRepository.findAll();
    List<Deliverable> allDeliverables = deliverableRepository.findAll();

    int totalProjects = projects.size();
    int activeProjects = (int) projects.stream().filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus())).count();
    int completedProjects = (int) projects.stream().filter(p -> "COMPLETED".equalsIgnoreCase(p.getStatus())).count();

    LocalDate today = LocalDate.now();
    long overdueDeliverables = allDeliverables.stream()
      .filter(d -> d.getNextDate() != null && d.getNextDate().isBefore(today))
      .count();
    long dueSoonDeliverables = allDeliverables.stream()
      .filter(d -> d.getNextDate() != null && d.getReminderDays() != null
        && !d.getNextDate().isBefore(today)
        && !d.getNextDate().isAfter(today.plusDays(d.getReminderDays())))
      .count();
    long validDeliverables = allDeliverables.size() - overdueDeliverables - dueSoonDeliverables;

    Map<String, Object> overview = new HashMap<>();
    overview.put("totalProjects", totalProjects);
    overview.put("activeProjects", activeProjects);
    overview.put("completedProjects", completedProjects);
    overview.put("overdueDeliverables", overdueDeliverables);
    overview.put("dueSoonDeliverables", dueSoonDeliverables);
    overview.put("validDeliverables", validDeliverables);

    Map<String, Object> response = new HashMap<>();
    response.put("projects", projects);
    response.put("overview", overview);

    return ResponseEntity.ok(response);
  }
}
