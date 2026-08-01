package com.fluentgrid.pmo.repository;

import com.fluentgrid.pmo.model.FileDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FileDocumentRepository extends JpaRepository<FileDocument, Long> {

  List<FileDocument> findByProjectIdOrderByCreatedAtDesc(Long projectId);

  List<FileDocument> findByOriginalFilenameContainingIgnoreCaseOrderByCreatedAtDesc(String filename);

  List<FileDocument> findByOriginalFilenameAndProjectIdOrderByVersionNumberDesc(
      String originalFilename, Long projectId);

  @Query("SELECT f FROM FileDocument f WHERE f.projectId IN :projectIds AND " +
         "(:search IS NULL OR LOWER(f.originalFilename) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
         "(:fileType IS NULL OR f.fileType = :fileType) AND " +
         "(:uploadedBy IS NULL OR f.uploadedBy = :uploadedBy) AND " +
         "(:dateFrom IS NULL OR f.uploadTimestamp >= :dateFrom) AND " +
         "(:dateTo IS NULL OR f.uploadTimestamp <= :dateTo) AND " +
         "(:status IS NULL OR f.status = :status) " +
         "ORDER BY f.createdAt DESC")
  List<FileDocument> searchDocumentsByProjects(
      @Param("projectIds") List<Long> projectIds,
      @Param("search") String search,
      @Param("fileType") String fileType,
      @Param("uploadedBy") Long uploadedBy,
      @Param("dateFrom") LocalDateTime dateFrom,
      @Param("dateTo") LocalDateTime dateTo,
      @Param("status") String status);

  @Query("SELECT f FROM FileDocument f WHERE " +
         "(:search IS NULL OR LOWER(f.originalFilename) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
         "(:projectId IS NULL OR f.projectId = :projectId) AND " +
         "(:fileType IS NULL OR f.fileType = :fileType) AND " +
         "(:uploadedBy IS NULL OR f.uploadedBy = :uploadedBy) AND " +
         "(:dateFrom IS NULL OR f.uploadTimestamp >= :dateFrom) AND " +
         "(:dateTo IS NULL OR f.uploadTimestamp <= :dateTo) AND " +
         "(:status IS NULL OR f.status = :status) " +
         "ORDER BY f.createdAt DESC")
  List<FileDocument> searchDocuments(
      @Param("search") String search,
      @Param("projectId") Long projectId,
      @Param("fileType") String fileType,
      @Param("uploadedBy") Long uploadedBy,
      @Param("dateFrom") LocalDateTime dateFrom,
      @Param("dateTo") LocalDateTime dateTo,
      @Param("status") String status);
}
