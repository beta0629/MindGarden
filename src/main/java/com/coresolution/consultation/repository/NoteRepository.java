package com.coresolution.consultation.repository;

import java.util.List;
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
