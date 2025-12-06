package com.coresolution.consultation.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.Consultation;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 상담 관리 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Repository
public interface ConsultationRepository extends BaseRepository<Consultation, Long> {
    
    /**
     * 테넌트별 내담자 ID로 상담 조회 (테넌트 필터링)
     */
    @Query("SELECT c FROM Consultation c WHERE c.tenantId = :tenantId AND c.clientId = :clientId AND c.isDeleted = false ORDER BY c.consultationDate DESC")
    List<Consultation> findByTenantIdAndClientId(@Param("tenantId") String tenantId, @Param("clientId") Long clientId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 내담자 상담 기록 노출!
     */
    @Deprecated
    @Query("SELECT c FROM Consultation c WHERE c.clientId = ?1 AND c.isDeleted = false ORDER BY c.consultationDate DESC")
    List<Consultation> findByClientId(Long clientId);
    
    /**
     * 테넌트별 내담자 ID로 상담 개수 조회 (테넌트 필터링)
     */
    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.tenantId = :tenantId AND c.clientId = :clientId AND c.isDeleted = false")
    long countByTenantIdAndClientId(@Param("tenantId") String tenantId, @Param("clientId") Long clientId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 내담자 상담 개수 노출!
     */
    @Deprecated
    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.clientId = ?1 AND c.isDeleted = false")
    long countByClientId(Long clientId);
    
    /**
     * 테넌트별 상담사 ID로 상담 조회 (테넌트 필터링)
     */
    @Query("SELECT c FROM Consultation c WHERE c.tenantId = :tenantId AND c.consultantId = :consultantId AND c.isDeleted = false ORDER BY c.consultationDate DESC")
    List<Consultation> findByTenantIdAndConsultantId(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 상담사 상담 기록 노출!
     */
    @Deprecated
    @Query("SELECT c FROM Consultation c WHERE c.consultantId = ?1 AND c.isDeleted = false ORDER BY c.consultationDate DESC")
    List<Consultation> findByConsultantId(Long consultantId);
    
    /**
     * 테넌트별 상담사 ID로 상담 개수 조회 (테넌트 필터링)
     */
    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.tenantId = :tenantId AND c.consultantId = :consultantId AND c.isDeleted = false")
    long countByTenantIdAndConsultantId(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 상담사 상담 개수 노출!
     */
    @Deprecated
    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.consultantId = ?1 AND c.isDeleted = false")
    long countByConsultantId(Long consultantId);
    
    /**
     * 상담사별 완료된 상담 건수 조회 (기간별)
     */
    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.consultantId = ?1 AND c.status = ?2 AND c.createdAt BETWEEN ?3 AND ?4 AND c.isDeleted = false")
    int countByConsultantIdAndStatusAndCreatedAtBetween(Long consultantId, String status, LocalDateTime startDateTime, LocalDateTime endDateTime);
    
    /**
     * 상태별 상담 조회 (tenantId 필터링 필수)
     */
    @Query("SELECT c FROM Consultation c WHERE c.tenantId = :tenantId AND c.status = :status AND c.isDeleted = false ORDER BY c.consultationDate DESC")
    List<Consultation> findByTenantIdAndStatus(@Param("tenantId") String tenantId, @Param("status") String status);
    
    /**
     * @Deprecated - 🚨 보안 위험: 모든 테넌트 상담 정보 노출!
     */
    @Deprecated
    @Query("SELECT c FROM Consultation c WHERE c.status = ?1 AND c.isDeleted = false ORDER BY c.consultationDate DESC")
    List<Consultation> findByStatus(String status);
    
    /**
     * 상태별 상담 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.status = ?1 AND c.isDeleted = false")
    long countByStatus(String status);
    
    /**
     * 상담 일자별 조회 (활성 상태만)
     */
    @Query("SELECT c FROM Consultation c WHERE c.consultationDate = ?1 AND c.isDeleted = false ORDER BY c.startTime")
    List<Consultation> findByConsultationDate(LocalDate date);
    
    /**
     * 상담 일자별 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.consultationDate = ?1 AND c.isDeleted = false")
    long countByConsultationDate(LocalDate date);
    
    /**
     * 특정 기간 상담 조회 (활성 상태만)
     */
    @Query("SELECT c FROM Consultation c WHERE c.consultationDate BETWEEN ?1 AND ?2 AND c.isDeleted = false ORDER BY c.consultationDate, c.startTime")
    List<Consultation> findByConsultationDateBetween(LocalDate startDate, LocalDate endDate);
    
    /**
     * 특정 기간 상담 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.consultationDate BETWEEN ?1 AND ?2 AND c.isDeleted = false")
    long countByConsultationDateBetween(LocalDate startDate, LocalDate endDate);
    
    /**
     * 테넌트별 우선순위별 상담 조회 (테넌트 필터링)
     */
    @Query("SELECT c FROM Consultation c WHERE c.tenantId = :tenantId AND c.priority = :priority AND c.isDeleted = false ORDER BY c.consultationDate DESC")
    List<Consultation> findByTenantIdAndPriority(@Param("tenantId") String tenantId, @Param("priority") String priority);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 우선순위별 상담 노출!
     */
    @Deprecated
    @Query("SELECT c FROM Consultation c WHERE c.priority = ?1 AND c.isDeleted = false ORDER BY c.consultationDate DESC")
    List<Consultation> findByPriority(String priority);
    
    /**
     * 우선순위별 상담 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.priority = ?1 AND c.isDeleted = false")
    long countByPriority(String priority);
    
    /**
     * 테넌트별 위험도별 상담 조회 (테넌트 필터링)
     */
    @Query("SELECT c FROM Consultation c WHERE c.tenantId = :tenantId AND c.riskLevel = :riskLevel AND c.isDeleted = false ORDER BY c.consultationDate DESC")
    List<Consultation> findByTenantIdAndRiskLevel(@Param("tenantId") String tenantId, @Param("riskLevel") String riskLevel);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 위험도별 상담 노출!
     */
    @Deprecated
    @Query("SELECT c FROM Consultation c WHERE c.riskLevel = ?1 AND c.isDeleted = false ORDER BY c.consultationDate DESC")
    List<Consultation> findByRiskLevel(String riskLevel);
    
    /**
     * 위험도별 상담 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.riskLevel = ?1 AND c.isDeleted = false")
    long countByRiskLevel(String riskLevel);
    
    /**
     * 테넌트별 상담 방법별 조회 (테넌트 필터링)
     */
    @Query("SELECT c FROM Consultation c WHERE c.tenantId = :tenantId AND c.consultationMethod = :method AND c.isDeleted = false ORDER BY c.consultationDate DESC")
    List<Consultation> findByTenantIdAndConsultationMethod(@Param("tenantId") String tenantId, @Param("method") String method);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 상담 방법별 상담 노출!
     */
    @Deprecated
    @Query("SELECT c FROM Consultation c WHERE c.consultationMethod = ?1 AND c.isDeleted = false ORDER BY c.consultationDate DESC")
    List<Consultation> findByConsultationMethod(String method);
    
    /**
     * 상담 방법별 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.consultationMethod = ?1 AND c.isDeleted = false")
    long countByConsultationMethod(String method);
    
    /**
     * 긴급 상담 조회 (활성 상태만)
     */
    @Query("SELECT c FROM Consultation c WHERE c.isEmergency = true AND c.isDeleted = false ORDER BY c.consultationDate, c.startTime")
    List<Consultation> findEmergencyConsultations();
    
    /**
     * 긴급 상담 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.isEmergency = true AND c.isDeleted = false")
    long countEmergencyConsultations();
    
    /**
     * 첫 상담 조회 (활성 상태만)
     */
    @Query("SELECT c FROM Consultation c WHERE c.isFirstSession = true AND c.isDeleted = false ORDER BY c.consultationDate DESC")
    List<Consultation> findFirstSessions();
    
    /**
     * 첫 상담 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.isFirstSession = true AND c.isDeleted = false")
    long countFirstSessions();
    
    /**
     * 테넌트별 긴급 상담 여부로 조회 (테넌트 필터링)
     */
    @Query("SELECT c FROM Consultation c WHERE c.tenantId = :tenantId AND c.isEmergency = :isEmergency AND c.isDeleted = false ORDER BY c.consultationDate DESC")
    List<Consultation> findByTenantIdAndIsEmergency(@Param("tenantId") String tenantId, @Param("isEmergency") Boolean isEmergency);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 긴급 상담 노출!
     */
    @Deprecated
    @Query("SELECT c FROM Consultation c WHERE c.isEmergency = ?1 AND c.isDeleted = false ORDER BY c.consultationDate DESC")
    List<Consultation> findByIsEmergency(Boolean isEmergency);
    
    /**
     * 첫 상담 여부로 조회 (활성 상태만)
     */
    @Query("SELECT c FROM Consultation c WHERE c.isFirstSession = ?1 AND c.isDeleted = false ORDER BY c.consultationDate DESC")
    List<Consultation> findByIsFirstSession(Boolean isFirstSession);
    
    /**
     * 긴급 상담 여부로 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.isEmergency = ?1 AND c.isDeleted = false")
    long countByIsEmergency(Boolean isEmergency);
    
    /**
     * 첫 상담 여부로 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.isFirstSession = ?1 AND c.isDeleted = false")
    long countByIsFirstSession(Boolean isFirstSession);
    
    /**
     * 특정 기간에 신청된 상담 조회 (활성 상태만)
     */
    @Query("SELECT c FROM Consultation c WHERE c.requestDate BETWEEN ?1 AND ?2 AND c.isDeleted = false ORDER BY c.requestDate DESC")
    List<Consultation> findByRequestDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 특정 기간에 신청된 상담 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.requestDate BETWEEN ?1 AND ?2 AND c.isDeleted = false")
    long countByRequestDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 특정 기간에 확정된 상담 조회 (활성 상태만)
     */
    @Query("SELECT c FROM Consultation c WHERE c.confirmationDate BETWEEN ?1 AND ?2 AND c.isDeleted = false ORDER BY c.confirmationDate DESC")
    List<Consultation> findByConfirmationDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 특정 기간에 확정된 상담 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.confirmationDate BETWEEN ?1 AND ?2 AND c.isDeleted = false")
    long countByConfirmationDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 특정 기간에 취소된 상담 조회 (활성 상태만)
     */
    @Query("SELECT c FROM Consultation c WHERE c.cancellationDate BETWEEN ?1 AND ?2 AND c.isDeleted = false ORDER BY c.cancellationDate DESC")
    List<Consultation> findByCancellationDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 특정 기간에 취소된 상담 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.cancellationDate BETWEEN ?1 AND ?2 AND c.isDeleted = false")
    long countByCancellationDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 세션 번호별 상담 조회 (활성 상태만)
     */
    @Query("SELECT c FROM Consultation c WHERE c.sessionNumber = ?1 AND c.isDeleted = false ORDER BY c.consultationDate DESC")
    List<Consultation> findBySessionNumber(Integer sessionNumber);
    
    /**
     * 세션 번호별 상담 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.sessionNumber = ?1 AND c.isDeleted = false")
    long countBySessionNumber(Integer sessionNumber);
    
    /**
     * 내담자별 세션 번호별 상담 조회 (활성 상태만)
     */
    @Query("SELECT c FROM Consultation c WHERE c.clientId = ?1 AND c.sessionNumber = ?2 AND c.isDeleted = false")
    Optional<Consultation> findByClientIdAndSessionNumber(Long clientId, Integer sessionNumber);
    
    /**
     * 내담자별 최대 세션 번호 조회 (활성 상태만)
     */
    @Query("SELECT MAX(c.sessionNumber) FROM Consultation c WHERE c.clientId = ?1 AND c.isDeleted = false")
    Integer findMaxSessionNumberByClientId(Long clientId);
    
    /**
     * 상담사별 최대 세션 번호 조회 (활성 상태만)
     */
    @Query("SELECT MAX(c.sessionNumber) FROM Consultation c WHERE c.consultantId = ?1 AND c.isDeleted = false")
    Integer findMaxSessionNumberByConsultantId(Long consultantId);
    
    /**
     * 내담자별 상담 통계 조회 (활성 상태만)
     */
    @Query("SELECT " +
           "COUNT(c) as totalConsultations, " +
           "COUNT(CASE WHEN c.status = 'COMPLETED' THEN 1 END) as completedCount, " +
           "COUNT(CASE WHEN c.status = 'CANCELLED' THEN 1 END) as cancelledCount, " +
           "COUNT(CASE WHEN c.isEmergency = true THEN 1 END) as emergencyCount, " +
           "AVG(c.durationMinutes) as avgDuration " +
           "FROM Consultation c WHERE c.clientId = ?1 AND c.isDeleted = false")
    Object[] getClientConsultationStatistics(Long clientId);
    
    /**
     * 상담사별 상담 통계 조회 (활성 상태만)
     */
    @Query("SELECT " +
           "COUNT(c) as totalConsultations, " +
           "COUNT(CASE WHEN c.status = 'COMPLETED' THEN 1 END) as completedCount, " +
           "COUNT(CASE WHEN c.status = 'CANCELLED' THEN 1 END) as cancelledCount, " +
           "COUNT(CASE WHEN c.isEmergency = true THEN 1 END) as emergencyCount, " +
           "AVG(c.durationMinutes) as avgDuration " +
           "FROM Consultation c WHERE c.consultantId = ?1 AND c.isDeleted = false")
    Object[] getConsultantConsultationStatistics(Long consultantId);
    
    /**
     * 전체 상담 통계 조회 (활성 상태만)
     */
    @Query("SELECT " +
           "COUNT(c) as totalConsultations, " +
           "COUNT(CASE WHEN c.status = 'REQUESTED' THEN 1 END) as requestedCount, " +
           "COUNT(CASE WHEN c.status = 'CONFIRMED' THEN 1 END) as confirmedCount, " +
           "COUNT(CASE WHEN c.status = 'IN_PROGRESS' THEN 1 END) as inProgressCount, " +
           "COUNT(CASE WHEN c.status = 'COMPLETED' THEN 1 END) as completedCount, " +
           "COUNT(CASE WHEN c.status = 'CANCELLED' THEN 1 END) as cancelledCount, " +
           "COUNT(CASE WHEN c.isEmergency = true THEN 1 END) as emergencyCount, " +
           "AVG(c.durationMinutes) as avgDuration " +
           "FROM Consultation c WHERE c.isDeleted = false")
    Object[] getOverallConsultationStatistics();
    
    /**
     * 상태별 상담 통계 조회 (활성 상태만)
     */
    @Query("SELECT c.status, COUNT(c) as count FROM Consultation c WHERE c.isDeleted = false GROUP BY c.status")
    List<Object[]> getConsultationStatisticsByStatus();
    
    /**
     * 우선순위별 상담 통계 조회 (활성 상태만)
     */
    @Query("SELECT c.priority, COUNT(c) as count FROM Consultation c WHERE c.isDeleted = false GROUP BY c.priority")
    List<Object[]> getConsultationStatisticsByPriority();
    
    /**
     * 위험도별 상담 통계 조회 (활성 상태만)
     */
    @Query("SELECT c.riskLevel, COUNT(c) as count FROM Consultation c WHERE c.isDeleted = false GROUP BY c.riskLevel")
    List<Object[]> getConsultationStatisticsByRiskLevel();
    
    /**
     * 상담 방법별 통계 조회 (활성 상태만)
     */
    @Query("SELECT c.consultationMethod, COUNT(c) as count FROM Consultation c WHERE c.isDeleted = false GROUP BY c.consultationMethod")
    List<Object[]> getConsultationStatisticsByMethod();
    
    /**
     * 일별 상담 통계 조회 (활성 상태만)
     */
    @Query("SELECT c.consultationDate, COUNT(c) as count FROM Consultation c WHERE c.isDeleted = false GROUP BY c.consultationDate ORDER BY c.consultationDate")
    List<Object[]> getConsultationStatisticsByDate();
    
    /**
     * 복합 조건으로 상담 검색 (활성 상태만)
     */
    @Query("SELECT c FROM Consultation c WHERE " +
           "(:clientId IS NULL OR c.clientId = :clientId) AND " +
           "(:consultantId IS NULL OR c.consultantId = :consultantId) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:priority IS NULL OR c.priority = :priority) AND " +
           "(:riskLevel IS NULL OR c.riskLevel = :riskLevel) AND " +
           "(:consultationMethod IS NULL OR c.consultationMethod = :consultationMethod) AND " +
           "(:isEmergency IS NULL OR c.isEmergency = :isEmergency) AND " +
           "(:isFirstSession IS NULL OR c.isFirstSession = :isFirstSession) AND " +
           "(:startDate IS NULL OR c.consultationDate >= :startDate) AND " +
           "(:endDate IS NULL OR c.consultationDate <= :endDate) AND " +
           "c.isDeleted = false " +
           "ORDER BY c.consultationDate DESC, c.startTime")
    List<Consultation> findByComplexCriteria(@Param("clientId") Long clientId,
                                           @Param("consultantId") Long consultantId,
                                           @Param("status") String status,
                                           @Param("priority") String priority,
                                           @Param("riskLevel") String riskLevel,
                                           @Param("consultationMethod") String consultationMethod,
                                           @Param("isEmergency") Boolean isEmergency,
                                           @Param("isFirstSession") Boolean isFirstSession,
                                           @Param("startDate") LocalDate startDate,
                                           @Param("endDate") LocalDate endDate);
    
    // === BaseRepository 메서드 오버라이드 ===
    // 브랜치 개념 제거: findAllByTenantIdAndBranchId 메서드는 Deprecated 처리됨 (표준화 2025-12-05)
    
    /**
     * 테넌트 ID로 활성 상담 조회
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (무시됨, 쿼리에서 사용하지 않음)
     * @return 활성 상담 목록
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link BaseRepository#findAllByTenantId(String)}를 사용하세요.
     */
    @Deprecated
    @Query("SELECT c FROM Consultation c WHERE c.tenantId = :tenantId AND c.isDeleted = false AND (:branchId IS NULL OR 1=1)")
    List<Consultation> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId);
    
    /**
     * 테넌트 ID로 활성 상담 조회 (페이징)
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (무시됨, 쿼리에서 사용하지 않음)
     * @param pageable 페이징 정보
     * @return 활성 상담 페이지
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link BaseRepository#findAllByTenantId(String, Pageable)}를 사용하세요.
     */
    @Deprecated
    @Query("SELECT c FROM Consultation c WHERE c.tenantId = :tenantId AND c.isDeleted = false AND (:branchId IS NULL OR 1=1)")
    org.springframework.data.domain.Page<Consultation> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId, org.springframework.data.domain.Pageable pageable);

}
