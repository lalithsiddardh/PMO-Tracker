package com.fluentgrid.pmo.controller;

import com.fluentgrid.pmo.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

  private final ReportService reportService;

  public ReportController(ReportService reportService) {
    this.reportService = reportService;
  }

  @GetMapping("/project/{projectId}/pdf")
  public ResponseEntity<byte[]> generateProjectReport(@PathVariable Long projectId) {
    byte[] pdf = reportService.generateProjectPdf(projectId);

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_PDF);
    headers.setContentDispositionFormData("inline", "project_report_" + projectId + ".pdf");
    headers.setContentLength(pdf.length);

    return ResponseEntity.ok()
        .headers(headers)
        .body(pdf);
  }
}
