package com.fluentgrid.pmo.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "incidents")
public class Incident {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "project_id")
  private Long projectId;

  private String title;
  private String description;
  private String severity;
  private String status;
  private String assignee;

  @Column(name = "reported_date")
  private LocalDate reportedDate;

  @Column(name = "resolution_date")
  private LocalDate resolutionDate;

  @Column(name = "created_by")
  private Long createdBy;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Long getProjectId() { return projectId; }
  public void setProjectId(Long projectId) { this.projectId = projectId; }
  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public String getSeverity() { return severity; }
  public void setSeverity(String severity) { this.severity = severity; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public String getAssignee() { return assignee; }
  public void setAssignee(String assignee) { this.assignee = assignee; }
  public LocalDate getReportedDate() { return reportedDate; }
  public void setReportedDate(LocalDate reportedDate) { this.reportedDate = reportedDate; }
  public LocalDate getResolutionDate() { return resolutionDate; }
  public void setResolutionDate(LocalDate resolutionDate) { this.resolutionDate = resolutionDate; }
  public Long getCreatedBy() { return createdBy; }
  public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
