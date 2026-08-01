package com.fluentgrid.pmo.repository;

import com.fluentgrid.pmo.model.Risk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RiskRepository extends JpaRepository<Risk, Long> {
  List<Risk> findByProjectId(Long projectId);
}
