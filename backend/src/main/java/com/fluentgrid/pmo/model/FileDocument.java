package com.fluentgrid.pmo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "file_documents")
public class FileDocument {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "original_filename", nullable = false, length = 500)
  private String originalFilename;

  @Column(name = "stored_filename", nullable = false, length = 500)
  private String storedFilename;

  @Column(name = "file_type", nullable = false, length = 50)
  private String fileType;

  @Column(name = "file_size", nullable = false)
  private Long fileSize;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(name = "upload_timestamp", nullable = false)
  private LocalDateTime uploadTimestamp;

  @Column(name = "uploaded_by", nullable = false)
  private Long uploadedBy;

  @Column(name = "project_id", nullable = false)
  private Long projectId;

  @Column(name = "access_scope", length = 20)
  private String accessScope = "PROJECT";

  @Column(name = "storage_path", nullable = false, length = 1000)
  private String storagePath;

  @Column(name = "version_number", nullable = false)
  private Integer versionNumber;

  @Column(nullable = false, length = 20)
  private String status;

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
  public String getOriginalFilename() { return originalFilename; }
  public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }
  public String getStoredFilename() { return storedFilename; }
  public void setStoredFilename(String storedFilename) { this.storedFilename = storedFilename; }
  public String getFileType() { return fileType; }
  public void setFileType(String fileType) { this.fileType = fileType; }
  public Long getFileSize() { return fileSize; }
  public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public LocalDateTime getUploadTimestamp() { return uploadTimestamp; }
  public void setUploadTimestamp(LocalDateTime uploadTimestamp) { this.uploadTimestamp = uploadTimestamp; }
  public Long getUploadedBy() { return uploadedBy; }
  public void setUploadedBy(Long uploadedBy) { this.uploadedBy = uploadedBy; }
  public Long getProjectId() { return projectId; }
  public void setProjectId(Long projectId) { this.projectId = projectId; }
  public String getAccessScope() { return accessScope; }
  public void setAccessScope(String accessScope) { this.accessScope = accessScope; }
  public String getStoragePath() { return storagePath; }
  public void setStoragePath(String storagePath) { this.storagePath = storagePath; }
  public Integer getVersionNumber() { return versionNumber; }
  public void setVersionNumber(Integer versionNumber) { this.versionNumber = versionNumber; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
