package com.fluentgrid.pmo.controller;

import com.fluentgrid.pmo.model.Deliverable;
import com.fluentgrid.pmo.model.Project;
import com.fluentgrid.pmo.model.ProjectAssignment;
import com.fluentgrid.pmo.model.User;
import com.fluentgrid.pmo.model.UserProjectAssignment;
import com.fluentgrid.pmo.repository.DeliverableRepository;
import com.fluentgrid.pmo.repository.ProjectAssignmentRepository;
import com.fluentgrid.pmo.repository.ProjectRepository;
import com.fluentgrid.pmo.repository.UserProjectAssignmentRepository;
import com.fluentgrid.pmo.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class DashboardController {

  private final ProjectRepository projectRepository;
  private final DeliverableRepository deliverableRepository;
  private final ProjectAssignmentRepository projectAssignmentRepository;
  private final UserProjectAssignmentRepository userProjectAssignmentRepository;
  private final UserRepository userRepository;

  public DashboardController(ProjectRepository projectRepository,
      DeliverableRepository deliverableRepository,
      ProjectAssignmentRepository projectAssignmentRepository,
      UserProjectAssignmentRepository userProjectAssignmentRepository,
      UserRepository userRepository) {
    this.projectRepository = projectRepository;
    this.deliverableRepository = deliverableRepository;
    this.projectAssignmentRepository = projectAssignmentRepository;
    this.userProjectAssignmentRepository = userProjectAssignmentRepository;
    this.userRepository = userRepository;
  }

  private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(DashboardController.class);

  @GetMapping("/dashboard")
  public ResponseEntity<Map<String, Object>> getDashboard(Authentication authentication) {
    String email = (String) authentication.getPrincipal();
    log.info("DashboardController.getDashboard() called by: {} | authorities: {}", email, authentication.getAuthorities());
    User user = userRepository.findByEmail(email).orElseThrow();
    String role = user.getRole().name();
    Long userId = user.getId();

    Map<String, Object> response = new HashMap<>();

    if ("SUPER_ADMIN".equals(role) || "ADMIN".equals(role)) {
      List<Project> allProjects = projectRepository.findAll();
      List<Deliverable> allDeliverables = deliverableRepository.findAll();

      response.put("role", role);

      // Project status distribution
      Map<String, Long> statusDist = allProjects.stream()
          .collect(Collectors.groupingBy(
              p -> p.getStatus() != null ? p.getStatus().toLowerCase() : "unknown",
              Collectors.counting()));
      response.put("projectStatusDistribution", statusDist);

      // Project type distribution
      Map<String, Long> typeDist = allProjects.stream()
          .collect(Collectors.groupingBy(
              p -> p.getType() != null ? p.getType() : "unspecified",
              Collectors.counting()));
      response.put("projectTypeDistribution", typeDist);

      // Projects by BU
      Map<String, Long> buDist = allProjects.stream()
          .collect(Collectors.groupingBy(
              p -> p.getBu() != null && !p.getBu().isBlank() ? p.getBu() : "Unassigned",
              Collectors.counting()));
      response.put("projectsByBU", buDist);

      // Deliverables status
      LocalDate today = LocalDate.now();
      long overdue = allDeliverables.stream()
          .filter(d -> d.getNextDate() != null && d.getNextDate().isBefore(today))
          .count();
      long dueSoon = allDeliverables.stream()
          .filter(d -> d.getNextDate() != null && d.getReminderDays() != null
              && !d.getNextDate().isBefore(today)
              && !d.getNextDate().isAfter(today.plusDays(d.getReminderDays())))
          .count();
      long valid = allDeliverables.size() - overdue - dueSoon;
      Map<String, Long> delStatus = new HashMap<>();
      delStatus.put("valid", valid);
      delStatus.put("dueSoon", dueSoon);
      delStatus.put("overdue", overdue);
      response.put("deliverableStatus", delStatus);

      // Projects array for frontend tables and charts
      List<Map<String, Object>> projectList = allProjects.stream().map(p -> {
        Map<String, Object> pm = new HashMap<>();
        pm.put("id", p.getId());
        pm.put("name", p.getName());
        pm.put("bu", p.getBu());
        pm.put("type", p.getType());
        pm.put("status", p.getStatus());
        pm.put("progress", p.getProgress());
        pm.put("spoc", p.getSpoc());
        pm.put("startDate", p.getStartDate() != null ? p.getStartDate().toString() : null);
        pm.put("endDate", p.getEndDate() != null ? p.getEndDate().toString() : null);
        pm.put("updatedAt", p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : null);
        return pm;
      }).collect(Collectors.toList());
      response.put("projects", projectList);

      // KPI
      Map<String, Object> kpi = new HashMap<>();
      kpi.put("totalProjects", allProjects.size());
      kpi.put("activeProjects", allProjects.stream().filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus())).count());
      kpi.put("overdueDeliverables", overdue);
      kpi.put("dueSoonDeliverables", dueSoon);
      kpi.put("onTrackDeliverables", valid);
      response.put("kpi", kpi);

    } else if ("PM".equals(role)) {
      List<ProjectAssignment> assignments = projectAssignmentRepository.findByPmId(userId);
      List<Long> projectIds = assignments.stream().map(ProjectAssignment::getProjectId).toList();
      List<Project> myProjects = projectRepository.findAllById(projectIds);
      List<Deliverable> allDeliverables = deliverableRepository.findAll();
      List<Deliverable> myDeliverables = allDeliverables.stream()
          .filter(d -> projectIds.contains(d.getProjectId()))
          .toList();

      response.put("role", role);
      response.put("assignedProjectIds", projectIds);

      // My project status distribution
      Map<String, Long> statusDist = myProjects.stream()
          .collect(Collectors.groupingBy(
              p -> p.getStatus() != null ? p.getStatus().toLowerCase() : "unknown",
              Collectors.counting()));
      response.put("projectStatusDistribution", statusDist);

      // Project type distribution
      Map<String, Long> typeDist = myProjects.stream()
          .collect(Collectors.groupingBy(
              p -> p.getType() != null ? p.getType() : "unspecified",
              Collectors.counting()));
      response.put("projectTypeDistribution", typeDist);

      // Projects by BU
      Map<String, Long> buDist = myProjects.stream()
          .collect(Collectors.groupingBy(
              p -> p.getBu() != null && !p.getBu().isBlank() ? p.getBu() : "Unassigned",
              Collectors.counting()));
      response.put("projectsByBU", buDist);

      // My deliverables status
      LocalDate today = LocalDate.now();
      long overdue = myDeliverables.stream()
          .filter(d -> d.getNextDate() != null && d.getNextDate().isBefore(today))
          .count();
      long dueSoon = myDeliverables.stream()
          .filter(d -> d.getNextDate() != null && d.getReminderDays() != null
              && !d.getNextDate().isBefore(today)
              && !d.getNextDate().isAfter(today.plusDays(d.getReminderDays())))
          .count();
      long valid = myDeliverables.size() - overdue - dueSoon;
      Map<String, Long> delStatus = new HashMap<>();
      delStatus.put("valid", valid);
      delStatus.put("dueSoon", dueSoon);
      delStatus.put("overdue", overdue);
      response.put("deliverableStatus", delStatus);

      // Projects array for frontend tables and charts
      List<Map<String, Object>> projectList = myProjects.stream().map(p -> {
        Map<String, Object> pm = new HashMap<>();
        pm.put("id", p.getId());
        pm.put("name", p.getName());
        pm.put("bu", p.getBu());
        pm.put("type", p.getType());
        pm.put("status", p.getStatus());
        pm.put("progress", p.getProgress());
        pm.put("spoc", p.getSpoc());
        pm.put("startDate", p.getStartDate() != null ? p.getStartDate().toString() : null);
        pm.put("endDate", p.getEndDate() != null ? p.getEndDate().toString() : null);
        pm.put("updatedAt", p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : null);
        return pm;
      }).collect(Collectors.toList());
      response.put("projects", projectList);

      // KPI
      Map<String, Object> kpi = new HashMap<>();
      kpi.put("assignedProjects", myProjects.size());
      kpi.put("totalDeliverables", myDeliverables.size());
      kpi.put("overdueDeliverables", overdue);
      kpi.put("dueSoonDeliverables", dueSoon);
      kpi.put("onTrackDeliverables", valid);
      response.put("kpi", kpi);

    } else {
      // Team member
      List<UserProjectAssignment> assignments = userProjectAssignmentRepository.findByUserId(userId);
      List<Long> projectIds = assignments.stream().map(UserProjectAssignment::getProjectId).toList();
      List<Project> myProjects = projectRepository.findAllById(projectIds);
      List<Deliverable> allDeliverables = deliverableRepository.findAll();
      List<Deliverable> myDeliverables = allDeliverables.stream()
          .filter(d -> projectIds.contains(d.getProjectId()))
          .toList();

      response.put("role", role);
      response.put("assignedProjectIds", projectIds);
      response.put("assignedProjects", myProjects.size());
      response.put("totalDeliverables", myDeliverables.size());
    }

    return ResponseEntity.ok(response);
  }
}
