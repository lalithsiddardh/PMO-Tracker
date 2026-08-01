package com.fluentgrid.pmo.repository;

import com.fluentgrid.pmo.model.ComplianceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplianceItemRepository extends JpaRepository<ComplianceItem, Long> {
  List<ComplianceItem> findByProjectId(Long projectId);
}
