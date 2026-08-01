package com.fluentgrid.pmo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_assignments")
public class ProjectAssignment {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "project_id", nullable = false)
  private Long projectId;

  @Column(name = "pm_id", nullable = false)
  private Long pmId;

  @Column(name = "assigned_by")
  private Long assignedBy;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Long getProjectId() { return projectId; }
  public void setProjectId(Long projectId) { this.projectId = projectId; }
  public Long getPmId() { return pmId; }
  public void setPmId(Long pmId) { this.pmId = pmId; }
  public Long getAssignedBy() { return assignedBy; }
  public void setAssignedBy(Long assignedBy) { this.assignedBy = assignedBy; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
