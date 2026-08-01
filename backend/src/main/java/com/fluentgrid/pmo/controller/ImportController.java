package com.fluentgrid.pmo.controller;

import com.fluentgrid.pmo.model.Deliverable;
import com.fluentgrid.pmo.model.Project;
import com.fluentgrid.pmo.repository.DeliverableRepository;
import com.fluentgrid.pmo.repository.ProjectRepository;
import com.fluentgrid.pmo.service.ProjectService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

@RestController
@RequestMapping("/api/import")
public class ImportController {

  private final ProjectRepository projectRepository;
  private final DeliverableRepository deliverableRepository;
  private final ProjectService projectService;

  public ImportController(ProjectRepository projectRepository,
      DeliverableRepository deliverableRepository,
      ProjectService projectService) {
    this.projectRepository = projectRepository;
    this.deliverableRepository = deliverableRepository;
    this.projectService = projectService;
  }

  @PostMapping("/projects-csv")
  public ResponseEntity<Map<String, Object>> importCsv(@RequestBody Map<String, String> body) {
    String csv = body.get("csv");
    if (csv == null || csv.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("error", "CSV data is required"));
    }

    List<String> errors = new ArrayList<>();
    int projectCount = 0;
    int deliverableCount = 0;

    String[] lines = csv.split("\\n");
    for (int lineNum = 0; lineNum < lines.length; lineNum++) {
      String line = lines[lineNum].trim();
      if (line.isEmpty()) continue;
      if (lineNum == 0) continue;

      String[] values = parseCsvLine(line);
      if (values.length < 2) continue;

      try {
        String first = values[0].trim().toUpperCase();
        if (first.equals("PROJECT")) {
          Project project = new Project();
          project.setName(getValue(values, 1));
          project.setBu(getValue(values, 2));
          project.setType(getValue(values, 3));
          project.setInfraManagedBy(getValue(values, 4));
          project.setSpoc(getValue(values, 5));
          project.setProgress(parseInt(getValue(values, 6)));
          project.setStatus(getValue(values, 7));
          project.setStartDate(parseDate(getValue(values, 8)));
          project.setEndDate(parseDate(getValue(values, 9)));
          project.setTeamSize(parseInt(getValue(values, 10)));
          project.setBudget(parseDouble(getValue(values, 11)));
          projectService.createProject(project);
          projectCount++;
        } else if (first.equals("DELIVERABLE")) {
          Deliverable deliverable = new Deliverable();
          deliverable.setProjectId(parseLong(getValue(values, 1)));
          deliverable.setName(getValue(values, 2));
          deliverable.setCategory(getValue(values, 3));
          deliverable.setFrequency(getValue(values, 4));
          deliverable.setExecType(getValue(values, 5));
          deliverable.setLastDate(parseDate(getValue(values, 6)));
          deliverable.setNextDate(parseDate(getValue(values, 7)));
          deliverable.setReminderDays(parseInt(getValue(values, 8)));
          deliverable.setOwner(getValue(values, 9));
          deliverable.setScope(getValue(values, 10));
          deliverable.setRemarks(getValue(values, 11));
          deliverable.setStatus(getValue(values, 12));
          deliverableRepository.save(deliverable);
          deliverableCount++;
        } else {
          Project project = new Project();
          project.setName(getValue(values, 0));
          project.setBu(getValue(values, 1));
          project.setType(getValue(values, 2));
          project.setInfraManagedBy(getValue(values, 3));
          project.setSpoc(getValue(values, 4));
          project.setStatus(getValue(values, 5));
          projectService.createProject(project);
          projectCount++;
        }
      } catch (Exception e) {
        errors.add("Line " + (lineNum + 1) + ": " + e.getMessage());
      }
    }

    Map<String, Object> result = new HashMap<>();
    result.put("projectsImported", projectCount);
    result.put("deliverablesImported", deliverableCount);
    result.put("errors", errors);
    return ResponseEntity.ok(result);
  }

  @PostMapping(value = "/projects-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Map<String, Object>> importFile(@RequestParam("file") MultipartFile file) {
    if (file.isEmpty()) {
      return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
    }

    String filename = file.getOriginalFilename();
    boolean isExcel = filename != null && (filename.endsWith(".xlsx") || filename.endsWith(".XLSX"));
    boolean isCsv = filename != null && (filename.endsWith(".csv") || filename.endsWith(".CSV"));

    if (filename == null || !(isCsv || isExcel)) {
      return ResponseEntity.badRequest().body(Map.of("error", "Only CSV and XLSX files are supported. Got: " + (filename != null ? filename : "unknown")));
    }

    if (file.getSize() > 5 * 1024 * 1024) {
      return ResponseEntity.badRequest().body(Map.of("error", "File size exceeds 5MB limit"));
    }

    List<String> errors = new ArrayList<>();
    int projectCount = 0;
    int deliverableCount = 0;

    try {
      List<String[]> rows = isExcel ? readXlsxRows(file.getInputStream()) : readCsvRows(file.getInputStream());
      for (int rowNum = 1; rowNum < rows.size(); rowNum++) {
        String[] values = rows.get(rowNum);
        if (values.length < 2) continue;
        int[] counts = processRow(values, rowNum + 1, errors);
        projectCount += counts[0];
        deliverableCount += counts[1];
      }
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(Map.of("error", "Failed to read file: " + e.getMessage()));
    }

    Map<String, Object> result = new HashMap<>();
    result.put("projectsImported", projectCount);
    result.put("deliverablesImported", deliverableCount);
    result.put("errors", errors);
    return ResponseEntity.ok(result);
  }

  private List<String[]> readCsvRows(InputStream inputStream) throws Exception {
    List<String[]> rows = new ArrayList<>();
    try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
      String line;
      while ((line = reader.readLine()) != null) {
        line = line.trim();
        if (line.isEmpty()) continue;
        rows.add(parseCsvLine(line));
      }
    }
    return rows;
  }

  private List<String[]> readXlsxRows(InputStream inputStream) throws Exception {
    List<String[]> rows = new ArrayList<>();
    DataFormatter formatter = new DataFormatter();
    try (Workbook workbook = new XSSFWorkbook(inputStream)) {
      Sheet sheet = workbook.getSheetAt(0);
      for (Row row : sheet) {
        List<String> cells = new ArrayList<>();
        for (int i = 0; i < row.getLastCellNum(); i++) {
          Cell cell = row.getCell(i);
          cells.add(cell == null ? "" : formatter.formatCellValue(cell));
        }
        rows.add(cells.toArray(new String[0]));
      }
    }
    return rows;
  }

  private int[] processRow(String[] values, int rowNum, List<String> errors) {
    int projectCount = 0;
    int deliverableCount = 0;
    try {
      String first = values[0].trim().toUpperCase();
      if (first.equals("PROJECT")) {
        Project project = new Project();
        project.setName(getValue(values, 1));
        project.setBu(getValue(values, 2));
        project.setType(getValue(values, 3));
        project.setInfraManagedBy(getValue(values, 4));
        project.setSpoc(getValue(values, 5));
        project.setProgress(parseInt(getValue(values, 6)));
        project.setStatus(getValue(values, 7));
        project.setStartDate(parseDate(getValue(values, 8)));
        project.setEndDate(parseDate(getValue(values, 9)));
        project.setTeamSize(parseInt(getValue(values, 10)));
        project.setBudget(parseDouble(getValue(values, 11)));
        projectService.createProject(project);
        projectCount++;
      } else if (first.equals("DELIVERABLE")) {
        Deliverable deliverable = new Deliverable();
        deliverable.setProjectId(parseLong(getValue(values, 1)));
        deliverable.setName(getValue(values, 2));
        deliverable.setCategory(getValue(values, 3));
        deliverable.setFrequency(getValue(values, 4));
        deliverable.setExecType(getValue(values, 5));
        deliverable.setLastDate(parseDate(getValue(values, 6)));
        deliverable.setNextDate(parseDate(getValue(values, 7)));
        deliverable.setReminderDays(parseInt(getValue(values, 8)));
        deliverable.setOwner(getValue(values, 9));
        deliverable.setScope(getValue(values, 10));
        deliverable.setRemarks(getValue(values, 11));
        deliverable.setStatus(getValue(values, 12));
        deliverableRepository.save(deliverable);
        deliverableCount++;
      } else {
        Project project = new Project();
        project.setName(getValue(values, 0));
        project.setBu(getValue(values, 1));
        project.setType(getValue(values, 2));
        project.setInfraManagedBy(getValue(values, 3));
        project.setSpoc(getValue(values, 4));
        project.setStatus(getValue(values, 5));
        projectService.createProject(project);
        projectCount++;
      }
    } catch (Exception e) {
      errors.add("Row " + rowNum + ": " + e.getMessage());
    }
    return new int[]{projectCount, deliverableCount};
  }

  private String getValue(String[] values, int index) {
    if (index < values.length) {
      String val = values[index].trim();
      return val.isEmpty() ? null : val;
    }
    return null;
  }

  private Integer parseInt(String value) {
    if (value == null) return null;
    try { return Integer.parseInt(value); } catch (NumberFormatException e) { return null; }
  }

  private Long parseLong(String value) {
    if (value == null) return null;
    try { return Long.parseLong(value); } catch (NumberFormatException e) { return null; }
  }

  private Double parseDouble(String value) {
    if (value == null) return null;
    try { return Double.parseDouble(value); } catch (NumberFormatException e) { return null; }
  }

  private LocalDate parseDate(String value) {
    if (value == null) return null;
    try { return LocalDate.parse(value); } catch (Exception e) { return null; }
  }

  private String[] parseCsvLine(String line) {
    List<String> fields = new ArrayList<>();
    boolean inQuotes = false;
    StringBuilder sb = new StringBuilder();
    for (char c : line.toCharArray()) {
      if (c == '"') {
        inQuotes = !inQuotes;
      } else if (c == ',' && !inQuotes) {
        fields.add(sb.toString());
        sb = new StringBuilder();
      } else {
        sb.append(c);
      }
    }
    fields.add(sb.toString());
    return fields.toArray(new String[0]);
  }
}
