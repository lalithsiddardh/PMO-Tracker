package com.fluentgrid.pmo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_assignment_history")
public class ProjectAssignmentHistory {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "project_id", nullable = false)
  private Long projectId;

  @Column(name = "old_pm_id")
  private Long oldPmId;

  @Column(name = "new_pm_id", nullable = false)
  private Long newPmId;

  @Column(name = "changed_by", nullable = false)
  private Long changedBy;

  @Column(name = "changed_at", nullable = false, updatable = false)
  private LocalDateTime changedAt;

  @PrePersist
  protected void onCreate() {
    changedAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Long getProjectId() { return projectId; }
  public void setProjectId(Long projectId) { this.projectId = projectId; }
  public Long getOldPmId() { return oldPmId; }
  public void setOldPmId(Long oldPmId) { this.oldPmId = oldPmId; }
  public Long getNewPmId() { return newPmId; }
  public void setNewPmId(Long newPmId) { this.newPmId = newPmId; }
  public Long getChangedBy() { return changedBy; }
  public void setChangedBy(Long changedBy) { this.changedBy = changedBy; }
  public LocalDateTime getChangedAt() { return changedAt; }
  public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }
}
