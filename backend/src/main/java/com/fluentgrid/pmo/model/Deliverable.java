package com.fluentgrid.pmo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "deliverables")
public class Deliverable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "project_id", nullable = false)
  private Long projectId;

  @Column(nullable = false)
  private String name;

  private String category;
  private String frequency;

  @Column(name = "exec_type")
  private String execType;

  @Column(name = "last_date")
  private LocalDate lastDate;

  @Column(name = "next_date")
  private LocalDate nextDate;

  @Column(name = "reminder_days")
  private Integer reminderDays;

  private String owner;
  private String scope;
  private String remarks;
  private String status;

  @Column(name = "created_by")
  private Long createdBy;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "project_id", insertable = false, updatable = false)
  private Project project;

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = LocalDateTime.now();
  }

  @Transient
  public String getComputedStatus() {
    if (nextDate == null) return "valid";
    LocalDate today = LocalDate.now();
    if (nextDate.isBefore(today)) return "overdue";
    if (reminderDays != null && !nextDate.isAfter(today.plusDays(reminderDays))) return "due_soon";
    return "valid";
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Long getProjectId() { return projectId; }
  public void setProjectId(Long projectId) { this.projectId = projectId; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getCategory() { return category; }
  public void setCategory(String category) { this.category = category; }
  public String getFrequency() { return frequency; }
  public void setFrequency(String frequency) { this.frequency = frequency; }
  public String getExecType() { return execType; }
  public void setExecType(String execType) { this.execType = execType; }
  public LocalDate getLastDate() { return lastDate; }
  public void setLastDate(LocalDate lastDate) { this.lastDate = lastDate; }
  public LocalDate getNextDate() { return nextDate; }
  public void setNextDate(LocalDate nextDate) { this.nextDate = nextDate; }
  public Integer getReminderDays() { return reminderDays; }
  public void setReminderDays(Integer reminderDays) { this.reminderDays = reminderDays; }
  public String getOwner() { return owner; }
  public void setOwner(String owner) { this.owner = owner; }
  public String getScope() { return scope; }
  public void setScope(String scope) { this.scope = scope; }
  public String getRemarks() { return remarks; }
  public void setRemarks(String remarks) { this.remarks = remarks; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public Long getCreatedBy() { return createdBy; }
  public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
  @JsonIgnore
  public Project getProject() { return project; }
  public void setProject(Project project) { this.project = project; }
}
