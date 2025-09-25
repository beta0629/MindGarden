package com.mindgarden.consultation.repository;

import java.time.LocalDate;
import java.util.List;
import com.mindgarden.consultation.entity.ConsultationRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 상담일지 리포지토리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Repository
public interface ConsultationRecordRepository extends JpaRepository<ConsultationRecord, Long> {
    
    /**
     * 상담 ID로 상담일지 조회
     */
    List<ConsultationRecord> findByConsultationIdAndIsDeletedFalse(Long consultationId);
    
    /**
     * 상담사 ID로 상담일지 목록 조회
     */
    Page<ConsultationRecord> findByConsultantIdAndIsDeletedFalseOrderBySessionDateDesc(Long consultantId, Pageable pageable);
    
    /**
     * 내담자 ID로 상담일지 목록 조회
     */
    Page<ConsultationRecord> findByClientIdAndIsDeletedFalseOrderBySessionDateDesc(Long clientId, Pageable pageable);
    
    /**
     * 상담사와 내담자로 상담일지 목록 조회
     */
    Page<ConsultationRecord> findByConsultantIdAndClientIdAndIsDeletedFalseOrderBySessionDateDesc(
        Long consultantId, Long clientId, Pageable pageable);
    
    /**
     * 세션 날짜 범위로 상담일지 조회
     */
    List<ConsultationRecord> findByConsultantIdAndSessionDateBetweenAndIsDeletedFalse(
        Long consultantId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 만료된 상담 기록 조회 (파기용)
     */
    @Query("SELECT cr.id, u.name FROM ConsultationRecord cr JOIN User u ON cr.consultantId = u.id WHERE cr.isDeleted = true AND cr.updatedAt < ?1")
    List<Object[]> findExpiredRecordsForDestruction(java.time.LocalDateTime cutoffDate);
    
    /**
     * 완료된 세션만 조회
     */
    List<ConsultationRecord> findByConsultantIdAndIsSessionCompletedTrueAndIsDeletedFalseOrderBySessionDateDesc(Long consultantId);
    
    /**
     * 미완료 세션만 조회
     */
    List<ConsultationRecord> findByConsultantIdAndIsSessionCompletedFalseAndIsDeletedFalseOrderBySessionDateDesc(Long consultantId);
    
    /**
     * 특정 상담의 상담일지 개수 조회
     */
    long countByConsultationIdAndIsDeletedFalse(Long consultationId);
    
    /**
     * 상담사별 완료된 세션 수 조회
     */
    long countByConsultantIdAndIsSessionCompletedTrueAndIsDeletedFalse(Long consultantId);
    
    /**
     * 상담사별 미완료 세션 수 조회
     */
    long countByConsultantIdAndIsSessionCompletedFalseAndIsDeletedFalse(Long consultantId);
    
    /**
     * 상담사별 상담일지 개수 조회
     */
    long countByConsultantIdAndIsDeletedFalse(Long consultantId);
    
    /**
     * 내담자별 상담일지 개수 조회
     */
    long countByClientIdAndIsDeletedFalse(Long clientId);
    
    /**
     * 위험도별 상담일지 조회
     */
    List<ConsultationRecord> findByRiskAssessmentAndIsDeletedFalseOrderBySessionDateDesc(String riskAssessment);
    
    /**
     * 진행도 점수 범위로 상담일지 조회
     */
    List<ConsultationRecord> findByProgressScoreBetweenAndIsDeletedFalseOrderBySessionDateDesc(
        Integer minScore, Integer maxScore);
    
    /**
     * 상담일지 검색 (제목, 내용)
     */
    @Query("SELECT cr FROM ConsultationRecord cr WHERE " +
           "(cr.mainIssues LIKE %:keyword% OR cr.interventionMethods LIKE %:keyword% OR " +
           "cr.clientResponse LIKE %:keyword% OR cr.nextSessionPlan LIKE %:keyword%) " +
           "AND cr.consultantId = :consultantId AND cr.isDeleted = false " +
           "ORDER BY cr.sessionDate DESC")
    Page<ConsultationRecord> searchByKeywordAndConsultantId(
        @Param("keyword") String keyword, 
        @Param("consultantId") Long consultantId, 
        Pageable pageable);
    
    // 내담자별 회기별 조회
    Page<ConsultationRecord> findByClientIdAndSessionNumberAndIsDeletedFalseOrderBySessionDateDesc(Long clientId, Integer sessionNumber, Pageable pageable);
    List<ConsultationRecord> findByClientIdAndIsDeletedFalseOrderBySessionNumberAscSessionDateAsc(Long clientId);
    @Query("SELECT cr FROM ConsultationRecord cr WHERE cr.clientId = :clientId AND cr.isDeleted = false ORDER BY cr.sessionNumber ASC, cr.sessionDate ASC")
    List<ConsultationRecord> findByClientIdOrderBySession(@Param("clientId") Long clientId);
    
    /**
     * 내담자별 상담일지 검색
     */
    @Query("SELECT cr FROM ConsultationRecord cr WHERE " +
           "(cr.mainIssues LIKE %:keyword% OR cr.interventionMethods LIKE %:keyword% OR " +
           "cr.clientResponse LIKE %:keyword% OR cr.nextSessionPlan LIKE %:keyword%) " +
           "AND cr.clientId = :clientId AND cr.isDeleted = false " +
           "ORDER BY cr.sessionDate DESC")
    Page<ConsultationRecord> searchByKeywordAndClientId(
        @Param("keyword") String keyword, 
        @Param("clientId") Long clientId, 
        Pageable pageable);
    
    /**
     * 상담사별 최근 상담일지 조회
     */
    @Query("SELECT cr FROM ConsultationRecord cr WHERE cr.consultantId = :consultantId " +
           "AND cr.isDeleted = false ORDER BY cr.sessionDate DESC, cr.createdAt DESC")
    List<ConsultationRecord> findRecentByConsultantId(@Param("consultantId") Long consultantId, Pageable pageable);
    
    /**
     * 내담자별 최근 상담일지 조회
     */
    @Query("SELECT cr FROM ConsultationRecord cr WHERE cr.clientId = :clientId " +
           "AND cr.isDeleted = false ORDER BY cr.sessionDate DESC, cr.createdAt DESC")
    List<ConsultationRecord> findRecentByClientId(@Param("clientId") Long clientId, Pageable pageable);
    
    /**
     * 특정 상담의 상담일지 존재 여부 확인
     */
    boolean existsByConsultationIdAndIsDeletedFalse(Long consultationId);
    
    /**
     * 상담사별 특정 날짜의 상담일지 조회
     */
    List<ConsultationRecord> findByConsultantIdAndSessionDateAndIsDeletedFalse(Long consultantId, LocalDate sessionDate);
    
    /**
     * 내담자별 특정 날짜의 상담일지 조회
     */
    List<ConsultationRecord> findByClientIdAndSessionDateAndIsDeletedFalse(Long clientId, LocalDate sessionDate);
    
    /**
     * 상담사 ID와 세션 날짜로 상담일지 작성 여부 확인
     */
    long countByConsultantIdAndSessionDateAndIsDeletedFalse(Long consultantId, LocalDate sessionDate);
}
