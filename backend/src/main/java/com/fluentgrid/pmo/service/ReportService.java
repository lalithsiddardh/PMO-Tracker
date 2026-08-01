package com.fluentgrid.pmo.service;

import com.fluentgrid.pmo.exception.ResourceNotFoundException;
import com.fluentgrid.pmo.model.*;
import com.fluentgrid.pmo.repository.*;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;
import java.util.function.Consumer;

@Service
public class ReportService {

  private static final Color PRIMARY       = new Color(13, 110, 253);
  private static final Color TEXT_DARK     = new Color(33, 37, 41);
  private static final Color TEXT_MUTED    = new Color(108, 117, 125);
  private static final Color BG_WHITE      = new Color(255, 255, 255);
  private static final Color BORDER        = new Color(222, 226, 230);
  private static final Color GREEN         = new Color(16, 185, 129);
  private static final Color BLUE          = new Color(79, 70, 229);
  private static final Color AMBER         = new Color(245, 158, 11);
  private static final Color RED           = new Color(239, 68, 68);

  private final ProjectRepository projectRepository;
  private final FileDocumentRepository documentRepository;
  private final DeliverableRepository deliverableRepository;
  private final RiskRepository riskRepository;
  private final UserProjectAssignmentRepository assignmentRepository;
  private final AuditLogRepository auditLogRepository;
  private final UserRepository userRepository;
  private final ProjectAssignmentRepository projectAssignmentRepository;

  public ReportService(ProjectRepository projectRepository,
      FileDocumentRepository documentRepository,
      DeliverableRepository deliverableRepository,
      RiskRepository riskRepository,
      UserProjectAssignmentRepository assignmentRepository,
      AuditLogRepository auditLogRepository,
      UserRepository userRepository,
      ProjectAssignmentRepository projectAssignmentRepository) {
    this.projectRepository = projectRepository;
    this.documentRepository = documentRepository;
    this.deliverableRepository = deliverableRepository;
    this.riskRepository = riskRepository;
    this.assignmentRepository = assignmentRepository;
    this.auditLogRepository = auditLogRepository;
    this.userRepository = userRepository;
    this.projectAssignmentRepository = projectAssignmentRepository;
  }

  // ── Font helpers ──

  private Font f(int size, int style, Color color) {
    return new Font(Font.HELVETICA, size, style, color);
  }

  private Font fH1()     { return f(20, Font.BOLD, TEXT_DARK); }
  private Font fBody()   { return f(9, Font.NORMAL, TEXT_DARK); }
  private Font fSmall()  { return f(7, Font.NORMAL, TEXT_MUTED); }
  private Font fWhite()  { return f(9, Font.BOLD, BG_WHITE); }
  private Font fKpiVal() { return f(14, Font.BOLD, TEXT_DARK); }
  private Font fKpiLbl() { return f(6, Font.BOLD, TEXT_MUTED); }

  // ── Main ──

  public byte[] generateProjectPdf(Long projectId) {
    Project project = projectRepository.findById(projectId)
        .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

    List<FileDocument> documents = documentRepository
        .findByProjectIdOrderByCreatedAtDesc(projectId);
    List<Deliverable> deliverables = deliverableRepository.findByProjectId(projectId);
    List<Risk> risks = riskRepository.findByProjectId(projectId);
    List<UserProjectAssignment> assignments = assignmentRepository.findByProjectId(projectId);
    List<AuditLog> activities = auditLogRepository.findByProjectIdOrderByTimestampDesc(projectId);
    List<ProjectAssignment> projectAssignments = projectAssignmentRepository.findByProjectId(projectId);

    Map<Long, String> userNames = resolveUserNames(project, documents,
        deliverables, risks, assignments, activities, projectAssignments);

    String pmName = "—";
    if (!projectAssignments.isEmpty()) {
      pmName = userNames.getOrDefault(projectAssignments.get(0).getPmId(),
          "User #" + projectAssignments.get(0).getPmId());
    }

    int docCount = documents.size();
    int delCount = deliverables.size();
    int teamCount = assignments.size();
    int riskCount = risks.size();
    int actCount = activities.size();

    long completed = deliverables.stream()
        .filter(d -> "DONE".equalsIgnoreCase(d.getStatus()) || "COMPLETED".equalsIgnoreCase(d.getStatus()))
        .count();
    long inProgress = deliverables.stream()
        .filter(d -> "IN_PROGRESS".equalsIgnoreCase(d.getStatus()) || "ACTIVE".equalsIgnoreCase(d.getStatus()))
        .count();
    long pending = deliverables.stream()
        .filter(d -> "PENDING".equalsIgnoreCase(d.getStatus()) || "PLANNED".equalsIgnoreCase(d.getStatus()) || d.getStatus() == null)
        .count();
    long delayed = deliverables.stream()
        .filter(d -> !("DONE".equalsIgnoreCase(d.getStatus()) || "COMPLETED".equalsIgnoreCase(d.getStatus()))
            && d.getNextDate() != null && d.getNextDate().isBefore(LocalDate.now()))
        .count();

    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    Document doc = new Document(PageSize.A4, 40, 40, 50, 50);
    PdfWriter writer = PdfWriter.getInstance(doc, baos);
    writer.setPageEvent(new HeaderFooter());

    doc.open();

    addPage1(doc, writer, project, pmName,
        docCount, delCount, teamCount, riskCount, actCount,
        completed, inProgress, pending, delayed);

    doc.newPage();
    addPage2(doc, assignments, userNames, deliverables, documents, risks);

    doc.newPage();
    addPage3(doc, activities, userNames, project);

    doc.close();
    return baos.toByteArray();
  }

  // ── Page 1 ──

  private void addPage1(Document doc, PdfWriter writer, Project project,
      String pmName, int docCount, int delCount, int teamCount,
      int riskCount, int actCount,
      long completed, long inProgress, long pending, long delayed) {

    PdfPTable headerBar = new PdfPTable(2);
    headerBar.setWidthPercentage(100);
    headerBar.setWidths(new float[]{4, 1});
    PdfPCell hc = new PdfPCell(new Phrase("PMO Tracker", f(11, Font.BOLD, BG_WHITE)));
    hc.setBackgroundColor(PRIMARY);
    hc.setBorder(Rectangle.NO_BORDER);
    hc.setPadding(8);
    headerBar.addCell(hc);
    PdfPCell hc2 = new PdfPCell(new Phrase("Project Report", f(9, Font.NORMAL, new Color(0x99, 0xc8, 0xff))));
    hc2.setBackgroundColor(PRIMARY);
    hc2.setHorizontalAlignment(Element.ALIGN_RIGHT);
    hc2.setBorder(Rectangle.NO_BORDER);
    hc2.setPadding(8);
    headerBar.addCell(hc2);
    doc.add(headerBar);
    addGap(doc, 12);

    Paragraph title = new Paragraph("Project Summary Report", fH1());
    title.setAlignment(Element.ALIGN_CENTER);
    doc.add(title);

    Paragraph datePara = new Paragraph(generatedDate(), f(8, Font.NORMAL, TEXT_MUTED));
    datePara.setAlignment(Element.ALIGN_CENTER);
    doc.add(datePara);
    addGap(doc, 6);
    doc.add(hr());

    addSectionCard(doc, "Project Overview", inner -> {
      PdfPTable info = new PdfPTable(4);
      info.setWidthPercentage(100);
      info.setWidths(new float[]{1.2f, 2.5f, 1.2f, 2.5f});
      addInfoRow(info, "Project Name", val(project.getName()));
      addInfoRow(info, "Business Unit", val(project.getBu()));
      addInfoRow(info, "Project Type", val(project.getType()));
      addInfoRow(info, "Project Manager", val(pmName));
      addInfoRow(info, "Status", val(project.getStatus()));
      addInfoRow(info, "Priority", val(project.getPriority()));
      addInfoRow(info, "Start Date", fmtDate(project.getStartDate()));
      addInfoRow(info, "End Date", fmtDate(project.getEndDate()));
      inner.addElement(info);
    });

    addSectionCard(doc, "Key Performance Indicators", inner -> {
      PdfPTable kpi = new PdfPTable(5);
      kpi.setWidthPercentage(100);
      kpi.setWidths(new float[]{1, 1, 1, 1, 1});
      kpi.addCell(kpiCell("Documents", String.valueOf(docCount), GREEN));
      kpi.addCell(kpiCell("Deliverables", String.valueOf(delCount), BLUE));
      kpi.addCell(kpiCell("Team Members", String.valueOf(teamCount), PRIMARY));
      kpi.addCell(kpiCell("Risks", String.valueOf(riskCount), AMBER));
      kpi.addCell(kpiCell("Activities", String.valueOf(actCount), new Color(139, 92, 246)));
      inner.addElement(kpi);
    });

    addSectionCard(doc, "Project Progress", inner -> {
      int pct = project.getProgress() != null ? project.getProgress() : 0;
      PdfPTable wrap = new PdfPTable(1);
      wrap.setWidthPercentage(100);
      PdfPCell pCell = new PdfPCell();
      pCell.setBorder(Rectangle.NO_BORDER);
      pCell.setPadding(0);
      pCell.setFixedHeight(30);
      pCell.setCellEvent(new ProgressBarEvent(pct, 500));
      wrap.addCell(pCell);
      inner.addElement(wrap);

      Paragraph pctText = new Paragraph(pct + "% Complete", fBody());
      pctText.setIndentationLeft(2);
      inner.addElement(pctText);
    });

    long total = completed + inProgress + pending + delayed;
    if (total > 0) {
      addSectionCard(doc, "Deliverable Status Breakdown", inner -> {
        PdfPTable pieRow = new PdfPTable(2);
        pieRow.setWidthPercentage(100);
        pieRow.setWidths(new float[]{2, 1});

        PdfPCell pieCell = new PdfPCell();
        pieCell.setBorder(Rectangle.NO_BORDER);
        pieCell.setFixedHeight(160);
        pieCell.setCellEvent(new PieChartEvent(completed, inProgress, pending, delayed, total));
        pieRow.addCell(pieCell);

        PdfPCell legCell = new PdfPCell();
        legCell.setBorder(Rectangle.NO_BORDER);
        legCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        legCell.addElement(legendItem(GREEN, "Completed", completed));
        legCell.addElement(legendItem(BLUE, "In Progress", inProgress));
        legCell.addElement(legendItem(AMBER, "Pending", pending));
        legCell.addElement(legendItem(RED, "Delayed", delayed));
        pieRow.addCell(legCell);

        inner.addElement(pieRow);
      });
    }
  }

  // ── Page 2 ──

  private void addPage2(Document doc,
      List<UserProjectAssignment> assignments,
      Map<Long, String> userNames,
      List<Deliverable> deliverables,
      List<FileDocument> documents,
      List<Risk> risks) {

    addSectionCard(doc, "Team Members", inner -> {
      if (assignments.isEmpty()) { inner.addElement(noRecords()); return; }
      PdfPTable t = newTable(new float[]{2.5f, 2, 2, 1.5f});
      tableHeader(t, new String[]{"Name", "Role", "Department", "Status"});
      for (int i = 0; i < assignments.size(); i++) {
        UserProjectAssignment a = assignments.get(i);
        String name = userNames.getOrDefault(a.getUserId(), "User #" + a.getUserId());
        User user = userRepository.findById(a.getUserId()).orElse(null);
        String role = user != null ? user.getRole().name() : "—";
        String status = user != null ? user.getStatus().name() : "—";
        addRow(t, i % 2 == 1, name, role, role, status);
      }
      inner.addElement(t);
    });

    addSectionCard(doc, "Deliverables", inner -> {
      if (deliverables.isEmpty()) { inner.addElement(noRecords()); return; }
      PdfPTable t = newTable(new float[]{3, 1.8f, 1.5f, 1.2f, 1.2f});
      tableHeader(t, new String[]{"Title", "Due Date", "Owner", "Priority", "Status"});
      for (int i = 0; i < deliverables.size(); i++) {
        Deliverable d = deliverables.get(i);
        String owner = resolveOwner(d.getOwner(), userNames);
        addRow(t, i % 2 == 1, d.getName(), fmtDate(d.getNextDate()), owner,
            val(d.getStatus() != null ? d.getStatus() : d.getComputedStatus()));
      }
      inner.addElement(t);
    });

    addSectionCard(doc, "Documents", inner -> {
      if (documents.isEmpty()) { inner.addElement(noRecords()); return; }
      PdfPTable t = newTable(new float[]{3, 0.8f, 1.5f, 1.8f, 1.2f});
      tableHeader(t, new String[]{"Document Name", "Version", "Uploaded By", "Upload Date", "Status"});
      for (int i = 0; i < documents.size(); i++) {
        FileDocument d = documents.get(i);
        String uploader = userNames.getOrDefault(d.getUploadedBy(), "User #" + d.getUploadedBy());
        addRow(t, i % 2 == 1, d.getOriginalFilename(),
            "v" + (d.getVersionNumber() != null ? d.getVersionNumber() : 1),
            uploader, fmtDateTime(d.getUploadTimestamp()),
            d.getStatus() != null ? d.getStatus() : "ACTIVE");
      }
      inner.addElement(t);
    });

    addSectionCard(doc, "Risks", inner -> {
      if (risks.isEmpty()) { inner.addElement(noRecords()); return; }
      PdfPTable t = newTable(new float[]{3, 1.2f, 1.5f, 1.2f});
      tableHeader(t, new String[]{"Risk", "Severity", "Owner", "Status"});
      for (int i = 0; i < risks.size(); i++) {
        Risk r = risks.get(i);
        String owner = resolveOwner(r.getOwner(), userNames);
        addRow(t, i % 2 == 1, r.getTitle(),
            r.getImpact() != null ? r.getImpact() : "—",
            owner, r.getStatus() != null ? r.getStatus() : "OPEN");
      }
      inner.addElement(t);
    });
  }

  // ── Page 3 ──

  private void addPage3(Document doc, List<AuditLog> activities,
      Map<Long, String> userNames, Project project) {

    addSectionCard(doc, "Recent Activity", inner -> {
      if (activities.isEmpty()) { inner.addElement(noRecords()); return; }
      PdfPTable t = newTable(new float[]{1.5f, 4, 2});
      tableHeader(t, new String[]{"User", "Action", "Timestamp"});

      int limit = Math.min(activities.size(), 30);
      for (int i = 0; i < limit; i++) {
        AuditLog a = activities.get(i);
        String userName = userNames.getOrDefault(a.getUserId(), "User #" + a.getUserId());
        String action = a.getDetails() != null ? a.getDetails()
            : a.getAction() + " " + (a.getEntityType() != null ? a.getEntityType() : "");
        String ts = a.getTimestamp() != null
            ? a.getTimestamp().format(DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm"))
            : "—";

        boolean alt = i % 2 == 1;
        addCell(t, userName, fBody(), alt);
        addCell(t, action, fBody(), alt);
        PdfPCell tc = new PdfPCell(new Phrase(ts, fSmall()));
        styleCell(tc, 4, alt);
        tc.setPadding(5);
        tc.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.addCell(tc);
      }
      inner.addElement(t);
    });

    addGap(doc, 10);
    Paragraph genNote = new Paragraph("Report generated on " + generatedDate()
        + " by PMO Tracker", fSmall());
    genNote.setAlignment(Element.ALIGN_CENTER);
    genNote.setSpacingBefore(8);
    genNote.setSpacingAfter(4);
    doc.add(genNote);
  }

  // ── Table helpers ──

  private PdfPTable newTable(float[] widths) {
    PdfPTable t = new PdfPTable(widths.length);
    t.setWidthPercentage(100);
    t.setWidths(widths);
    return t;
  }

  private void addRow(PdfPTable t, boolean alt, String... values) {
    for (String v : values) {
      addCell(t, v != null ? v : "—", fBody(), alt);
    }
  }

  private void addCell(PdfPTable t, String text, Font font, boolean alt) {
    PdfPCell c = new PdfPCell(new Phrase(text, font));
    styleCell(c, 4, alt);
    c.setPadding(5);
    t.addCell(c);
  }

  private void styleCell(PdfPCell c, float border, boolean alt) {
    c.setBorderWidth(border > 0 ? 0.4f : 0);
    if (border > 0) c.setBorderColor(BORDER);
    if (alt) c.setBackgroundColor(new Color(249, 250, 251));
  }

  private void tableHeader(PdfPTable t, String[] headers) {
    for (String h : headers) {
      PdfPCell c = new PdfPCell(new Phrase(h, fWhite()));
      c.setBackgroundColor(PRIMARY);
      c.setPadding(6);
      c.setHorizontalAlignment(Element.ALIGN_CENTER);
      c.setBorder(Rectangle.NO_BORDER);
      t.addCell(c);
    }
  }

  private void addInfoRow(PdfPTable t, String label, String value) {
    PdfPCell lc = new PdfPCell(new Phrase(label, fSmall()));
    lc.setBorder(Rectangle.NO_BORDER);
    lc.setPadding(3);
    lc.setPaddingLeft(2);
    lc.setVerticalAlignment(Element.ALIGN_MIDDLE);
    t.addCell(lc);

    PdfPCell vc = new PdfPCell(new Phrase(value != null ? value : "—", fBody()));
    vc.setBorder(Rectangle.NO_BORDER);
    vc.setPadding(3);
    vc.setVerticalAlignment(Element.ALIGN_MIDDLE);
    t.addCell(vc);
  }

  // ── KPI cell ──

  private PdfPCell kpiCell(String label, String value, Color accent) {
    PdfPTable inner = new PdfPTable(1);
    inner.setWidthPercentage(100);

    PdfPCell v = new PdfPCell(new Phrase(value, fKpiVal()));
    v.setBorder(Rectangle.NO_BORDER);
    v.setHorizontalAlignment(Element.ALIGN_CENTER);
    v.setPadding(1);
    v.setPaddingTop(3);
    inner.addCell(v);

    PdfPCell l = new PdfPCell(new Phrase(label, fKpiLbl()));
    l.setBorder(Rectangle.NO_BORDER);
    l.setHorizontalAlignment(Element.ALIGN_CENTER);
    l.setPadding(1);
    inner.addCell(l);

    PdfPCell outer = new PdfPCell(inner);
    outer.setPadding(8);
    outer.setBorderColor(new Color(222, 226, 230));
    outer.setBorderWidth(0.6f);
    outer.setFixedHeight(52);
    outer.setVerticalAlignment(Element.ALIGN_MIDDLE);
    outer.setHorizontalAlignment(Element.ALIGN_CENTER);
    return outer;
  }

  // ── Misc helpers ──

  private Paragraph noRecords() {
    Paragraph p = new Paragraph("No records available", fSmall());
    p.setAlignment(Element.ALIGN_CENTER);
    p.setSpacingBefore(8);
    p.setSpacingAfter(8);
    return p;
  }

  private void addSectionCard(Document doc, String title, Consumer<PdfPCell> body) {
    PdfPTable card = new PdfPTable(1);
    card.setWidthPercentage(100);
    card.setKeepTogether(true);
    card.setSpacingBefore(10);
    card.setSpacingAfter(4);

    PdfPCell titleCell = new PdfPCell(new Phrase(title, fWhite()));
    titleCell.setBackgroundColor(PRIMARY);
    titleCell.setBorder(Rectangle.NO_BORDER);
    titleCell.setPadding(7);
    titleCell.setPaddingLeft(10);
    card.addCell(titleCell);

    PdfPCell bodyCell = new PdfPCell();
    bodyCell.setBorder(Rectangle.NO_BORDER);
    bodyCell.setPadding(10);
    bodyCell.setPaddingTop(8);
    bodyCell.setPaddingBottom(10);
    bodyCell.setBackgroundColor(BG_WHITE);
    body.accept(bodyCell);

    card.addCell(bodyCell);
    doc.add(card);
  }

  private void addGap(Document doc, int pts) {
    Paragraph gap = new Paragraph(" ", f(1, Font.NORMAL, BG_WHITE));
    gap.setSpacingAfter(pts);
    doc.add(gap);
  }

  private Paragraph hr() {
    PdfPTable line = new PdfPTable(1);
    line.setWidthPercentage(100);
    PdfPCell c = new PdfPCell();
    c.setFixedHeight(1);
    c.setBorder(Rectangle.BOTTOM);
    c.setBorderColor(BORDER);
    c.setBorderWidth(0.6f);
    line.addCell(c);
    Paragraph w = new Paragraph();
    w.add(line);
    w.setSpacingBefore(2);
    w.setSpacingAfter(6);
    return w;
  }

  private Paragraph legendItem(Color color, String label, long count) {
    Font dotFont = f(14, Font.BOLD, color);
    Chunk dot = new Chunk("  ", dotFont);
    Paragraph p = new Paragraph();
    p.add(dot);
    p.add(new Chunk("  " + label + ": ", fBody()));
    p.add(new Chunk(String.valueOf(count), f(9, Font.BOLD, TEXT_DARK)));
    p.setLeading(18);
    return p;
  }

  // ── User name resolution ──

  private Map<Long, String> resolveUserNames(Project project,
      List<FileDocument> documents, List<Deliverable> deliverables,
      List<Risk> risks, List<UserProjectAssignment> assignments,
      List<AuditLog> activities, List<ProjectAssignment> projectAssignments) {
    Set<Long> ids = new HashSet<>();
    if (project.getCreatedBy() != null) ids.add(project.getCreatedBy());
    documents.forEach(d -> ids.add(d.getUploadedBy()));
    activities.forEach(a -> ids.add(a.getUserId()));
    assignments.forEach(a -> ids.add(a.getUserId()));
    projectAssignments.forEach(pa -> ids.add(pa.getPmId()));

    for (Deliverable d : deliverables) {
      if (d.getOwner() != null) {
        try { ids.add(Long.parseLong(d.getOwner().trim())); }
        catch (NumberFormatException ignored) {}
      }
    }
    for (Risk r : risks) {
      if (r.getOwner() != null) {
        try { ids.add(Long.parseLong(r.getOwner().trim())); }
        catch (NumberFormatException ignored) {}
      }
    }

    Map<Long, String> map = new HashMap<>();
    if (!ids.isEmpty()) {
      userRepository.findAllById(ids)
          .forEach(u -> map.put(u.getId(), u.getName()));
    }
    return map;
  }

  private String resolveOwner(String owner, Map<Long, String> userNames) {
    if (owner == null || owner.isBlank()) return "—";
    try {
      Long id = Long.parseLong(owner.trim());
      return userNames.getOrDefault(id, "User #" + id);
    } catch (NumberFormatException e) {
      return owner;
    }
  }

  private String val(String s) { return s != null && !s.isBlank() ? s : "—"; }
  private String fmtDate(LocalDate d) {
    return d != null ? d.format(DateTimeFormatter.ofPattern("MMM dd, yyyy")) : "—";
  }
  private String fmtDateTime(LocalDateTime dt) {
    return dt != null ? dt.format(DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm")) : "—";
  }
  private String generatedDate() {
    return LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' h:mm a"));
  }

  // ── Cell events ──

  static class ProgressBarEvent implements PdfPCellEvent {
    private final int pct;
    private final float width;
    ProgressBarEvent(int pct, float width) { this.pct = pct; this.width = width; }

    @Override
    public void cellLayout(PdfPCell cell, Rectangle rect, PdfContentByte[] canvases) {
      PdfContentByte cb = canvases[PdfPTable.TEXTCANVAS];
      float y = rect.getTop() - 18;
      float h = 14;
      float left = rect.getLeft() + 2;
      float w = Math.min(width, rect.getWidth() - 4);

      cb.setColorFill(new Color(229, 231, 235));
      cb.roundRectangle(left, y - h, w, h, 5);
      cb.fill();

      float fillW = w * pct / 100f;
      if (fillW > 0) {
        if (pct >= 75)      cb.setColorFill(new Color(16, 185, 129));
        else if (pct >= 40) cb.setColorFill(new Color(245, 158, 11));
        else                cb.setColorFill(new Color(239, 68, 68));
        cb.roundRectangle(left, y - h, fillW, h, 5);
        cb.fill();
      }
    }
  }

  static class PieChartEvent implements PdfPCellEvent {
    private final long completed, inProgress, pending, delayed, total;
    PieChartEvent(long c, long ip, long p, long d, long t) {
      this.completed = c; this.inProgress = ip; this.pending = p; this.delayed = d; this.total = t;
    }

    @Override
    public void cellLayout(PdfPCell cell, Rectangle rect, PdfContentByte[] canvases) {
      PdfContentByte cb = canvases[PdfPTable.TEXTCANVAS];
      float cx = rect.getLeft() + rect.getWidth() / 2;
      float cy = rect.getTop() - rect.getHeight() / 2;
      float r = Math.min(rect.getWidth(), rect.getHeight()) / 2 - 5;
      if (r < 10 || total == 0) return;

      drawSlice(cb, cx, cy, r, 0,                 completed * 360f / total, new Color(16, 185, 129));
      drawSlice(cb, cx, cy, r, completed * 360f / total, inProgress * 360f / total, new Color(79, 70, 229));
      drawSlice(cb, cx, cy, r, (completed + inProgress) * 360f / total, pending * 360f / total, new Color(245, 158, 11));
      drawSlice(cb, cx, cy, r, (completed + inProgress + pending) * 360f / total, delayed * 360f / total, new Color(239, 68, 68));
    }

    private void drawSlice(PdfContentByte cb, float cx, float cy, float r,
        float startDeg, float extentDeg, Color color) {
      if (extentDeg < 0.5f) return;
      cb.saveState();
      cb.setColorFill(color);
      cb.moveTo(cx, cy);
      float startRad = (float) Math.toRadians(startDeg);
      int seg = Math.max(3, (int) (Math.abs(extentDeg) / 4));
      float x1 = cx + r * (float) Math.cos(startRad);
      float y1 = cy + r * (float) Math.sin(startRad);
      cb.lineTo(x1, y1);
      for (int i = 1; i <= seg; i++) {
        float deg = startDeg + extentDeg * i / seg;
        float rad = (float) Math.toRadians(deg);
        cb.lineTo(cx + r * (float) Math.cos(rad), cy + r * (float) Math.sin(rad));
      }
      cb.closePath();
      cb.fill();
      cb.restoreState();
    }
  }

  // ── Header / Footer ──

  class HeaderFooter extends PdfPageEventHelper {
    @Override
    public void onEndPage(PdfWriter writer, Document doc) {
      PdfContentByte cb = writer.getDirectContent();
      String footerText = "Generated by PMO Tracker  |  Page " + writer.getPageNumber();
      ColumnText.showTextAligned(cb, Element.ALIGN_CENTER,
          new Phrase(footerText, f(7, Font.NORMAL, TEXT_MUTED)),
          (doc.left() + doc.right()) / 2, 18, 0);
    }
  }
}
