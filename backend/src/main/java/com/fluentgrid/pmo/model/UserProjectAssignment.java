package com.fluentgrid.pmo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_project_assignments")
public class UserProjectAssignment {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(name = "project_id", nullable = false)
  private Long projectId;

  @Column(name = "assigned_by")
  private Long assignedBy;

  @Column(name = "assigned_at", nullable = false, updatable = false)
  private LocalDateTime assignedAt;

  @PrePersist
  protected void onCreate() {
    assignedAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Long getUserId() { return userId; }
  public void setUserId(Long userId) { this.userId = userId; }
  public Long getProjectId() { return projectId; }
  public void setProjectId(Long projectId) { this.projectId = projectId; }
  public Long getAssignedBy() { return assignedBy; }
  public void setAssignedBy(Long assignedBy) { this.assignedBy = assignedBy; }
  public LocalDateTime getAssignedAt() { return assignedAt; }
  public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }
}
