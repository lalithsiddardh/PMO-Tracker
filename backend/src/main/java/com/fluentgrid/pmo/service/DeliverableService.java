package com.fluentgrid.pmo.service;

import com.fluentgrid.pmo.model.Deliverable;
import com.fluentgrid.pmo.repository.DeliverableRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DeliverableService {

  private final DeliverableRepository deliverableRepository;

  public DeliverableService(DeliverableRepository deliverableRepository) {
    this.deliverableRepository = deliverableRepository;
  }

  private Map<String, Object> mapDeliverable(Deliverable d) {
    Map<String, Object> map = new HashMap<>();
    map.put("id", d.getId());
    map.put("projectId", d.getProjectId());
    map.put("name", d.getName());
    map.put("category", d.getCategory());
    map.put("frequency", d.getFrequency());
    map.put("execType", d.getExecType());
    map.put("lastDate", d.getLastDate());
    map.put("nextDate", d.getNextDate());
    map.put("reminderDays", d.getReminderDays());
    map.put("owner", d.getOwner());
    map.put("scope", d.getScope());
    map.put("remarks", d.getRemarks());
    map.put("status", d.getStatus());
    map.put("computedStatus", d.getComputedStatus());
    map.put("createdBy", d.getCreatedBy());
    map.put("createdAt", d.getCreatedAt());
    map.put("updatedAt", d.getUpdatedAt());
    return map;
  }

  public List<Map<String, Object>> getAllDeliverables() {
    return deliverableRepository.findAll().stream()
        .map(this::mapDeliverable).toList();
  }

  public List<Map<String, Object>> getDeliverablesByProject(Long projectId) {
    return deliverableRepository.findByProjectId(projectId).stream()
        .map(this::mapDeliverable).toList();
  }

  public Deliverable createDeliverable(Deliverable deliverable) {
    return deliverableRepository.save(deliverable);
  }

  public Deliverable updateDeliverable(Long id, Deliverable updated) {
    Deliverable deliverable = deliverableRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Deliverable not found with id: " + id));

    if (updated.getProjectId() != null) deliverable.setProjectId(updated.getProjectId());
    if (updated.getName() != null) deliverable.setName(updated.getName());
    if (updated.getCategory() != null) deliverable.setCategory(updated.getCategory());
    if (updated.getFrequency() != null) deliverable.setFrequency(updated.getFrequency());
    if (updated.getExecType() != null) deliverable.setExecType(updated.getExecType());
    if (updated.getLastDate() != null) deliverable.setLastDate(updated.getLastDate());
    if (updated.getNextDate() != null) deliverable.setNextDate(updated.getNextDate());
    if (updated.getReminderDays() != null) deliverable.setReminderDays(updated.getReminderDays());
    if (updated.getOwner() != null) deliverable.setOwner(updated.getOwner());
    if (updated.getScope() != null) deliverable.setScope(updated.getScope());
    if (updated.getRemarks() != null) deliverable.setRemarks(updated.getRemarks());
    if (updated.getStatus() != null) deliverable.setStatus(updated.getStatus());

    return deliverableRepository.save(deliverable);
  }

  public void deleteDeliverable(Long id) {
    if (!deliverableRepository.existsById(id)) {
      throw new RuntimeException("Deliverable not found with id: " + id);
    }
    deliverableRepository.deleteById(id);
  }

  @Transactional
  public Deliverable markDone(Long id) {
    Deliverable deliverable = deliverableRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Deliverable not found with id: " + id));
    deliverable.setStatus("done");
    deliverable.setLastDate(LocalDate.now());
    return deliverableRepository.save(deliverable);
  }

  public Deliverable renewDeliverable(Long id) {
    Deliverable deliverable = deliverableRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Deliverable not found with id: " + id));

    deliverable.setLastDate(deliverable.getNextDate());
    if (deliverable.getFrequency() != null) {
      LocalDate next = deliverable.getNextDate();
      switch (deliverable.getFrequency().toLowerCase()) {
        case "daily":
          next = next.plusDays(1);
          break;
        case "weekly":
          next = next.plusWeeks(1);
          break;
        case "monthly":
          next = next.plusMonths(1);
          break;
        case "quarterly":
          next = next.plusMonths(3);
          break;
        case "yearly":
          next = next.plusYears(1);
          break;
        default:
          break;
      }
      deliverable.setNextDate(next);
    }
    return deliverableRepository.save(deliverable);
  }
}
