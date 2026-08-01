package com.fluentgrid.pmo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

  public enum Role {
    SUPER_ADMIN, ADMIN, PM, TESTER, BA, DEVELOPER, QA, DEVOPS, DESIGNER, OTHER
  }

  public enum Status {
    PENDING_APPROVAL, ACTIVE, REJECTED, DISABLED
  }

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Column(nullable = false)
  private String name;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Role role;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Status status;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "assigned_pm_id")
  private User assignedPm;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "created_by")
  private User createdByUser;

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
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getPasswordHash() { return passwordHash; }
  public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public Role getRole() { return role; }
  public void setRole(Role role) { this.role = role; }
  public Status getStatus() { return status; }
  public void setStatus(Status status) { this.status = status; }
  @JsonIgnore
  public User getAssignedPm() { return assignedPm; }
  public void setAssignedPm(User assignedPm) { this.assignedPm = assignedPm; }
  @JsonIgnore
  public User getCreatedByUser() { return createdByUser; }
  public void setCreatedByUser(User createdByUser) { this.createdByUser = createdByUser; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
