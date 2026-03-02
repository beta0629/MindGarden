package com.coresolution.consultation.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.ConsultationRecord;
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
    
    // ==================== 🔒 tenantId 필터링 메서드 (보안) ====================
    
    /**
     * tenantId + ID로 상담일지 단건 조회 (수정/삭제/상세 시 테넌트 검증용)
     */
    Optional<ConsultationRecord> findByTenantIdAndId(String tenantId, Long id);
    
    /**
     * 상담 ID로 상담일지 조회 (tenantId 필터링)
     */
    List<ConsultationRecord> findByTenantIdAndConsultationIdAndIsDeletedFalse(String tenantId, Long consultationId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    List<ConsultationRecord> findByConsultationIdAndIsDeletedFalse(Long consultationId);
    
    /**
     * 상담사 ID로 상담일지 목록 조회 (tenantId 필터링)
     */
    Page<ConsultationRecord> findByTenantIdAndConsultantIdAndIsDeletedFalseOrderBySessionDateDesc(String tenantId, Long consultantId, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    Page<ConsultationRecord> findByConsultantIdAndIsDeletedFalseOrderBySessionDateDesc(Long consultantId, Pageable pageable);
    
    /**
     * 내담자 ID로 상담일지 목록 조회 (tenantId 필터링)
     */
    Page<ConsultationRecord> findByTenantIdAndClientIdAndIsDeletedFalseOrderBySessionDateDesc(String tenantId, Long clientId, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    Page<ConsultationRecord> findByClientIdAndIsDeletedFalseOrderBySessionDateDesc(Long clientId, Pageable pageable);
    
    /**
     * 상담사와 내담자로 상담일지 목록 조회 (tenantId 필터링)
     */
    Page<ConsultationRecord> findByTenantIdAndConsultantIdAndClientIdAndIsDeletedFalseOrderBySessionDateDesc(
        String tenantId, Long consultantId, Long clientId, Pageable pageable);
    
    /**
     * 테넌트 전체 상담일지 목록 조회 (관리자 상담 이력 전체 조회용)
     */
    Page<ConsultationRecord> findByTenantIdAndIsDeletedFalseOrderBySessionDateDesc(String tenantId, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    Page<ConsultationRecord> findByConsultantIdAndClientIdAndIsDeletedFalseOrderBySessionDateDesc(
        Long consultantId, Long clientId, Pageable pageable);
    
    /**
     * 세션 날짜 범위로 상담일지 조회 (tenantId 필터링)
     */
    List<ConsultationRecord> findByTenantIdAndConsultantIdAndSessionDateBetweenAndIsDeletedFalse(
        String tenantId, Long consultantId, LocalDate startDate, LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    List<ConsultationRecord> findByConsultantIdAndSessionDateBetweenAndIsDeletedFalse(
        Long consultantId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 만료된 상담 기록 조회 (파기용) (tenantId 필터링)
     */
    @Query("SELECT cr.id, u.name FROM ConsultationRecord cr JOIN User u ON cr.consultantId = u.id WHERE cr.tenantId = :tenantId AND cr.isDeleted = true AND cr.updatedAt < :cutoffDate")
    List<Object[]> findExpiredRecordsForDestruction(@Param("tenantId") String tenantId, @Param("cutoffDate") java.time.LocalDateTime cutoffDate);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    @Query("SELECT cr.id, u.name FROM ConsultationRecord cr JOIN User u ON cr.consultantId = u.id WHERE cr.isDeleted = true AND cr.updatedAt < ?1")
    List<Object[]> findExpiredRecordsForDestructionDeprecated(java.time.LocalDateTime cutoffDate);
    
    /**
     * 완료된 세션만 조회 (tenantId 필터링)
     */
    List<ConsultationRecord> findByTenantIdAndConsultantIdAndIsSessionCompletedTrueAndIsDeletedFalseOrderBySessionDateDesc(String tenantId, Long consultantId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    List<ConsultationRecord> findByConsultantIdAndIsSessionCompletedTrueAndIsDeletedFalseOrderBySessionDateDesc(Long consultantId);
    
    /**
     * 미완료 세션만 조회 (tenantId 필터링)
     */
    List<ConsultationRecord> findByTenantIdAndConsultantIdAndIsSessionCompletedFalseAndIsDeletedFalseOrderBySessionDateDesc(String tenantId, Long consultantId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    List<ConsultationRecord> findByConsultantIdAndIsSessionCompletedFalseAndIsDeletedFalseOrderBySessionDateDesc(Long consultantId);
    
    /**
     * 특정 상담의 상담일지 개수 조회 (tenantId 필터링)
     */
    long countByTenantIdAndConsultationIdAndIsDeletedFalse(String tenantId, Long consultationId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    long countByConsultationIdAndIsDeletedFalse(Long consultationId);
    
    /**
     * 상담사별 완료된 세션 수 조회 (tenantId 필터링)
     */
    long countByTenantIdAndConsultantIdAndIsSessionCompletedTrueAndIsDeletedFalse(String tenantId, Long consultantId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    long countByConsultantIdAndIsSessionCompletedTrueAndIsDeletedFalse(Long consultantId);
    
    /**
     * 상담사별 미완료 세션 수 조회 (tenantId 필터링)
     */
    long countByTenantIdAndConsultantIdAndIsSessionCompletedFalseAndIsDeletedFalse(String tenantId, Long consultantId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    long countByConsultantIdAndIsSessionCompletedFalseAndIsDeletedFalse(Long consultantId);
    
    /**
     * 상담사별 상담일지 개수 조회 (tenantId 필터링)
     */
    long countByTenantIdAndConsultantIdAndIsDeletedFalse(String tenantId, Long consultantId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    long countByConsultantIdAndIsDeletedFalse(Long consultantId);
    
    /**
     * 내담자별 상담일지 개수 조회 (tenantId 필터링)
     */
    long countByTenantIdAndClientIdAndIsDeletedFalse(String tenantId, Long clientId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    long countByClientIdAndIsDeletedFalse(Long clientId);
    
    /**
     * 위험도별 상담일지 조회 (tenantId 필터링)
     */
    List<ConsultationRecord> findByTenantIdAndRiskAssessmentAndIsDeletedFalseOrderBySessionDateDesc(String tenantId, String riskAssessment);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    List<ConsultationRecord> findByRiskAssessmentAndIsDeletedFalseOrderBySessionDateDesc(String riskAssessment);
    
    /**
     * 진행도 점수 범위로 상담일지 조회 (tenantId 필터링)
     */
    List<ConsultationRecord> findByTenantIdAndProgressScoreBetweenAndIsDeletedFalseOrderBySessionDateDesc(
        String tenantId, Integer minScore, Integer maxScore);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    List<ConsultationRecord> findByProgressScoreBetweenAndIsDeletedFalseOrderBySessionDateDesc(
        Integer minScore, Integer maxScore);
    
    /**
     * 상담일지 검색 (제목, 내용) (tenantId 필터링)
     */
    @Query("SELECT cr FROM ConsultationRecord cr WHERE cr.tenantId = :tenantId " +
           "AND (cr.mainIssues LIKE %:keyword% OR cr.interventionMethods LIKE %:keyword% OR " +
           "cr.clientResponse LIKE %:keyword% OR cr.nextSessionPlan LIKE %:keyword%) " +
           "AND cr.consultantId = :consultantId AND cr.isDeleted = false " +
           "ORDER BY cr.sessionDate DESC")
    Page<ConsultationRecord> searchByKeywordAndConsultantId(
        @Param("tenantId") String tenantId,
        @Param("keyword") String keyword, 
        @Param("consultantId") Long consultantId, 
        Pageable pageable);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    @Query("SELECT cr FROM ConsultationRecord cr WHERE " +
           "(cr.mainIssues LIKE %:keyword% OR cr.interventionMethods LIKE %:keyword% OR " +
           "cr.clientResponse LIKE %:keyword% OR cr.nextSessionPlan LIKE %:keyword%) " +
           "AND cr.consultantId = :consultantId AND cr.isDeleted = false " +
           "ORDER BY cr.sessionDate DESC")
    Page<ConsultationRecord> searchByKeywordAndConsultantIdDeprecated(
        @Param("keyword") String keyword, 
        @Param("consultantId") Long consultantId, 
        Pageable pageable);
    
    // 내담자별 회기별 조회 (tenantId 필터링)
    Page<ConsultationRecord> findByTenantIdAndClientIdAndSessionNumberAndIsDeletedFalseOrderBySessionDateDesc(String tenantId, Long clientId, Integer sessionNumber, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    Page<ConsultationRecord> findByClientIdAndSessionNumberAndIsDeletedFalseOrderBySessionDateDesc(Long clientId, Integer sessionNumber, Pageable pageable);
    
    List<ConsultationRecord> findByTenantIdAndClientIdAndIsDeletedFalseOrderBySessionNumberAscSessionDateAsc(String tenantId, Long clientId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    List<ConsultationRecord> findByClientIdAndIsDeletedFalseOrderBySessionNumberAscSessionDateAsc(Long clientId);
    
    @Query("SELECT cr FROM ConsultationRecord cr WHERE cr.tenantId = :tenantId AND cr.clientId = :clientId AND cr.isDeleted = false ORDER BY cr.sessionNumber ASC, cr.sessionDate ASC")
    List<ConsultationRecord> findByClientIdOrderBySession(@Param("tenantId") String tenantId, @Param("clientId") Long clientId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    @Query("SELECT cr FROM ConsultationRecord cr WHERE cr.clientId = :clientId AND cr.isDeleted = false ORDER BY cr.sessionNumber ASC, cr.sessionDate ASC")
    List<ConsultationRecord> findByClientIdOrderBySessionDeprecated(@Param("clientId") Long clientId);
    
    /**
     * 내담자별 상담일지 검색 (tenantId 필터링)
     */
    @Query("SELECT cr FROM ConsultationRecord cr WHERE cr.tenantId = :tenantId " +
           "AND (cr.mainIssues LIKE %:keyword% OR cr.interventionMethods LIKE %:keyword% OR " +
           "cr.clientResponse LIKE %:keyword% OR cr.nextSessionPlan LIKE %:keyword%) " +
           "AND cr.clientId = :clientId AND cr.isDeleted = false " +
           "ORDER BY cr.sessionDate DESC")
    Page<ConsultationRecord> searchByKeywordAndClientId(
        @Param("tenantId") String tenantId,
        @Param("keyword") String keyword, 
        @Param("clientId") Long clientId, 
        Pageable pageable);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    @Query("SELECT cr FROM ConsultationRecord cr WHERE " +
           "(cr.mainIssues LIKE %:keyword% OR cr.interventionMethods LIKE %:keyword% OR " +
           "cr.clientResponse LIKE %:keyword% OR cr.nextSessionPlan LIKE %:keyword%) " +
           "AND cr.clientId = :clientId AND cr.isDeleted = false " +
           "ORDER BY cr.sessionDate DESC")
    Page<ConsultationRecord> searchByKeywordAndClientIdDeprecated(
        @Param("keyword") String keyword, 
        @Param("clientId") Long clientId, 
        Pageable pageable);
    
    /**
     * 상담사별 최근 상담일지 조회 (tenantId 필터링)
     */
    @Query("SELECT cr FROM ConsultationRecord cr WHERE cr.tenantId = :tenantId AND cr.consultantId = :consultantId " +
           "AND cr.isDeleted = false ORDER BY cr.sessionDate DESC, cr.createdAt DESC")
    List<ConsultationRecord> findRecentByConsultantId(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    @Query("SELECT cr FROM ConsultationRecord cr WHERE cr.consultantId = :consultantId " +
           "AND cr.isDeleted = false ORDER BY cr.sessionDate DESC, cr.createdAt DESC")
    List<ConsultationRecord> findRecentByConsultantIdDeprecated(@Param("consultantId") Long consultantId, Pageable pageable);
    
    /**
     * 내담자별 최근 상담일지 조회 (tenantId 필터링)
     */
    @Query("SELECT cr FROM ConsultationRecord cr WHERE cr.tenantId = :tenantId AND cr.clientId = :clientId " +
           "AND cr.isDeleted = false ORDER BY cr.sessionDate DESC, cr.createdAt DESC")
    List<ConsultationRecord> findRecentByClientId(@Param("tenantId") String tenantId, @Param("clientId") Long clientId, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    @Query("SELECT cr FROM ConsultationRecord cr WHERE cr.clientId = :clientId " +
           "AND cr.isDeleted = false ORDER BY cr.sessionDate DESC, cr.createdAt DESC")
    List<ConsultationRecord> findRecentByClientIdDeprecated(@Param("clientId") Long clientId, Pageable pageable);
    
    /**
     * 특정 상담의 상담일지 존재 여부 확인 (tenantId 필터링)
     */
    boolean existsByTenantIdAndConsultationIdAndIsDeletedFalse(String tenantId, Long consultationId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    boolean existsByConsultationIdAndIsDeletedFalse(Long consultationId);
    
    /**
     * 상담사별 특정 날짜의 상담일지 조회 (tenantId 필터링)
     */
    List<ConsultationRecord> findByTenantIdAndConsultantIdAndSessionDateAndIsDeletedFalse(String tenantId, Long consultantId, LocalDate sessionDate);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    List<ConsultationRecord> findByConsultantIdAndSessionDateAndIsDeletedFalse(Long consultantId, LocalDate sessionDate);
    
    /**
     * 내담자별 특정 날짜의 상담일지 조회 (tenantId 필터링)
     */
    List<ConsultationRecord> findByTenantIdAndClientIdAndSessionDateAndIsDeletedFalse(String tenantId, Long clientId, LocalDate sessionDate);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    List<ConsultationRecord> findByClientIdAndSessionDateAndIsDeletedFalse(Long clientId, LocalDate sessionDate);
    
    /**
     * 상담사 ID와 세션 날짜로 상담일지 작성 여부 확인 (tenantId 필터링)
     */
    long countByTenantIdAndConsultantIdAndSessionDateAndIsDeletedFalse(String tenantId, Long consultantId, LocalDate sessionDate);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    long countByConsultantIdAndSessionDateAndIsDeletedFalse(Long consultantId, LocalDate sessionDate);
    
    // ==================== 통계 대시보드용 메서드 ====================
    
    /**
     * 최근 완료된 상담 세션 조회 (상담사명, 완료일시) (tenantId 필터링)
     */
    @Query("SELECT CONCAT(u1.name, ' - ', u2.name), cr.sessionDate FROM ConsultationRecord cr " +
           "JOIN User u1 ON cr.consultantId = u1.id " +
           "JOIN User u2 ON cr.clientId = u2.id " +
           "WHERE cr.tenantId = :tenantId AND cr.isSessionCompleted = true AND cr.isDeleted = false " +
           "ORDER BY cr.sessionDate DESC")
    List<Object[]> findRecentCompletedSessions(@Param("tenantId") String tenantId, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 상담 기록 노출!
     */
    @Deprecated
    @Query("SELECT CONCAT(u1.name, ' - ', u2.name), cr.sessionDate FROM ConsultationRecord cr " +
           "JOIN User u1 ON cr.consultantId = u1.id " +
           "JOIN User u2 ON cr.clientId = u2.id " +
           "WHERE cr.isSessionCompleted = true AND cr.isDeleted = false " +
           "ORDER BY cr.sessionDate DESC")
    List<Object[]> findRecentCompletedSessionsDeprecated(Pageable pageable);
}
