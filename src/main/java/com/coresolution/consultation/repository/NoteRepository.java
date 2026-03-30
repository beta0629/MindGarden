package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 노트 리포지토리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    
    /**
     * 테넌트·ID로 활성 노트 단건 조회
     *
     * @param tenantId 테넌트 ID
     * @param id       노트 PK
     * @return 노트 Optional
     * @author CoreSolution
     * @since 2026-03-29
     */
    @Query("SELECT n FROM Note n WHERE n.tenantId = :tenantId AND n.id = :id AND n.isDeleted = false")
    Optional<Note> findByTenantIdAndId(@Param("tenantId") String tenantId, @Param("id") Long id);
    
    List<Note> findByConsultationIdAndIsDeletedFalse(Long consultationId);
    
    List<Note> findByAuthorIdAndIsDeletedFalse(String authorId);
    
    List<Note> findByConsultationIdAndAuthorIdAndIsDeletedFalse(Long consultationId, String authorId);
    
    List<Note> findByConsultationIdAndNoteTypeAndIsDeletedFalse(Long consultationId, String noteType);
    
    List<Note> findByIsImportantAndIsDeletedFalse(Boolean isImportant);
    
    @Query("SELECT n FROM Note n WHERE n.consultationId = :consultationId AND n.isPrivate = false AND n.isDeleted = false")
    List<Note> findPublicNotesByConsultationId(@Param("consultationId") Long consultationId);
    
    @Query("SELECT n FROM Note n WHERE n.consultationId = :consultationId AND n.authorId = :authorId AND n.isDeleted = false ORDER BY n.createdAt DESC")
    List<Note> findNotesByConsultationIdAndAuthorIdOrderByCreatedAtDesc(@Param("consultationId") Long consultationId, @Param("authorId") String authorId);
}
