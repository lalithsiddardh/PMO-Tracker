package com.fluentgrid.pmo.repository;

import com.fluentgrid.pmo.model.Deliverable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliverableRepository extends JpaRepository<Deliverable, Long> {
  List<Deliverable> findByProjectId(Long projectId);
}
