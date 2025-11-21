package com.coresolution.consultation.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 스케줄 리포지토리 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Repository
public interface ScheduleRepository extends BaseRepository<Schedule, Long> {

    // ==================== 상담사별 스케줄 조회 ====================
    
    /**
     * 상담사별 스케줄 조회
     */
    List<Schedule> findByConsultantId(Long consultantId);
    
    /**
     * 상담사별 스케줄 페이지네이션 조회
     */
    Page<Schedule> findByConsultantId(Long consultantId, Pageable pageable);
    
    /**
     * 상담사별 특정 날짜 스케줄 조회
     */
    List<Schedule> findByConsultantIdAndDate(Long consultantId, LocalDate date);
    
    /**
     * 상담사별 날짜 범위 스케줄 조회
     */
    List<Schedule> findByConsultantIdAndDateBetween(Long consultantId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 상담사별 특정 날짜 이후 스케줄 조회
     */
    List<Schedule> findByConsultantIdAndDateAfter(Long consultantId, LocalDate date);
    
    /**
     * 특정 날짜의 스케줄 조회 (삭제되지 않은 것만)
     */
    List<Schedule> findByDateAndIsDeletedFalse(LocalDate date);
    
    /**
     * 특정 상담사의 특정 날짜 스케줄 조회 (삭제되지 않은 것만)
     */
    List<Schedule> findByDateAndConsultantIdAndIsDeletedFalse(LocalDate date, Long consultantId);
    
    /**
     * 날짜별 지점 스케줄 조회
     */
    List<Schedule> findByDateAndBranchCode(LocalDate date, String branchCode);
    
    /**
     * 상담사별 특정 날짜 이후 스케줄 조회 (해당 날짜 포함)
     */
    List<Schedule> findByConsultantIdAndDateGreaterThanEqual(Long consultantId, LocalDate date);
    
    /**
     * 상담사별 활성 스케줄 조회 (삭제되지 않은)
     */
    List<Schedule> findByConsultantIdAndIsDeletedFalse(Long consultantId);

    // ==================== 상태별 스케줄 조회 ====================
    
    /**
     * 특정 날짜와 상태 목록으로 스케줄 조회
     */
    List<Schedule> findByDateAndStatusIn(LocalDate date, List<ScheduleStatus> statuses);
    
    // ==================== 내담자별 스케줄 조회 ====================
    
    /**
     * 내담자별 스케줄 조회
     */
    List<Schedule> findByClientId(Long clientId);
    
    /**
     * 내담자별 스케줄 페이지네이션 조회
     */
    Page<Schedule> findByClientId(Long clientId, Pageable pageable);
    
    /**
     * 내담자별 특정 날짜 스케줄 조회
     */
    List<Schedule> findByClientIdAndDate(Long clientId, LocalDate date);
    
    /**
     * 내담자별 날짜 범위 스케줄 조회
     */
    List<Schedule> findByClientIdAndDateBetween(Long clientId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 내담자별 특정 날짜 이후 스케줄 조회 (해당 날짜 포함)
     */
    List<Schedule> findByClientIdAndDateGreaterThanEqual(Long clientId, LocalDate date);
    
    /**
     * 상담사와 내담자별 특정 날짜 이후 스케줄 조회 (해당 날짜 포함)
     */
    List<Schedule> findByConsultantIdAndClientIdAndDateGreaterThanEqual(Long consultantId, Long clientId, LocalDate date);

    // ==================== 시간 충돌 검사 ====================
    
    /**
     * 특정 시간대에 겹치는 스케줄 조회 (시간 충돌 검사용)
     */
    @Query("SELECT s FROM Schedule s WHERE s.consultantId = :consultantId " +
           "AND s.date = :date " +
           "AND s.isDeleted = false " +
           "AND s.status IN ('BOOKED', 'IN_PROGRESS') " +
           "AND ((s.startTime < :endTime AND s.endTime > :startTime) " +
           "OR (s.startTime = :startTime) " +
           "OR (s.endTime = :endTime))")
    List<Schedule> findOverlappingSchedules(
        @Param("consultantId") Long consultantId,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime
    );
    
    /**
     * 특정 시간대에 겹치는 스케줄 조회 (자기 자신 제외)
     */
    @Query("SELECT s FROM Schedule s WHERE s.consultantId = :consultantId " +
           "AND s.date = :date " +
           "AND s.id != :excludeScheduleId " +
           "AND s.isDeleted = false " +
           "AND s.status IN ('BOOKED', 'IN_PROGRESS') " +
           "AND ((s.startTime < :endTime AND s.endTime > :startTime) " +
           "OR (s.startTime = :startTime) " +
           "OR (s.endTime = :endTime))")
    List<Schedule> findOverlappingSchedulesExcluding(
        @Param("consultantId") Long consultantId,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime,
        @Param("excludeScheduleId") Long excludeScheduleId
    );

    // ==================== 상태별 스케줄 조회 ====================
    
    /**
     * 상태별 스케줄 조회
     */
    List<Schedule> findByStatus(String status);
    
    /**
     * 상담사별 상태별 스케줄 조회
     */
    List<Schedule> findByConsultantIdAndStatus(Long consultantId, String status);
    
    /**
     * 상담사별 상태별 날짜 범위 스케줄 조회
     */
    List<Schedule> findByConsultantIdAndStatusAndDateBetween(Long consultantId, ScheduleStatus status, LocalDate startDate, LocalDate endDate);
    
    /**
     * 내담자별 상태별 스케줄 조회 (문자열)
     */
    List<Schedule> findByClientIdAndStatus(Long clientId, String status);
    
    /**
     * 내담자별 상태별 스케줄 조회 (enum)
     */
    List<Schedule> findByClientIdAndStatus(Long clientId, ScheduleStatus status);

    // ==================== 날짜별 스케줄 조회 ====================
    
    /**
     * 특정 날짜의 모든 스케줄 조회
     */
    List<Schedule> findByDate(LocalDate date);
    
    /**
     * 날짜 범위의 모든 스케줄 조회
     */
    List<Schedule> findByDateBetween(LocalDate startDate, LocalDate endDate);
    
    // ==================== 스케줄 타입별 조회 ====================
    
    /**
     * 스케줄 타입별 조회
     */
    List<Schedule> findByScheduleType(String scheduleType);
    
    /**
     * 상담사별 스케줄 타입별 조회
     */
    List<Schedule> findByConsultantIdAndScheduleType(Long consultantId, String scheduleType);

    // ==================== 통계 및 분석 ====================
    
    /**
     * 상담사별 스케줄 개수 조회
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.consultantId = :consultantId AND s.isDeleted = false")
    long countByConsultantId(@Param("consultantId") Long consultantId);
    
    /**
     * 내담자별 스케줄 개수 조회
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.clientId = :clientId AND s.isDeleted = false")
    long countByClientId(@Param("clientId") Long clientId);
    
    /**
     * 상담사별 특정 날짜의 스케줄 개수 조회
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.consultantId = :consultantId AND s.date = :date AND s.isDeleted = false")
    long countByConsultantIdAndDate(@Param("consultantId") Long consultantId, @Param("date") LocalDate date);

    // ==================== 통계 조회 ====================
    
    /**
     * 상담사별 스케줄 수 통계
     */
    @Query("SELECT s.consultantId, COUNT(s) FROM Schedule s WHERE s.isDeleted = false GROUP BY s.consultantId")
    List<Object[]> countSchedulesByConsultant();
    
    /**
     * 날짜별 스케줄 수 통계
     */
    @Query("SELECT s.date, COUNT(s) FROM Schedule s WHERE s.isDeleted = false AND s.date BETWEEN :startDate AND :endDate GROUP BY s.date ORDER BY s.date")
    List<Object[]> countSchedulesByDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * 상태별 스케줄 수 통계
     */
    @Query("SELECT s.status, COUNT(s) FROM Schedule s WHERE s.isDeleted = false GROUP BY s.status")
    List<Object[]> countSchedulesByStatus();

    // ==================== 자동 완료 처리 ====================
    
    /**
     * 시간이 지난 확정된 스케줄 조회 (자동 완료 처리용)
     */
    @Query("SELECT s FROM Schedule s WHERE s.date = :date " +
           "AND s.endTime < :currentTime " +
           "AND s.status = 'CONFIRMED' " +
           "AND s.isDeleted = false")
    List<Schedule> findExpiredConfirmedSchedules(
        @Param("date") LocalDate date,
        @Param("currentTime") LocalTime currentTime
    );
    
    /**
     * 특정 날짜 이전의 특정 상태 스케줄 조회 (자동 완료 처리용)
     */
    @Query("SELECT s FROM Schedule s WHERE s.date < :date " +
           "AND s.status = :status " +
           "AND s.isDeleted = false")
    List<Schedule> findByDateBeforeAndStatus(
        @Param("date") LocalDate date,
        @Param("status") ScheduleStatus status
    );

    // ==================== 오늘의 통계 ====================
    
    /**
     * 특정 날짜의 특정 상태 스케줄 개수 조회
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.date = :date AND s.status = :status AND s.isDeleted = false")
    long countByDateAndStatus(@Param("date") LocalDate date, @Param("status") ScheduleStatus status);
    
    /**
     * 특정 날짜의 스케줄 개수 조회
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.date = :date AND s.isDeleted = false")
    long countByDate(@Param("date") LocalDate date);
    
    /**
     * 특정 상태의 스케줄 개수 조회
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.status = :status AND s.isDeleted = false")
    long countByStatus(@Param("status") String status);
    
    // ==================== 날짜 범위 통계 ====================
    
    /**
     * 날짜 범위 내 스케줄 개수 조회
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.date BETWEEN :startDate AND :endDate AND s.isDeleted = false")
    long countByDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * 시작일 이후 스케줄 개수 조회
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.date >= :startDate AND s.isDeleted = false")
    long countByDateGreaterThanEqual(@Param("startDate") LocalDate startDate);
    
    /**
     * 종료일 이전 스케줄 개수 조회
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.date <= :endDate AND s.isDeleted = false")
    long countByDateLessThanEqual(@Param("endDate") LocalDate endDate);
    
    /**
     * 날짜 범위 내 특정 상태 스케줄 개수 조회
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.status = :status AND s.date BETWEEN :startDate AND :endDate AND s.isDeleted = false")
    long countByStatusAndDateBetween(@Param("status") String status, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * 시작일 이후 특정 상태 스케줄 개수 조회
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.status = :status AND s.date >= :startDate AND s.isDeleted = false")
    long countByStatusAndDateGreaterThanEqual(@Param("status") String status, @Param("startDate") LocalDate startDate);
    
    /**
     * 종료일 이전 특정 상태 스케줄 개수 조회
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.status = :status AND s.date <= :endDate AND s.isDeleted = false")
    long countByStatusAndDateLessThanEqual(@Param("status") String status, @Param("endDate") LocalDate endDate);
    
    // ==================== 상담 ID별 스케줄 조회 ====================
    
    /**
     * 상담 ID별 스케줄 조회
     */
    List<Schedule> findByConsultationId(Long consultationId);
    
    // ==================== 상세 통계 ====================
    
    /**
     * 날짜 범위 내 고유 내담자 수 조회
     */
    @Query("SELECT COUNT(DISTINCT s.clientId) FROM Schedule s WHERE s.date BETWEEN :startDate AND :endDate AND s.isDeleted = false")
    long countDistinctClientsByDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * 날짜 범위 내 고유 상담사 수 조회
     */
    @Query("SELECT COUNT(DISTINCT s.consultantId) FROM Schedule s WHERE s.date BETWEEN :startDate AND :endDate AND s.isDeleted = false")
    long countDistinctConsultantsByDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // ==================== 상담사별 오늘 통계 ====================
    
    /**
     * 특정 상담사의 특정 날짜 스케줄 개수 조회
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.consultantId = :consultantId AND s.date = :date AND s.isDeleted = false")
    long countByDateAndConsultantId(@Param("date") LocalDate date, @Param("consultantId") Long consultantId);
    
    /**
     * 특정 상담사의 특정 날짜 특정 상태 스케줄 개수 조회
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.consultantId = :consultantId AND s.date = :date AND s.status = :status AND s.isDeleted = false")
    long countByDateAndStatusAndConsultantId(@Param("date") LocalDate date, @Param("status") ScheduleStatus status, @Param("consultantId") Long consultantId);
    
    // ==================== 통계 대시보드용 메서드 ====================
    
    /**
     * 특정 날짜 이후 생성된 스케줄 수 조회
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.createdAt > ?1 AND s.isDeleted = false")
    long countByCreatedAtAfter(java.time.LocalDateTime dateTime);
    
    /**
     * 특정 날짜 이전 생성된 스케줄 수 조회
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.createdAt < ?1 AND s.isDeleted = false")
    long countByCreatedAtBefore(java.time.LocalDateTime dateTime);
    
    /**
     * 특정 기간에 생성된 스케줄 수 조회
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.createdAt BETWEEN ?1 AND ?2 AND s.isDeleted = false")
    long countByCreatedAtBetween(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);
    
    // === BaseRepository 메서드 오버라이드 ===
    // Schedule 엔티티는 branchId 필드가 없음 (branchCode만 있음)
    // findAllByTenantIdAndBranchId 메서드를 오버라이드하여 branchId를 무시하도록 함
    
    /**
     * 테넌트 ID로 활성 스케줄 조회
     * Schedule 엔티티는 branchId 필드가 없으므로 branchId를 무시
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (무시됨, 쿼리에서 사용하지 않음)
     * @return 활성 스케줄 목록
     */
    @Query("SELECT s FROM Schedule s WHERE s.tenantId = :tenantId AND s.isDeleted = false AND (:branchId IS NULL OR 1=1)")
    List<Schedule> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId);
    
    /**
     * 테넌트 ID로 활성 스케줄 조회 (페이징)
     * Schedule 엔티티는 branchId 필드가 없으므로 branchId를 무시
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (무시됨, 쿼리에서 사용하지 않음)
     * @param pageable 페이징 정보
     * @return 활성 스케줄 페이지
     */
    @Query("SELECT s FROM Schedule s WHERE s.tenantId = :tenantId AND s.isDeleted = false AND (:branchId IS NULL OR 1=1)")
    Page<Schedule> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId, Pageable pageable);
}
