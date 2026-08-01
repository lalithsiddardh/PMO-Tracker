package com.fluentgrid.pmo.controller;

import com.fluentgrid.pmo.model.Deliverable;
import com.fluentgrid.pmo.model.Project;
import com.fluentgrid.pmo.model.SecurityTask;
import com.fluentgrid.pmo.model.User;
import com.fluentgrid.pmo.repository.DeliverableRepository;
import com.fluentgrid.pmo.repository.ProjectRepository;
import com.fluentgrid.pmo.repository.SecurityTaskRepository;
import com.fluentgrid.pmo.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/search")
public class SearchController {

  private final ProjectRepository projectRepository;
  private final DeliverableRepository deliverableRepository;
  private final SecurityTaskRepository securityTaskRepository;
  private final UserRepository userRepository;

  public SearchController(ProjectRepository projectRepository,
      DeliverableRepository deliverableRepository,
      SecurityTaskRepository securityTaskRepository,
      UserRepository userRepository) {
    this.projectRepository = projectRepository;
    this.deliverableRepository = deliverableRepository;
    this.securityTaskRepository = securityTaskRepository;
    this.userRepository = userRepository;
  }

  @GetMapping
  public ResponseEntity<Map<String, Object>> search(@RequestParam String q) {
    String query = q.toLowerCase().trim();
    Map<String, Object> results = new HashMap<>();

    List<Map<String, Object>> projects = projectRepository.findAll().stream()
      .filter(p -> matches(query, p.getName(), p.getBu(), p.getType(), p.getSpoc(), p.getInfraManagedBy()))
      .map(p -> { Map<String, Object> m = new HashMap<>(); m.put("id", p.getId()); m.put("name", p.getName()); m.put("type", "project"); m.put("subtitle", p.getBu() + " / " + (p.getType() != null ? p.getType() : "")); return m; })
      .limit(10)
      .toList();
    results.put("projects", projects);

    List<Map<String, Object>> deliverables = deliverableRepository.findAll().stream()
      .filter(d -> matches(query, d.getName(), d.getCategory(), d.getOwner(), d.getScope()))
      .map(d -> { Map<String, Object> m = new HashMap<>(); m.put("id", d.getId()); m.put("name", d.getName()); m.put("type", "deliverable"); m.put("subtitle", d.getCategory() != null ? d.getCategory() : ""); return m; })
      .limit(10)
      .toList();
    results.put("deliverables", deliverables);

    List<Map<String, Object>> tasks = securityTaskRepository.findAll().stream()
      .filter(t -> matches(query, t.getTitle(), t.getNotes(), t.getAssignee()))
      .map(t -> { Map<String, Object> m = new HashMap<>(); m.put("id", t.getId()); m.put("name", t.getTitle()); m.put("type", "task"); m.put("subtitle", t.getStatus() != null ? t.getStatus() : ""); return m; })
      .limit(10)
      .toList();
    results.put("tasks", tasks);

    List<Map<String, Object>> users = userRepository.findAll().stream()
      .filter(u -> matches(query, u.getName(), u.getEmail(), u.getRole().name()))
      .map(u -> { Map<String, Object> m = new HashMap<>(); m.put("id", u.getId()); m.put("name", u.getName()); m.put("type", "user"); m.put("subtitle", u.getEmail() + " (" + u.getRole() + ")"); return m; })
      .limit(10)
      .toList();
    results.put("users", users);

    return ResponseEntity.ok(results);
  }

  private boolean matches(String query, String... fields) {
    for (String f : fields) {
      if (f != null && f.toLowerCase().contains(query)) return true;
    }
    return false;
  }
}
