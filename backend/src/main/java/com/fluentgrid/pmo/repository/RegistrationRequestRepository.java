package com.fluentgrid.pmo.repository;

import com.fluentgrid.pmo.model.RegistrationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegistrationRequestRepository extends JpaRepository<RegistrationRequest, Long> {
  List<RegistrationRequest> findByStatus(String status);
  List<RegistrationRequest> findByUserId(Long userId);
}
