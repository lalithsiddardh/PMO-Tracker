package com.fluentgrid.pmo.controller;

import com.fluentgrid.pmo.model.ProjectAssignment;
import com.fluentgrid.pmo.model.User;
import com.fluentgrid.pmo.model.UserProjectAssignment;
import com.fluentgrid.pmo.repository.ProjectAssignmentRepository;
import com.fluentgrid.pmo.repository.ProjectRepository;
import com.fluentgrid.pmo.repository.UserProjectAssignmentRepository;
import com.fluentgrid.pmo.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/team")
public class TeamController {

  private final UserRepository userRepository;
  private final ProjectAssignmentRepository projectAssignmentRepository;
  private final UserProjectAssignmentRepository userProjectAssignmentRepository;
  private final ProjectRepository projectRepository;

  public TeamController(UserRepository userRepository,
      ProjectAssignmentRepository projectAssignmentRepository,
      UserProjectAssignmentRepository userProjectAssignmentRepository,
      ProjectRepository projectRepository) {
    this.userRepository = userRepository;
    this.projectAssignmentRepository = projectAssignmentRepository;
    this.userProjectAssignmentRepository = userProjectAssignmentRepository;
    this.projectRepository = projectRepository;
  }

  @GetMapping
  public ResponseEntity<List<Map<String, Object>>> getTeam() {
    List<User> users = userRepository.findAll().stream()
      .filter(u -> u.getStatus() == User.Status.ACTIVE)
      .toList();

    Map<String, String> projectNames = new HashMap<>();
    projectRepository.findAll().forEach(p -> projectNames.put(String.valueOf(p.getId()), p.getName()));

    List<Map<String, Object>> team = users.stream().map(u -> {
      Map<String, Object> member = new HashMap<>();
      member.put("id", u.getId());
      member.put("name", u.getName());
      member.put("email", u.getEmail());
      member.put("role", u.getRole().name());
      member.put("status", u.getStatus().name());

      List<String> userProjects = new ArrayList<>();
      if (u.getRole() == User.Role.PM) {
        projectAssignmentRepository.findByPmId(u.getId())
          .forEach(pa -> userProjects.add(projectNames.getOrDefault(String.valueOf(pa.getProjectId()), "Project #" + pa.getProjectId())));
      } else {
        userProjectAssignmentRepository.findByUserId(u.getId())
          .forEach(upa -> userProjects.add(projectNames.getOrDefault(String.valueOf(upa.getProjectId()), "Project #" + upa.getProjectId())));
      }
      member.put("projects", userProjects);
      member.put("projectCount", userProjects.size());

      return member;
    }).toList();

    return ResponseEntity.ok(team);
  }
}
