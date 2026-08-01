package com.fluentgrid.pmo.repository;

import com.fluentgrid.pmo.model.ProjectAssignmentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectAssignmentHistoryRepository extends JpaRepository<ProjectAssignmentHistory, Long> {
  List<ProjectAssignmentHistory> findByProjectIdOrderByChangedAtDesc(Long projectId);
}
