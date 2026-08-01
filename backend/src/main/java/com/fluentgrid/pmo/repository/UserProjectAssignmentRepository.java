package com.fluentgrid.pmo.repository;

import com.fluentgrid.pmo.model.UserProjectAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserProjectAssignmentRepository extends JpaRepository<UserProjectAssignment, Long> {
  List<UserProjectAssignment> findByUserId(Long userId);
  List<UserProjectAssignment> findByProjectId(Long projectId);
  boolean existsByUserIdAndProjectId(Long userId, Long projectId);
}
