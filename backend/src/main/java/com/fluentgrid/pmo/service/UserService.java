package com.fluentgrid.pmo.service;

import com.fluentgrid.pmo.model.Notification;
import com.fluentgrid.pmo.model.Project;
import com.fluentgrid.pmo.model.ProjectAssignment;
import com.fluentgrid.pmo.model.RegistrationRequest;
import com.fluentgrid.pmo.model.User;
import com.fluentgrid.pmo.model.UserProjectAssignment;
import com.fluentgrid.pmo.repository.NotificationRepository;
import com.fluentgrid.pmo.repository.ProjectAssignmentRepository;
import com.fluentgrid.pmo.repository.ProjectRepository;
import com.fluentgrid.pmo.repository.RegistrationRequestRepository;
import com.fluentgrid.pmo.repository.UserProjectAssignmentRepository;
import com.fluentgrid.pmo.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

  private final UserRepository userRepository;
  private final RegistrationRequestRepository registrationRequestRepository;
  private final NotificationRepository notificationRepository;
  private final ProjectAssignmentRepository projectAssignmentRepository;
  private final UserProjectAssignmentRepository userProjectAssignmentRepository;
  private final ProjectRepository projectRepository;

  public UserService(UserRepository userRepository,
      RegistrationRequestRepository registrationRequestRepository,
      NotificationRepository notificationRepository,
      ProjectAssignmentRepository projectAssignmentRepository,
      UserProjectAssignmentRepository userProjectAssignmentRepository,
      ProjectRepository projectRepository) {
    this.userRepository = userRepository;
    this.registrationRequestRepository = registrationRequestRepository;
    this.notificationRepository = notificationRepository;
    this.projectAssignmentRepository = projectAssignmentRepository;
    this.userProjectAssignmentRepository = userProjectAssignmentRepository;
    this.projectRepository = projectRepository;
  }

  public List<User> getAllUsers() {
    return userRepository.findAll();
  }

  public List<RegistrationRequest> getPendingRegistrations() {
    return registrationRequestRepository.findByStatus("PENDING");
  }

  public String approveRegistration(Long requestId, Long reviewerId) {
    RegistrationRequest req = registrationRequestRepository.findById(requestId)
      .orElseThrow(() -> new RuntimeException("Registration request not found"));

    User user = userRepository.findById(req.getUserId())
      .orElseThrow(() -> new RuntimeException("User not found"));

    user.setStatus(User.Status.ACTIVE);
    userRepository.save(user);

    req.setStatus("APPROVED");
    req.setReviewedBy(reviewerId);
    registrationRequestRepository.save(req);

    Notification notif = new Notification();
    notif.setUserId(user.getId());
    notif.setTitle("Registration Approved");
    notif.setMessage("Your registration has been approved. You can now log in.");
    notif.setType("REGISTRATION");
    notificationRepository.save(notif);

    return "User approved successfully";
  }

  public String rejectRegistration(Long requestId, Long reviewerId, String notes) {
    RegistrationRequest req = registrationRequestRepository.findById(requestId)
      .orElseThrow(() -> new RuntimeException("Registration request not found"));

    User user = userRepository.findById(req.getUserId())
      .orElseThrow(() -> new RuntimeException("User not found"));

    user.setStatus(User.Status.REJECTED);
    userRepository.save(user);

    req.setStatus("REJECTED");
    req.setReviewedBy(reviewerId);
    req.setReviewNotes(notes);
    registrationRequestRepository.save(req);

    Notification notif = new Notification();
    notif.setUserId(user.getId());
    notif.setTitle("Registration Rejected");
    notif.setMessage("Your registration has been rejected." + (notes != null ? " Reason: " + notes : ""));
    notif.setType("REGISTRATION");
    notificationRepository.save(notif);

    return "User rejected successfully";
  }

  public String assignPm(Long userId, Long pmId) {
    User user = userRepository.findById(userId)
      .orElseThrow(() -> new RuntimeException("User not found"));
    User pm = userRepository.findById(pmId)
      .orElseThrow(() -> new RuntimeException("PM not found"));

    if (pm.getRole() != User.Role.PM) {
      throw new IllegalArgumentException("Selected user is not a PM");
    }

    user.setAssignedPm(pm);
    userRepository.save(user);

    Notification notif = new Notification();
    notif.setUserId(user.getId());
    notif.setTitle("PM Assigned");
    notif.setMessage("PM " + pm.getName() + " has been assigned to you.");
    notif.setType("ASSIGNMENT");
    notificationRepository.save(notif);

    return "PM assigned successfully";
  }

  public String assignProjectToPm(Long projectId, Long pmId, Long adminId) {
    User pm = userRepository.findById(pmId)
      .orElseThrow(() -> new RuntimeException("PM not found"));
    Project project = projectRepository.findById(projectId)
      .orElseThrow(() -> new RuntimeException("Project not found"));

    if (pm.getRole() != User.Role.PM) {
      throw new IllegalArgumentException("Selected user is not a PM");
    }

    if (!projectAssignmentRepository.existsByProjectIdAndPmId(projectId, pmId)) {
      ProjectAssignment assignment = new ProjectAssignment();
      assignment.setProjectId(projectId);
      assignment.setPmId(pmId);
      assignment.setAssignedBy(adminId);
      projectAssignmentRepository.save(assignment);
    }

    Notification notif = new Notification();
    notif.setUserId(pmId);
    notif.setTitle("Project Assigned");
    notif.setMessage("Project " + project.getName() + " has been assigned to you.");
    notif.setType("ASSIGNMENT");
    notificationRepository.save(notif);

    return "Project assigned to PM successfully";
  }

  public void deleteUser(Long id) {
    if (!userRepository.existsById(id)) {
      throw new RuntimeException("User not found with id: " + id);
    }
    userRepository.deleteById(id);
  }

  public String assignUserToProject(Long userId, Long projectId, Long assignedBy) {
    if (!userProjectAssignmentRepository.existsByUserIdAndProjectId(userId, projectId)) {
      UserProjectAssignment assignment = new UserProjectAssignment();
      assignment.setUserId(userId);
      assignment.setProjectId(projectId);
      assignment.setAssignedBy(assignedBy);
      userProjectAssignmentRepository.save(assignment);
    }

    Notification notif = new Notification();
    notif.setUserId(userId);
    notif.setTitle("Project Assigned");
    notif.setMessage("You have been assigned to a project.");
    notif.setType("ASSIGNMENT");
    notificationRepository.save(notif);

    return "User assigned to project successfully";
  }
}
