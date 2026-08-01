package com.fluentgrid.pmo.service;

import com.fluentgrid.pmo.model.DeleteProjectRequest;
import com.fluentgrid.pmo.model.Notification;
import com.fluentgrid.pmo.model.Project;
import com.fluentgrid.pmo.model.ProjectAssignment;
import com.fluentgrid.pmo.model.ProjectAssignmentHistory;
import com.fluentgrid.pmo.model.User;
import com.fluentgrid.pmo.model.UserProjectAssignment;
import com.fluentgrid.pmo.repository.DeleteProjectRequestRepository;
import com.fluentgrid.pmo.repository.NotificationRepository;
import com.fluentgrid.pmo.repository.ProjectAssignmentHistoryRepository;
import com.fluentgrid.pmo.repository.ProjectAssignmentRepository;
import com.fluentgrid.pmo.repository.ProjectRepository;
import com.fluentgrid.pmo.repository.UserProjectAssignmentRepository;
import com.fluentgrid.pmo.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
public class ProjectService {

  private final ProjectRepository projectRepository;
  private final ProjectAssignmentRepository projectAssignmentRepository;
  private final UserProjectAssignmentRepository userProjectAssignmentRepository;
  private final UserRepository userRepository;
  private final DeleteProjectRequestRepository deleteProjectRequestRepository;
  private final NotificationRepository notificationRepository;
  private final ProjectAssignmentHistoryRepository projectAssignmentHistoryRepository;

  public ProjectService(ProjectRepository projectRepository,
      ProjectAssignmentRepository projectAssignmentRepository,
      UserProjectAssignmentRepository userProjectAssignmentRepository,
      UserRepository userRepository,
      DeleteProjectRequestRepository deleteProjectRequestRepository,
      NotificationRepository notificationRepository,
      ProjectAssignmentHistoryRepository projectAssignmentHistoryRepository) {
    this.projectRepository = projectRepository;
    this.projectAssignmentRepository = projectAssignmentRepository;
    this.userProjectAssignmentRepository = userProjectAssignmentRepository;
    this.userRepository = userRepository;
    this.deleteProjectRequestRepository = deleteProjectRequestRepository;
    this.notificationRepository = notificationRepository;
    this.projectAssignmentHistoryRepository = projectAssignmentHistoryRepository;
  }

  public Project getProjectById(Long id) {
    return projectRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));
  }

  public List<Project> getProjectsForUser(Long userId, String role) {
    if ("SUPER_ADMIN".equals(role) || "ADMIN".equals(role)) {
      return projectRepository.findAll();
    }

    if ("PM".equals(role)) {
      List<ProjectAssignment> assignments = projectAssignmentRepository.findByPmId(userId);
      List<Long> projectIds = assignments.stream().map(ProjectAssignment::getProjectId).toList();
      return projectRepository.findAllById(projectIds);
    }

    List<UserProjectAssignment> assignments = userProjectAssignmentRepository.findByUserId(userId);
    List<Long> projectIds = assignments.stream().map(UserProjectAssignment::getProjectId).toList();
    return projectRepository.findAllById(projectIds);
  }

  private String normalizeName(String name) {
    if (name == null) return null;
    return name.trim().replaceAll("\\s+", " ").toLowerCase();
  }

  public Project createProject(Project project) {
    if (project.getName() != null) {
      if (isDuplicateNameAndBu(project.getName(), project.getBu())) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Project already exists in this Business Unit.");
      }
    }
    project.setCreatedAt(null);
    project.setUpdatedAt(null);
    return projectRepository.save(project);
  }

  public Project updateProject(Long id, Project updated) {
    Project project = projectRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

    if (updated.getName() != null) {
      String bu = updated.getBu() != null ? updated.getBu() : project.getBu();
      if (isDuplicateNameAndBu(updated.getName(), bu, id)) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Project already exists in this Business Unit.");
      }
      project.setName(updated.getName());
    }
    if (updated.getBu() != null) project.setBu(updated.getBu());
    if (updated.getType() != null) project.setType(updated.getType());
    if (updated.getInfraManagedBy() != null) project.setInfraManagedBy(updated.getInfraManagedBy());
    if (updated.getSpoc() != null) project.setSpoc(updated.getSpoc());
    if (updated.getProgress() != null) project.setProgress(updated.getProgress());
    if (updated.getStatus() != null) project.setStatus(updated.getStatus());
    if (updated.getStartDate() != null) project.setStartDate(updated.getStartDate());
    if (updated.getEndDate() != null) project.setEndDate(updated.getEndDate());
    if (updated.getTeamSize() != null) project.setTeamSize(updated.getTeamSize());
    if (updated.getBudget() != null) project.setBudget(updated.getBudget());
    if (updated.getDescription() != null) project.setDescription(updated.getDescription());
    if (updated.getPriority() != null) project.setPriority(updated.getPriority());
    if (updated.getDefaultFolder() != null) project.setDefaultFolder(updated.getDefaultFolder());
    if (updated.getRetentionDays() != null) project.setRetentionDays(updated.getRetentionDays());
    if (updated.getNotifyEmail() != null) project.setNotifyEmail(updated.getNotifyEmail());
    if (updated.getNotifyDeadline() != null) project.setNotifyDeadline(updated.getNotifyDeadline());
    if (updated.getPermissions() != null) project.setPermissions(updated.getPermissions());

    return projectRepository.save(project);
  }

  public void deleteProject(Long id) {
    if (!projectRepository.existsById(id)) {
      throw new RuntimeException("Project not found with id: " + id);
    }
    deleteProjectRequestRepository.findByProjectIdAndStatus(id, "PENDING")
      .ifPresent(req -> {
        req.setStatus("APPROVED");
        deleteProjectRequestRepository.save(req);
      });
    projectRepository.deleteById(id);
  }

  public DeleteProjectRequest requestDeleteProject(Long projectId, Long userId) {
    Project project = projectRepository.findById(projectId)
      .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));
    User requester = userRepository.findById(userId)
      .orElseThrow(() -> new RuntimeException("User not found"));

    if (deleteProjectRequestRepository.findByProjectIdAndStatus(projectId, "PENDING").isPresent()) {
      throw new RuntimeException("A delete request for this project is already pending");
    }

    DeleteProjectRequest request = new DeleteProjectRequest();
    request.setProjectId(projectId);
    request.setProjectName(project.getName());
    request.setRequestedBy(userId);
    request.setRequestedByName(requester.getName());
    request.setStatus("PENDING");
    deleteProjectRequestRepository.save(request);

    List<User> admins = userRepository.findByRole(User.Role.SUPER_ADMIN);
    for (User admin : admins) {
      Notification notif = new Notification();
      notif.setUserId(admin.getId());
      notif.setTitle("Delete Request");
      notif.setMessage("PM " + requester.getName() + " requested deletion of project \"" + project.getName() + "\".");
      notif.setType("DELETE_REQUEST");
      notificationRepository.save(notif);
    }

    return request;
  }

  public void approveDeleteRequest(Long requestId, Long reviewerId) {
    DeleteProjectRequest request = deleteProjectRequestRepository.findById(requestId)
      .orElseThrow(() -> new RuntimeException("Delete request not found"));
    request.setStatus("APPROVED");
    request.setReviewedBy(reviewerId);
    deleteProjectRequestRepository.save(request);

    if (projectRepository.existsById(request.getProjectId())) {
      projectRepository.deleteById(request.getProjectId());
    }

    Notification notif = new Notification();
    notif.setUserId(request.getRequestedBy());
    notif.setTitle("Delete Approved");
    notif.setMessage("Your request to delete project \"" + request.getProjectName() + "\" has been approved and the project has been deleted.");
    notif.setType("DELETE_REQUEST");
    notificationRepository.save(notif);
  }

  public void rejectDeleteRequest(Long requestId, Long reviewerId, String notes) {
    DeleteProjectRequest request = deleteProjectRequestRepository.findById(requestId)
      .orElseThrow(() -> new RuntimeException("Delete request not found"));
    request.setStatus("REJECTED");
    request.setReviewedBy(reviewerId);
    request.setReviewNotes(notes);
    deleteProjectRequestRepository.save(request);

    Notification notif = new Notification();
    notif.setUserId(request.getRequestedBy());
    notif.setTitle("Delete Rejected");
    notif.setMessage("Your request to delete project \"" + request.getProjectName() + "\" has been rejected."
      + (notes != null ? " Reason: " + notes : ""));
    notif.setType("DELETE_REQUEST");
    notificationRepository.save(notif);
  }

  public List<DeleteProjectRequest> getDeleteRequests(String status) {
    if (status == null || status.isBlank()) {
      return deleteProjectRequestRepository.findAll();
    }
    return deleteProjectRequestRepository.findByStatus(status);
  }

  public DeleteProjectRequest getDeleteRequestForProject(Long projectId) {
    return deleteProjectRequestRepository.findByProjectIdAndStatus(projectId, "PENDING").orElse(null);
  }

  public Project changePm(Long projectId, Long newPmId, Long changedBy) {
    Project project = projectRepository.findById(projectId)
      .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

    User newPm = userRepository.findById(newPmId)
      .orElseThrow(() -> new RuntimeException("PM not found with id: " + newPmId));

    if (newPm.getRole() != User.Role.PM) {
      throw new IllegalArgumentException("Selected user is not a PM");
    }

    List<ProjectAssignment> existingAssignments = projectAssignmentRepository.findByProjectId(projectId);
    Long oldPmId = existingAssignments.isEmpty() ? null : existingAssignments.get(0).getPmId();

    if (oldPmId != null && oldPmId.equals(newPmId)) {
      throw new IllegalArgumentException("This PM is already assigned to the project");
    }

    for (ProjectAssignment assignment : existingAssignments) {
      projectAssignmentRepository.delete(assignment);
    }

    ProjectAssignment newAssignment = new ProjectAssignment();
    newAssignment.setProjectId(projectId);
    newAssignment.setPmId(newPmId);
    newAssignment.setAssignedBy(changedBy);
    projectAssignmentRepository.save(newAssignment);

    ProjectAssignmentHistory history = new ProjectAssignmentHistory();
    history.setProjectId(projectId);
    history.setOldPmId(oldPmId);
    history.setNewPmId(newPmId);
    history.setChangedBy(changedBy);
    projectAssignmentHistoryRepository.save(history);

    Notification notif = new Notification();
    notif.setUserId(newPmId);
    notif.setTitle("Project Assigned");
    notif.setMessage("Project \"" + project.getName() + "\" has been assigned to you.");
    notif.setType("ASSIGNMENT");
    notificationRepository.save(notif);

    if (oldPmId != null) {
      Notification oldNotif = new Notification();
      oldNotif.setUserId(oldPmId);
      oldNotif.setTitle("Project Unassigned");
      oldNotif.setMessage("Project \"" + project.getName() + "\" has been unassigned from you.");
      oldNotif.setType("ASSIGNMENT");
      notificationRepository.save(oldNotif);
    }

    return project;
  }

  public boolean isDuplicateName(String name) {
    if (name == null || name.isBlank()) return false;
    return !projectRepository.findByNameNormalized(normalizeName(name)).isEmpty();
  }

  public boolean isDuplicateNameAndBu(String name, String bu) {
    return isDuplicateNameAndBu(name, bu, null);
  }

  public boolean isDuplicateNameAndBu(String name, String bu, Long excludeId) {
    if (name == null || name.isBlank()) return false;
    String normalizedName = normalizeName(name);
    String normalizedBu = bu != null ? normalizeName(bu) : null;

    List<Project> matches = projectRepository.findByNameNormalized(normalizedName);

    return matches.stream()
      .filter(p -> excludeId == null || !p.getId().equals(excludeId))
      .anyMatch(p -> {
        String existingBu = p.getBu() != null ? normalizeName(p.getBu()) : null;
        if (normalizedBu == null && existingBu == null) return true;
        if (normalizedBu == null || existingBu == null) return false;
        return normalizedBu.equals(existingBu);
      });
  }
}
