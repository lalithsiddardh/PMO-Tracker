package com.fluentgrid.pmo.repository;

import com.fluentgrid.pmo.model.ProjectAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectAssignmentRepository extends JpaRepository<ProjectAssignment, Long> {
  List<ProjectAssignment> findByPmId(Long pmId);
  List<ProjectAssignment> findByProjectId(Long projectId);
  boolean existsByProjectIdAndPmId(Long projectId, Long pmId);
}
