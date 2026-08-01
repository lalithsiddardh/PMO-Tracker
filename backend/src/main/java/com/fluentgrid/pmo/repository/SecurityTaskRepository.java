package com.fluentgrid.pmo.repository;

import com.fluentgrid.pmo.model.SecurityTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SecurityTaskRepository extends JpaRepository<SecurityTask, Long> {
  List<SecurityTask> findByProjectId(Long projectId);
}
