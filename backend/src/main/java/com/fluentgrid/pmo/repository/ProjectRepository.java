package com.fluentgrid.pmo.repository;

import com.fluentgrid.pmo.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
  List<Project> findByCreatedBy(Long createdBy);

  @Query("SELECT p FROM Project p WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(:name))")
  List<Project> findByNameNormalized(@Param("name") String name);
}
