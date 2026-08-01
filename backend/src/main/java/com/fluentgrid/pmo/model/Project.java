package com.fluentgrid.pmo.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "projects", uniqueConstraints = {
  @UniqueConstraint(columnNames = {"name", "bu"})
})
public class Project {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  private String bu;
  private String type;

  @Column(name = "infra_managed_by")
  private String infraManagedBy;

  private String spoc;
  private Integer progress;
  private String status;

  @Column(name = "start_date")
  private LocalDate startDate;

  @Column(name = "end_date")
  private LocalDate endDate;

  @Column(name = "team_size")
  private Integer teamSize;

  private Double budget;

  @Column(columnDefinition = "TEXT")
  private String description;

  private String priority;

  @Column(name = "default_folder")
  private String defaultFolder;

  @Column(name = "retention_days")
  private Integer retentionDays;

  @Column(name = "notify_email")
  private Boolean notifyEmail = true;

  @Column(name = "notify_deadline")
  private Boolean notifyDeadline = true;

  @Column(columnDefinition = "TEXT")
  private String permissions;

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
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getBu() { return bu; }
  public void setBu(String bu) { this.bu = bu; }
  public String getType() { return type; }
  public void setType(String type) { this.type = type; }
  public String getInfraManagedBy() { return infraManagedBy; }
  public void setInfraManagedBy(String infraManagedBy) { this.infraManagedBy = infraManagedBy; }
  public String getSpoc() { return spoc; }
  public void setSpoc(String spoc) { this.spoc = spoc; }
  public Integer getProgress() { return progress; }
  public void setProgress(Integer progress) { this.progress = progress; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public LocalDate getStartDate() { return startDate; }
  public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
  public LocalDate getEndDate() { return endDate; }
  public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
  public Integer getTeamSize() { return teamSize; }
  public void setTeamSize(Integer teamSize) { this.teamSize = teamSize; }
  public Double getBudget() { return budget; }
  public void setBudget(Double budget) { this.budget = budget; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public String getPriority() { return priority; }
  public void setPriority(String priority) { this.priority = priority; }
  public String getDefaultFolder() { return defaultFolder; }
  public void setDefaultFolder(String defaultFolder) { this.defaultFolder = defaultFolder; }
  public Integer getRetentionDays() { return retentionDays; }
  public void setRetentionDays(Integer retentionDays) { this.retentionDays = retentionDays; }
  public Boolean getNotifyEmail() { return notifyEmail; }
  public void setNotifyEmail(Boolean notifyEmail) { this.notifyEmail = notifyEmail; }
  public Boolean getNotifyDeadline() { return notifyDeadline; }
  public void setNotifyDeadline(Boolean notifyDeadline) { this.notifyDeadline = notifyDeadline; }
  public String getPermissions() { return permissions; }
  public void setPermissions(String permissions) { this.permissions = permissions; }
  public Long getCreatedBy() { return createdBy; }
  public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
