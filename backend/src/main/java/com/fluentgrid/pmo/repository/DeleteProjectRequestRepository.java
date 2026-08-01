package com.fluentgrid.pmo.repository;

import com.fluentgrid.pmo.model.DeleteProjectRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeleteProjectRequestRepository extends JpaRepository<DeleteProjectRequest, Long> {
  List<DeleteProjectRequest> findByStatus(String status);
  List<DeleteProjectRequest> findByRequestedBy(Long requestedBy);
  Optional<DeleteProjectRequest> findByProjectIdAndStatus(Long projectId, String status);
}
