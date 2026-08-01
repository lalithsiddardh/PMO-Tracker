package com.fluentgrid.pmo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "delete_project_requests")
public class DeleteProjectRequest {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "project_id")
  private Long projectId;

  @Column(name = "project_name")
  private String projectName;

  @Column(name = "requested_by")
  private Long requestedBy;

  @Column(name = "requested_by_name")
  private String requestedByName;

  private String status;

  @Column(name = "reviewed_by")
  private Long reviewedBy;

  @Column(name = "review_notes")
  private String reviewNotes;

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
  public String getProjectName() { return projectName; }
  public void setProjectName(String projectName) { this.projectName = projectName; }
  public Long getRequestedBy() { return requestedBy; }
  public void setRequestedBy(Long requestedBy) { this.requestedBy = requestedBy; }
  public String getRequestedByName() { return requestedByName; }
  public void setRequestedByName(String requestedByName) { this.requestedByName = requestedByName; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public Long getReviewedBy() { return reviewedBy; }
  public void setReviewedBy(Long reviewedBy) { this.reviewedBy = reviewedBy; }
  public String getReviewNotes() { return reviewNotes; }
  public void setReviewNotes(String reviewNotes) { this.reviewNotes = reviewNotes; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
