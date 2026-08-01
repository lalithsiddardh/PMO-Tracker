package com.fluentgrid.pmo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class FileStorageService {

  @Value("${file.storage.path}")
  private String storageBasePath;

  private Path rootPath;

  @PostConstruct
  public void init() {
    rootPath = Paths.get(storageBasePath).toAbsolutePath().normalize();
    try {
      Files.createDirectories(rootPath);
    } catch (IOException e) {
      throw new RuntimeException("Could not create storage directory: " + rootPath, e);
    }
  }

  public String getStorageDir() {
    LocalDate today = LocalDate.now();
    String subDir = today.format(DateTimeFormatter.ofPattern("yyyy/MM"));
    Path dir = rootPath.resolve(subDir);
    try {
      Files.createDirectories(dir);
    } catch (IOException e) {
      throw new RuntimeException("Could not create subdirectory: " + dir, e);
    }
    return subDir;
  }

  public String storeFile(MultipartFile file, String subDir) {
    String ext = extractExtension(file.getOriginalFilename());
    String storedName = UUID.randomUUID().toString() + (ext != null ? "." + ext : "");
    Path targetPath = rootPath.resolve(subDir).resolve(storedName);
    try {
      Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
    } catch (IOException e) {
      throw new RuntimeException("Failed to store file: " + storedName, e);
    }
    return storedName;
  }

  public Path loadFile(String storagePath) {
    Path filePath = rootPath.resolve(storagePath).normalize();
    if (!filePath.startsWith(rootPath)) {
      throw new SecurityException("Cannot access file outside storage root");
    }
    if (!Files.exists(filePath)) {
      throw new RuntimeException("File not found: " + storagePath);
    }
    return filePath;
  }

  public void deleteFile(String storagePath) {
    try {
      Path filePath = rootPath.resolve(storagePath).normalize();
      if (filePath.startsWith(rootPath)) {
        Files.deleteIfExists(filePath);
      }
    } catch (IOException e) {
      throw new RuntimeException("Failed to delete file: " + storagePath, e);
    }
  }

  public boolean isValidFileType(String filename) {
    if (filename == null) return false;
    String ext = extractExtension(filename);
    if (ext == null) return false;
    return switch (ext.toLowerCase()) {
      case "pdf", "doc", "docx", "xls", "xlsx", "csv", "ppt", "pptx", "txt",
           "png", "jpg", "jpeg", "zip" -> true;
      default -> false;
    };
  }

  public boolean isValidFileSize(MultipartFile file) {
    return file.getSize() <= 50 * 1024 * 1024;
  }

  private String extractExtension(String filename) {
    if (filename == null || filename.lastIndexOf('.') == -1) return null;
    return filename.substring(filename.lastIndexOf('.') + 1);
  }
}
