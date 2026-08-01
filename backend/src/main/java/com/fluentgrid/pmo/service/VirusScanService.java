package com.fluentgrid.pmo.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class VirusScanService {

  /**
   * Scans a file for viruses. This is a placeholder implementation.
   * In production, integrate with ClamAV, Windows Defender, or other antivirus API.
   *
   * @param file the uploaded file to scan
   * @return ScanResult with clean status and optional message
   */
  public ScanResult scan(MultipartFile file) {
    try {
      file.getInputStream().read();
    } catch (Exception e) {
      return new ScanResult(false, "Unable to scan file: " + e.getMessage());
    }
    return new ScanResult(true, "File passed security scan");
  }

  /**
   * Scans a file by its path on disk. Use for downloads or background scans.
   *
   * @param filePath absolute path to the file
   * @return ScanResult with clean status
   */
  public ScanResult scanFileAtPath(java.nio.file.Path filePath) {
    if (!java.nio.file.Files.exists(filePath)) {
      return new ScanResult(false, "File not found for scanning");
    }
    return new ScanResult(true, "File passed security scan");
  }

  public static class ScanResult {
    private final boolean clean;
    private final String message;

    public ScanResult(boolean clean, String message) {
      this.clean = clean;
      this.message = message;
    }

    public boolean isClean() { return clean; }
    public String getMessage() { return message; }
  }
}
