package com.fluentgrid.pmo.service;

import com.fluentgrid.pmo.model.AuditLog;
import com.fluentgrid.pmo.model.FileDocument;
import com.fluentgrid.pmo.model.User;
import com.fluentgrid.pmo.repository.AuditLogRepository;
import com.fluentgrid.pmo.repository.FileDocumentRepository;
import com.fluentgrid.pmo.repository.ProjectAssignmentRepository;
import com.fluentgrid.pmo.repository.UserProjectAssignmentRepository;
import com.fluentgrid.pmo.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class FileDocumentService {

  private static final Logger log = LoggerFactory.getLogger(FileDocumentService.class);

  private final FileDocumentRepository fileDocumentRepository;
  private final AuditLogRepository auditLogRepository;
  private final FileStorageService fileStorageService;
  private final VirusScanService virusScanService;
  private final ProjectAssignmentRepository projectAssignmentRepository;
  private final UserProjectAssignmentRepository userProjectAssignmentRepository;
  private final UserRepository userRepository;

  public FileDocumentService(FileDocumentRepository fileDocumentRepository,
      AuditLogRepository auditLogRepository,
      FileStorageService fileStorageService,
      VirusScanService virusScanService,
      ProjectAssignmentRepository projectAssignmentRepository,
      UserProjectAssignmentRepository userProjectAssignmentRepository,
      UserRepository userRepository) {
    this.fileDocumentRepository = fileDocumentRepository;
    this.auditLogRepository = auditLogRepository;
    this.fileStorageService = fileStorageService;
    this.virusScanService = virusScanService;
    this.projectAssignmentRepository = projectAssignmentRepository;
    this.userProjectAssignmentRepository = userProjectAssignmentRepository;
    this.userRepository = userRepository;
  }

  public boolean canAccessProject(Long userId, Long projectId) {
    User user = userRepository.findById(userId).orElse(null);
    if (user == null) return false;
    String role = user.getRole().name();
    if ("SUPER_ADMIN".equals(role) || "ADMIN".equals(role)) return true;
    if ("PM".equals(role)) {
      return projectAssignmentRepository.existsByProjectIdAndPmId(projectId, userId);
    }
    return userProjectAssignmentRepository.existsByUserIdAndProjectId(userId, projectId);
  }

  public boolean canUploadToProject(Long userId, Long projectId) {
    User user = userRepository.findById(userId).orElse(null);
    if (user == null) return false;
    String role = user.getRole().name();
    if ("SUPER_ADMIN".equals(role) || "ADMIN".equals(role)) return true;
    if ("PM".equals(role)) {
      return projectAssignmentRepository.existsByProjectIdAndPmId(projectId, userId);
    }
    return false;
  }

  public boolean canDeleteDocument(Long userId, FileDocument doc) {
    User user = userRepository.findById(userId).orElse(null);
    if (user == null) return false;
    String role = user.getRole().name();
    if ("SUPER_ADMIN".equals(role) || "ADMIN".equals(role)) return true;
    if ("PM".equals(role)) {
      return doc.getUploadedBy().equals(userId) &&
             projectAssignmentRepository.existsByProjectIdAndPmId(doc.getProjectId(), userId);
    }
    return false;
  }

  public List<Long> getAccessibleProjectIds(Long userId) {
    User user = userRepository.findById(userId).orElse(null);
    if (user == null) return List.of();
    String role = user.getRole().name();
    if ("SUPER_ADMIN".equals(role) || "ADMIN".equals(role)) {
      return null;
    }
    List<Long> ids = new ArrayList<>();
    if ("PM".equals(role)) {
      projectAssignmentRepository.findByPmId(userId)
          .forEach(pa -> ids.add(pa.getProjectId()));
    }
    userProjectAssignmentRepository.findByUserId(userId)
        .forEach(upa -> {
          if (!ids.contains(upa.getProjectId())) ids.add(upa.getProjectId());
        });
    return ids;
  }

  @Transactional
  public FileDocument uploadFile(MultipartFile file, Long projectId, Long userId, String description) {
    if (!fileStorageService.isValidFileType(file.getOriginalFilename())) {
      throw new IllegalArgumentException("Unsupported file type: " + file.getOriginalFilename());
    }
    if (!fileStorageService.isValidFileSize(file)) {
      throw new IllegalArgumentException("File size exceeds 50MB limit");
    }
    if (!canUploadToProject(userId, projectId)) {
      throw new SecurityException("Access denied: you cannot upload documents to this project");
    }

    VirusScanService.ScanResult scanResult = virusScanService.scan(file);
    if (!scanResult.isClean()) {
      throw new SecurityException("File rejected by security scan: " + scanResult.getMessage());
    }

    String subDir = fileStorageService.getStorageDir();
    String storedName = fileStorageService.storeFile(file, subDir);
    String ext = extractExtension(file.getOriginalFilename());

    String fullPath = subDir + "/" + storedName;

    int nextVersion = 1;
    List<FileDocument> existing = fileDocumentRepository
        .findByOriginalFilenameAndProjectIdOrderByVersionNumberDesc(
            file.getOriginalFilename(), projectId);
    if (!existing.isEmpty()) {
      nextVersion = existing.get(0).getVersionNumber() + 1;
    }

    FileDocument doc = new FileDocument();
    doc.setOriginalFilename(file.getOriginalFilename());
    doc.setStoredFilename(storedName);
    doc.setFileType(ext != null ? ext.toLowerCase() : "unknown");
    doc.setFileSize(file.getSize());
    doc.setDescription(description);
    doc.setUploadTimestamp(LocalDateTime.now());
    doc.setUploadedBy(userId);
    doc.setProjectId(projectId);
    doc.setAccessScope("PROJECT");
    doc.setStoragePath(fullPath);
    doc.setVersionNumber(nextVersion);
    doc.setStatus("ACTIVE");
    FileDocument saved = fileDocumentRepository.save(doc);

    auditLogRepository.save(createAuditLog(userId, "UPLOAD", "FileDocument",
        saved.getId(), projectId, "Uploaded: " + file.getOriginalFilename() + " to project " + projectId));

    return saved;
  }

  public Path getFilePath(Long id, Long userId) {
    FileDocument doc = fileDocumentRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("File not found with id: " + id));
    if (!canAccessProject(userId, doc.getProjectId())) {
      throw new SecurityException("Access denied: you do not have access to this document");
    }
    auditLogRepository.save(createAuditLog(userId, "DOWNLOAD", "FileDocument",
        id, doc.getProjectId(), "Downloaded: " + doc.getOriginalFilename()));
    return fileStorageService.loadFile(doc.getStoragePath());
  }

  public FileDocument getFileMetadata(Long id, Long userId) {
    FileDocument doc = fileDocumentRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("File not found with id: " + id));
    if (!canAccessProject(userId, doc.getProjectId())) {
      throw new SecurityException("Access denied: you do not have access to this document");
    }
    return doc;
  }

  @Transactional
  public void deleteFile(Long id, Long userId) {
    FileDocument doc = fileDocumentRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("File not found with id: " + id));
    if (!canDeleteDocument(userId, doc)) {
      throw new SecurityException("Access denied: you cannot delete this document");
    }

    String filename = doc.getOriginalFilename();
    String storagePath = doc.getStoragePath();
    Long projectId = doc.getProjectId();

    fileDocumentRepository.delete(doc);

    try {
      fileStorageService.deleteFile(storagePath);
    } catch (Exception e) {
      log.warn("Could not delete physical file: " + storagePath, e);
    }

    auditLogRepository.save(createAuditLog(userId, "DELETE", "FileDocument",
        id, projectId, "Deleted: " + filename));
  }

  @Transactional
  public FileDocument renameFile(Long id, String newFilename, Long userId) {
    FileDocument doc = fileDocumentRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("File not found with id: " + id));
    if (!canDeleteDocument(userId, doc)) {
      throw new SecurityException("Access denied: you cannot rename this document");
    }
    if (newFilename == null || newFilename.trim().isEmpty()) {
      throw new IllegalArgumentException("Filename cannot be empty");
    }
    String ext = extractExtension(doc.getOriginalFilename());
    String newExt = extractExtension(newFilename);
    if (newExt != null && ext != null && !newExt.equalsIgnoreCase(ext)) {
      throw new IllegalArgumentException("File extension cannot be changed");
    }
    doc.setOriginalFilename(newFilename.trim());
    FileDocument saved = fileDocumentRepository.save(doc);
    auditLogRepository.save(createAuditLog(userId, "RENAME", "FileDocument",
        id, doc.getProjectId(), "Renamed to: " + newFilename.trim()));
    return saved;
  }

  public List<FileDocument> listProjectFiles(Long projectId, Long userId,
      String search, String fileType, Long uploadedBy,
      LocalDate dateFrom, LocalDate dateTo, String status) {
    if (!canAccessProject(userId, projectId)) {
      throw new SecurityException("Access denied: you do not have access to this project");
    }
    LocalDateTime dtFrom = dateFrom != null ? dateFrom.atStartOfDay() : null;
    LocalDateTime dtTo = dateTo != null ? dateTo.atTime(LocalTime.MAX) : null;
    String statusFilter = status != null ? status : "ACTIVE";
    return fileDocumentRepository.searchDocuments(
        search, projectId, fileType, uploadedBy, dtFrom, dtTo, statusFilter);
  }

  public List<FileDocument> listAllAccessibleFiles(Long userId,
      String search, String fileType, Long uploadedBy,
      LocalDate dateFrom, LocalDate dateTo, String status) {
    List<Long> projectIds = getAccessibleProjectIds(userId);
    LocalDateTime dtFrom = dateFrom != null ? dateFrom.atStartOfDay() : null;
    LocalDateTime dtTo = dateTo != null ? dateTo.atTime(LocalTime.MAX) : null;
    String statusFilter = status != null ? status : "ACTIVE";
    if (projectIds == null) {
      return fileDocumentRepository.searchDocuments(
          search, null, fileType, uploadedBy, dtFrom, dtTo, statusFilter);
    }
    if (projectIds.isEmpty()) return List.of();
    return fileDocumentRepository.searchDocumentsByProjects(
        projectIds, search, fileType, uploadedBy, dtFrom, dtTo, statusFilter);
  }

  public List<FileDocument> getVersions(String originalFilename, Long projectId, Long userId) {
    if (!canAccessProject(userId, projectId)) {
      throw new SecurityException("Access denied: you do not have access to this project");
    }
    return fileDocumentRepository
        .findByOriginalFilenameAndProjectIdOrderByVersionNumberDesc(originalFilename, projectId);
  }

  @Transactional
  public FileDocument uploadNewVersion(Long fileId, MultipartFile file, Long userId, String description) {
    FileDocument existing = fileDocumentRepository.findById(fileId)
        .orElseThrow(() -> new RuntimeException("File not found with id: " + fileId));

    if (!canUploadToProject(userId, existing.getProjectId())) {
      throw new SecurityException("Access denied: you cannot upload documents to this project");
    }

    if (!fileStorageService.isValidFileType(file.getOriginalFilename())) {
      throw new IllegalArgumentException("Unsupported file type: " + file.getOriginalFilename());
    }
    if (!fileStorageService.isValidFileSize(file)) {
      throw new IllegalArgumentException("File size exceeds 50MB limit");
    }

    VirusScanService.ScanResult scanResult = virusScanService.scan(file);
    if (!scanResult.isClean()) {
      throw new SecurityException("File rejected by security scan: " + scanResult.getMessage());
    }

    String subDir = fileStorageService.getStorageDir();
    String storedName = fileStorageService.storeFile(file, subDir);
    String ext = extractExtension(file.getOriginalFilename());
    String fullPath = subDir + "/" + storedName;

    int nextVersion = existing.getVersionNumber() + 1;

    FileDocument doc = new FileDocument();
    doc.setOriginalFilename(existing.getOriginalFilename());
    doc.setStoredFilename(storedName);
    doc.setFileType(ext != null ? ext.toLowerCase() : "unknown");
    doc.setFileSize(file.getSize());
    doc.setDescription(description != null ? description : existing.getDescription());
    doc.setUploadTimestamp(LocalDateTime.now());
    doc.setUploadedBy(userId);
    doc.setProjectId(existing.getProjectId());
    doc.setAccessScope(existing.getAccessScope());
    doc.setStoragePath(fullPath);
    doc.setVersionNumber(nextVersion);
    doc.setStatus("ACTIVE");
    FileDocument saved = fileDocumentRepository.save(doc);

    auditLogRepository.save(createAuditLog(userId, "VERSION_UPLOAD", "FileDocument",
        saved.getId(), existing.getProjectId(),
        "New version (v" + nextVersion + ") of: " + existing.getOriginalFilename()));

    return saved;
  }

  public List<AuditLog> getAuditLogs(Long fileId, Long userId) {
    FileDocument doc = fileDocumentRepository.findById(fileId)
        .orElseThrow(() -> new RuntimeException("File not found with id: " + fileId));
    if (!canAccessProject(userId, doc.getProjectId())) {
      throw new SecurityException("Access denied: you do not have access to this document");
    }
    return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc("FileDocument", fileId);
  }

  public List<AuditLog> getProjectAuditLogs(Long projectId, Long userId) {
    User user = userRepository.findById(userId).orElse(null);
    if (user == null) throw new SecurityException("Access denied");
    String role = user.getRole().name();
    if (!"SUPER_ADMIN".equals(role) && !"ADMIN".equals(role)) {
      throw new SecurityException("Access denied: only admins can view audit logs");
    }
    return auditLogRepository.findByProjectIdOrderByTimestampDesc(projectId);
  }

  private AuditLog createAuditLog(Long userId, String action, String entityType,
      Long entityId, Long projectId, String details) {
    AuditLog log = new AuditLog();
    log.setUserId(userId);
    log.setAction(action);
    log.setEntityType(entityType);
    log.setEntityId(entityId);
    log.setProjectId(projectId);
    log.setDetails(details);
    return log;
  }

  private String extractExtension(String filename) {
    if (filename == null || filename.lastIndexOf('.') == -1) return null;
    return filename.substring(filename.lastIndexOf('.') + 1);
  }
}
