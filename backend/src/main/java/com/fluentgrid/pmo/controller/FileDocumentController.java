package com.fluentgrid.pmo.controller;

import com.fluentgrid.pmo.model.AuditLog;
import com.fluentgrid.pmo.model.FileDocument;
import com.fluentgrid.pmo.service.FileDocumentService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class FileDocumentController {

  private static final Logger log = LoggerFactory.getLogger(FileDocumentController.class);

  private final FileDocumentService fileDocumentService;

  private static final java.util.Set<String> PREVIEWABLE_TYPES = java.util.Set.of(
    "pdf", "png", "jpg", "jpeg", "txt", "csv"
  );

  public FileDocumentController(FileDocumentService fileDocumentService) {
    this.fileDocumentService = fileDocumentService;
  }

  @PostMapping("/projects/{projectId}/documents/upload")
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<FileDocument> uploadFile(
      @PathVariable Long projectId,
      @RequestParam("file") MultipartFile file,
      @RequestParam(required = false) String description,
      Authentication authentication) {
    log.info("UPLOAD REQUEST RECEIVED");
    Long userId = (Long) authentication.getCredentials();
    FileDocument doc = fileDocumentService.uploadFile(file, projectId, userId, description);
    return ResponseEntity.ok(doc);
  }

  @GetMapping("/documents/{id}/download")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Resource> downloadFile(
      @PathVariable Long id,
      Authentication authentication) {
    Long userId = (Long) authentication.getCredentials();
    Path filePath = fileDocumentService.getFilePath(id, userId);
    FileDocument doc = fileDocumentService.getFileMetadata(id, userId);
    Resource resource = new FileSystemResource(filePath.toFile());

    String encodedFilename = URLEncoder.encode(doc.getOriginalFilename(), StandardCharsets.UTF_8)
        .replace("+", "%20");

    return ResponseEntity.ok()
        .contentType(MediaType.APPLICATION_OCTET_STREAM)
        .header(HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename*=UTF-8''" + encodedFilename)
        .body(resource);
  }

  @GetMapping("/documents/{id}/preview")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Resource> previewFile(
      @PathVariable Long id,
      Authentication authentication) {
    Long userId = (Long) authentication.getCredentials();
    Path filePath = fileDocumentService.getFilePath(id, userId);
    FileDocument doc = fileDocumentService.getFileMetadata(id, userId);
    Resource resource = new FileSystemResource(filePath.toFile());

    String ext = doc.getFileType().toLowerCase();
    if (!PREVIEWABLE_TYPES.contains(ext)) {
      return downloadFile(id, authentication);
    }

    MediaType mediaType = switch (ext) {
      case "pdf" -> MediaType.APPLICATION_PDF;
      case "png" -> MediaType.IMAGE_PNG;
      case "jpg", "jpeg" -> MediaType.IMAGE_JPEG;
      case "txt", "csv" -> MediaType.TEXT_PLAIN;
      default -> MediaType.APPLICATION_OCTET_STREAM;
    };

    String encodedFilename = URLEncoder.encode(doc.getOriginalFilename(), StandardCharsets.UTF_8)
        .replace("+", "%20");

    return ResponseEntity.ok()
        .contentType(mediaType)
        .header(HttpHeaders.CONTENT_DISPOSITION,
            "inline; filename*=UTF-8''" + encodedFilename)
        .body(resource);
  }

  @PatchMapping("/documents/{id}/rename")
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<FileDocument> renameFile(
      @PathVariable Long id,
      @RequestBody Map<String, String> body,
      Authentication authentication) {
    Long userId = (Long) authentication.getCredentials();
    String newFilename = body.get("filename");
    if (newFilename == null || newFilename.trim().isEmpty()) {
      return ResponseEntity.badRequest().build();
    }
    FileDocument doc = fileDocumentService.renameFile(id, newFilename.trim(), userId);
    return ResponseEntity.ok(doc);
  }

  @DeleteMapping("/documents/{id}")
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<Map<String, String>> deleteFile(
      @PathVariable Long id, Authentication authentication) {
    Long userId = (Long) authentication.getCredentials();
    fileDocumentService.deleteFile(id, userId);
    return ResponseEntity.ok(Map.of("message", "Document deleted successfully"));
  }

  @GetMapping("/projects/{projectId}/documents")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<List<FileDocument>> listProjectFiles(
      @PathVariable Long projectId,
      @RequestParam(required = false) String search,
      @RequestParam(required = false) String fileType,
      @RequestParam(required = false) Long uploadedBy,
      @RequestParam(required = false) LocalDate dateFrom,
      @RequestParam(required = false) LocalDate dateTo,
      @RequestParam(required = false) String status,
      Authentication authentication) {
    Long userId = (Long) authentication.getCredentials();
    return ResponseEntity.ok(
        fileDocumentService.listProjectFiles(projectId, userId,
            search, fileType, uploadedBy, dateFrom, dateTo, status));
  }

  @GetMapping("/documents")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<List<FileDocument>> listAllAccessibleFiles(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) String fileType,
      @RequestParam(required = false) Long uploadedBy,
      @RequestParam(required = false) LocalDate dateFrom,
      @RequestParam(required = false) LocalDate dateTo,
      @RequestParam(required = false) String status,
      Authentication authentication) {
    log.info("FileDocumentController.listAllAccessibleFiles() called by: {} | authorities: {}", authentication.getPrincipal(), authentication.getAuthorities());
    Long userId = (Long) authentication.getCredentials();
    return ResponseEntity.ok(
        fileDocumentService.listAllAccessibleFiles(userId,
            search, fileType, uploadedBy, dateFrom, dateTo, status));
  }

  @GetMapping("/documents/{id}")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<FileDocument> getFileMetadata(
      @PathVariable Long id, Authentication authentication) {
    Long userId = (Long) authentication.getCredentials();
    return ResponseEntity.ok(fileDocumentService.getFileMetadata(id, userId));
  }

  @PostMapping("/documents/{id}/version")
  @PreAuthorize("hasAnyRole('PM', 'ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<FileDocument> uploadVersion(
      @PathVariable Long id,
      @RequestParam("file") MultipartFile file,
      @RequestParam(required = false) String description,
      Authentication authentication) {
    log.info("UPLOAD REQUEST RECEIVED");
    Long userId = (Long) authentication.getCredentials();
    FileDocument doc = fileDocumentService.uploadNewVersion(id, file, userId, description);
    return ResponseEntity.ok(doc);
  }

  @GetMapping("/documents/{id}/versions")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<List<FileDocument>> getVersions(
      @PathVariable Long id, Authentication authentication) {
    Long userId = (Long) authentication.getCredentials();
    FileDocument doc = fileDocumentService.getFileMetadata(id, userId);
    return ResponseEntity.ok(
        fileDocumentService.getVersions(doc.getOriginalFilename(), doc.getProjectId(), userId));
  }

  @GetMapping("/documents/{id}/audit")
  @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<List<AuditLog>> getDocumentAuditLogs(
      @PathVariable Long id, Authentication authentication) {
    Long userId = (Long) authentication.getCredentials();
    return ResponseEntity.ok(fileDocumentService.getAuditLogs(id, userId));
  }

  @GetMapping("/projects/{projectId}/documents/audit")
  @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
  public ResponseEntity<List<AuditLog>> getProjectAuditLogs(
      @PathVariable Long projectId, Authentication authentication) {
    Long userId = (Long) authentication.getCredentials();
    return ResponseEntity.ok(fileDocumentService.getProjectAuditLogs(projectId, userId));
  }
}
