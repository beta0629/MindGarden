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
/**
 * @Deprecated - 표준화 2025-12-07: branchCode 파라미터는 레거시 호환용
 */
public interface ScheduleRepository extends BaseRepository<Schedule, Long> {

    // ==================== 상담사별 스케줄 조회 ====================
    
    /**
     * 테넌트별 상담사 스케줄 조회 (테넌트 필터링)
     */
    @Query("SELECT s FROM Schedule s WHERE s.tenantId = :tenantId AND s.consultantId = :consultantId")
    List<Schedule> findByTenantIdAndConsultantId(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: consultantId만으로 모든 테넌트 접근!
     */
    @Deprecated
    List<Schedule> findByConsultantId(Long consultantId);
    
    /**
     * 테넌트별 상담사 스케줄 페이지네이션 조회 (테넌트 필터링)
     */
    @Query("SELECT s FROM Schedule s WHERE s.tenantId = :tenantId AND s.consultantId = :consultantId")
    Page<Schedule> findByTenantIdAndConsultantId(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 극도로 위험: consultantId만으로 모든 테넌트 접근!
     */
    @Deprecated
    Page<Schedule> findByConsultantId(Long consultantId, Pageable pageable);
    
    /**
     * 테넌트별 상담사의 특정 날짜 스케줄 조회 (테넌트 필터링)
     */
    @Query("SELECT s FROM Schedule s WHERE s.tenantId = :tenantId AND s.consultantId = :consultantId AND s.date = :date")
    List<Schedule> findByTenantIdAndConsultantIdAndDate(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId, @Param("date") LocalDate date);
    
    /**
     * @Deprecated - 🚨 위험: 테넌트 필터링 없이 상담사 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByConsultantIdAndDate(Long consultantId, LocalDate date);
    
    /**
     * 상담사별 날짜 범위 스케줄 조회 (tenantId 필터링)
     */
    List<Schedule> findByTenantIdAndConsultantIdAndDateBetween(String tenantId, Long consultantId, LocalDate startDate, LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByConsultantIdAndDateBetween(Long consultantId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 상담사별 특정 날짜 이후 스케줄 조회 (tenantId 필터링)
     */
    List<Schedule> findByTenantIdAndConsultantIdAndDateAfter(String tenantId, Long consultantId, LocalDate date);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByConsultantIdAndDateAfter(Long consultantId, LocalDate date);
    
    /**
     * 테넌트별 특정 날짜 스케줄 조회 (테넌트 필터링)
     */
    @Query("SELECT s FROM Schedule s WHERE s.tenantId = :tenantId AND s.date = :date AND s.isDeleted = false")
    List<Schedule> findByTenantIdAndDateAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("date") LocalDate date);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트의 특정 날짜 스케줄 노출!
     */
    @Deprecated
    List<Schedule> findByDateAndIsDeletedFalse(LocalDate date);
    
    /**
     * 테넌트별 상담사의 특정 날짜 스케줄 조회 (테넌트 필터링)
     */
    @Query("SELECT s FROM Schedule s WHERE s.tenantId = :tenantId AND s.date = :date AND s.consultantId = :consultantId AND s.isDeleted = false")
    List<Schedule> findByTenantIdAndDateAndConsultantIdAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("date") LocalDate date, @Param("consultantId") Long consultantId);
    
    /**
     * @Deprecated - 🚨 위험: 테넌트 필터링 없이 상담사 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByDateAndConsultantIdAndIsDeletedFalse(LocalDate date, Long consultantId);
    
    /**
     * 테넌트별 날짜별 스케줄 조회 (브랜치 개념 제거)
     * 
     * @param tenantId 테넌트 UUID
     * @param date 날짜
     * @return 스케줄 목록
     */
    @Query("SELECT s FROM Schedule s WHERE s.tenantId = :tenantId AND s.date = :date AND s.isDeleted = false")
    List<Schedule> findByTenantIdAndDate(@Param("tenantId") String tenantId, @Param("date") LocalDate date);
    
    /**
     * 날짜별 지점 스케줄 조회 (tenantId 필터링)
     * 
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link #findByTenantIdAndDate(String, LocalDate)}를 사용하세요.
     */
    @Deprecated
    List<Schedule> findByTenantIdAndDateAndBranchCode(String tenantId, LocalDate date, String branchCode);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByDateAndBranchCode(LocalDate date, String branchCode);
    
    /**
     * 상담사별 특정 날짜 이후 스케줄 조회 (해당 날짜 포함) (tenantId 필터링)
     */
    List<Schedule> findByTenantIdAndConsultantIdAndDateGreaterThanEqual(String tenantId, Long consultantId, LocalDate date);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByConsultantIdAndDateGreaterThanEqual(Long consultantId, LocalDate date);
    
    /**
     * 상담사별 활성 스케줄 조회 (삭제되지 않은) (tenantId 필터링)
     */
    List<Schedule> findByTenantIdAndConsultantIdAndIsDeletedFalse(String tenantId, Long consultantId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByConsultantIdAndIsDeletedFalse(Long consultantId);

    // ==================== 상태별 스케줄 조회 ====================
    
    /**
     * 특정 날짜와 상태 목록으로 스케줄 조회 (tenantId 필터링)
     */
    List<Schedule> findByTenantIdAndDateAndStatusIn(String tenantId, LocalDate date, List<ScheduleStatus> statuses);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByDateAndStatusIn(LocalDate date, List<ScheduleStatus> statuses);
    
    // ==================== 내담자별 스케줄 조회 ====================
    
    /**
     * 내담자별 스케줄 조회 (tenantId 필터링)
     */
    List<Schedule> findByTenantIdAndClientId(String tenantId, Long clientId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByClientId(Long clientId);
    
    /**
     * 내담자별 스케줄 페이지네이션 조회 (tenantId 필터링)
     */
    Page<Schedule> findByTenantIdAndClientId(String tenantId, Long clientId, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    Page<Schedule> findByClientId(Long clientId, Pageable pageable);
    
    /**
     * 내담자별 특정 날짜 스케줄 조회 (tenantId 필터링)
     */
    List<Schedule> findByTenantIdAndClientIdAndDate(String tenantId, Long clientId, LocalDate date);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByClientIdAndDate(Long clientId, LocalDate date);
    
    /**
     * 내담자별 날짜 범위 스케줄 조회 (tenantId 필터링)
     */
    List<Schedule> findByTenantIdAndClientIdAndDateBetween(String tenantId, Long clientId, LocalDate startDate, LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByClientIdAndDateBetween(Long clientId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 내담자별 특정 날짜 이후 스케줄 조회 (해당 날짜 포함) (tenantId 필터링)
     */
    List<Schedule> findByTenantIdAndClientIdAndDateGreaterThanEqual(String tenantId, Long clientId, LocalDate date);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByClientIdAndDateGreaterThanEqual(Long clientId, LocalDate date);
    
    /**
     * 상담사와 내담자별 특정 날짜 이후 스케줄 조회 (해당 날짜 포함) (tenantId 필터링)
     */
    List<Schedule> findByTenantIdAndConsultantIdAndClientIdAndDateGreaterThanEqual(String tenantId, Long consultantId, Long clientId, LocalDate date);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByConsultantIdAndClientIdAndDateGreaterThanEqual(Long consultantId, Long clientId, LocalDate date);

    // ==================== 시간 충돌 검사 ====================
    // 점유 상태: ScheduleServiceImpl.hasTimeConflict·ScheduleStatus#occupiesTimeForConflictCheck 와 동일 의미(Booked/확정 + 레거시 IN_PROGRESS).

    /**
     * 특정 시간대에 겹치는 스케줄 조회 (시간 충돌 검사용) (tenantId 필터링)
     */
    @Query("SELECT s FROM Schedule s WHERE s.tenantId = :tenantId AND s.consultantId = :consultantId " +
           "AND s.date = :date " +
           "AND s.isDeleted = false " +
           "AND s.status IN ('BOOKED', 'CONFIRMED', 'IN_PROGRESS') " +
           "AND ((s.startTime < :endTime AND s.endTime > :startTime) " +
           "OR (s.startTime = :startTime) " +
           "OR (s.endTime = :endTime))")
    List<Schedule> findOverlappingSchedules(
        @Param("tenantId") String tenantId,
        @Param("consultantId") Long consultantId,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime
    );
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT s FROM Schedule s WHERE s.consultantId = :consultantId " +
           "AND s.date = :date " +
           "AND s.isDeleted = false " +
           "AND s.status IN ('BOOKED', 'CONFIRMED', 'IN_PROGRESS') " +
           "AND ((s.startTime < :endTime AND s.endTime > :startTime) " +
           "OR (s.startTime = :startTime) " +
           "OR (s.endTime = :endTime))")
    List<Schedule> findOverlappingSchedulesDeprecated(
        @Param("consultantId") Long consultantId,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime
    );
    
    /**
     * 특정 시간대에 겹치는 스케줄 조회 (자기 자신 제외) (tenantId 필터링)
     */
    @Query("SELECT s FROM Schedule s WHERE s.tenantId = :tenantId AND s.consultantId = :consultantId " +
           "AND s.date = :date " +
           "AND s.id != :excludeScheduleId " +
           "AND s.isDeleted = false " +
           "AND s.status IN ('BOOKED', 'CONFIRMED', 'IN_PROGRESS') " +
           "AND ((s.startTime < :endTime AND s.endTime > :startTime) " +
           "OR (s.startTime = :startTime) " +
           "OR (s.endTime = :endTime))")
    List<Schedule> findOverlappingSchedulesExcluding(
        @Param("tenantId") String tenantId,
        @Param("consultantId") Long consultantId,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime,
        @Param("excludeScheduleId") Long excludeScheduleId
    );
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT s FROM Schedule s WHERE s.consultantId = :consultantId " +
           "AND s.date = :date " +
           "AND s.id != :excludeScheduleId " +
           "AND s.isDeleted = false " +
           "AND s.status IN ('BOOKED', 'CONFIRMED', 'IN_PROGRESS') " +
           "AND ((s.startTime < :endTime AND s.endTime > :startTime) " +
           "OR (s.startTime = :startTime) " +
           "OR (s.endTime = :endTime))")
    List<Schedule> findOverlappingSchedulesExcludingDeprecated(
        @Param("consultantId") Long consultantId,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime,
        @Param("excludeScheduleId") Long excludeScheduleId
    );

    // ==================== 전체 스케줄 조회 ====================
    
    /**
     * 테넌트별 전체 스케줄 조회 (tenantId 필터링)
     */
    List<Schedule> findByTenantId(String tenantId);
    
    /**
     * 테넌트별 전체 스케줄 조회 (페이징, tenantId 필터링)
     */
    org.springframework.data.domain.Page<Schedule> findByTenantId(String tenantId, org.springframework.data.domain.Pageable pageable);
    
    // ==================== 상태별 스케줄 조회 ====================
    
    /**
     * 상태별 스케줄 조회 (tenantId 필터링)
     */
    List<Schedule> findByTenantIdAndStatus(String tenantId, String status);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByStatus(String status);
    
    /**
     * 상담사별 상태별 스케줄 조회 (tenantId 필터링)
     */
    List<Schedule> findByTenantIdAndConsultantIdAndStatus(String tenantId, Long consultantId, String status);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByConsultantIdAndStatus(Long consultantId, String status);
    
    /**
     * 상담사별 상태별 날짜 범위 스케줄 조회 (tenantId 필터링)
     */
    List<Schedule> findByTenantIdAndConsultantIdAndStatusAndDateBetween(String tenantId, Long consultantId, ScheduleStatus status, LocalDate startDate, LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByConsultantIdAndStatusAndDateBetween(Long consultantId, ScheduleStatus status, LocalDate startDate, LocalDate endDate);
    
    /**
     * 내담자별 상태별 스케줄 조회 (문자열) (tenantId 필터링)
     */
    List<Schedule> findByTenantIdAndClientIdAndStatus(String tenantId, Long clientId, String status);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByClientIdAndStatus(Long clientId, String status);
    
    /**
     * 내담자별 상태별 스케줄 조회 (enum) (tenantId 필터링)
     */
    List<Schedule> findByTenantIdAndClientIdAndStatus(String tenantId, Long clientId, ScheduleStatus status);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByClientIdAndStatus(Long clientId, ScheduleStatus status);

    // ==================== 날짜별 스케줄 조회 ====================
    
    // findByTenantIdAndDate 메서드는 위에 이미 정의되어 있음 (116번째 줄)
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByDate(LocalDate date);
    
    /**
     * 날짜 범위의 모든 스케줄 조회 (tenantId 필터링)
     */
    List<Schedule> findByTenantIdAndDateBetween(String tenantId, LocalDate startDate, LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByDateBetween(LocalDate startDate, LocalDate endDate);
    
    // ==================== 스케줄 타입별 조회 ====================
    
    /**
     * 스케줄 타입별 조회 (tenantId 필터링)
     */
    List<Schedule> findByTenantIdAndScheduleType(String tenantId, String scheduleType);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByScheduleType(String scheduleType);
    
    /**
     * 상담사별 스케줄 타입별 조회 (tenantId 필터링)
     */
    List<Schedule> findByTenantIdAndConsultantIdAndScheduleType(String tenantId, Long consultantId, String scheduleType);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByConsultantIdAndScheduleType(Long consultantId, String scheduleType);

    // ==================== 통계 및 분석 ====================
    
    /**
     * 상담사별 스케줄 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.consultantId = :consultantId AND s.isDeleted = false")
    long countByConsultantId(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.consultantId = :consultantId AND s.isDeleted = false")
    long countByConsultantIdDeprecated(@Param("consultantId") Long consultantId);
    
    /**
     * 내담자별 스케줄 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.clientId = :clientId AND s.isDeleted = false")
    long countByClientId(@Param("tenantId") String tenantId, @Param("clientId") Long clientId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.clientId = :clientId AND s.isDeleted = false")
    long countByClientIdDeprecated(@Param("clientId") Long clientId);
    
    /**
     * 상담사별 특정 날짜의 스케줄 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.consultantId = :consultantId AND s.date = :date AND s.isDeleted = false")
    long countByConsultantIdAndDate(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId, @Param("date") LocalDate date);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.consultantId = :consultantId AND s.date = :date AND s.isDeleted = false")
    long countByConsultantIdAndDateDeprecated(@Param("consultantId") Long consultantId, @Param("date") LocalDate date);

    // ==================== 통계 조회 ====================
    
    /**
     * 상담사별 스케줄 수 통계 (tenantId 필터링)
     */
    @Query("SELECT s.consultantId, COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.isDeleted = false GROUP BY s.consultantId")
    List<Object[]> countSchedulesByConsultant(@Param("tenantId") String tenantId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT s.consultantId, COUNT(s) FROM Schedule s WHERE s.isDeleted = false GROUP BY s.consultantId")
    List<Object[]> countSchedulesByConsultantDeprecated();
    
    /**
     * 날짜별 스케줄 수 통계 (tenantId 필터링)
     */
    @Query("SELECT s.date, COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.isDeleted = false AND s.date BETWEEN :startDate AND :endDate GROUP BY s.date ORDER BY s.date")
    List<Object[]> countSchedulesByDateBetween(@Param("tenantId") String tenantId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT s.date, COUNT(s) FROM Schedule s WHERE s.isDeleted = false AND s.date BETWEEN :startDate AND :endDate GROUP BY s.date ORDER BY s.date")
    List<Object[]> countSchedulesByDateBetweenDeprecated(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * 상태별 스케줄 수 통계 (tenantId 필터링)
     */
    @Query("SELECT s.status, COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.isDeleted = false GROUP BY s.status")
    List<Object[]> countSchedulesByStatus(@Param("tenantId") String tenantId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT s.status, COUNT(s) FROM Schedule s WHERE s.isDeleted = false GROUP BY s.status")
    List<Object[]> countSchedulesByStatusDeprecated();

    // ==================== 자동 완료 처리 ====================
    
    /**
     * 시간이 지난 확정된 스케줄 조회 (자동 완료 처리용) (tenantId 필터링)
     */
    @Query("SELECT s FROM Schedule s WHERE s.tenantId = :tenantId AND s.date = :date " +
           "AND s.endTime < :currentTime " +
           "AND s.status = 'CONFIRMED' " +
           "AND s.isDeleted = false")
    List<Schedule> findExpiredConfirmedSchedules(
        @Param("tenantId") String tenantId,
        @Param("date") LocalDate date,
        @Param("currentTime") LocalTime currentTime
    );
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT s FROM Schedule s WHERE s.date = :date " +
           "AND s.endTime < :currentTime " +
           "AND s.status = 'CONFIRMED' " +
           "AND s.isDeleted = false")
    List<Schedule> findExpiredConfirmedSchedulesDeprecated(
        @Param("date") LocalDate date,
        @Param("currentTime") LocalTime currentTime
    );
    
    /**
     * 특정 날짜 이전의 특정 상태 스케줄 조회 (자동 완료 처리용) (tenantId 필터링)
     */
    @Query("SELECT s FROM Schedule s WHERE s.tenantId = :tenantId AND s.date < :date " +
           "AND s.status = :status " +
           "AND s.isDeleted = false")
    List<Schedule> findByDateBeforeAndStatus(
        @Param("tenantId") String tenantId,
        @Param("date") LocalDate date,
        @Param("status") ScheduleStatus status
    );
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT s FROM Schedule s WHERE s.date < :date " +
           "AND s.status = :status " +
           "AND s.isDeleted = false")
    List<Schedule> findByDateBeforeAndStatusDeprecated(
        @Param("date") LocalDate date,
        @Param("status") ScheduleStatus status
    );

    // ==================== 오늘의 통계 ====================
    
    /**
     * 특정 날짜의 특정 상태 스케줄 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.date = :date AND s.status = :status AND s.isDeleted = false")
    long countByDateAndStatus(@Param("tenantId") String tenantId, @Param("date") LocalDate date, @Param("status") ScheduleStatus status);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.date = :date AND s.status = :status AND s.isDeleted = false")
    long countByDateAndStatusDeprecated(@Param("date") LocalDate date, @Param("status") ScheduleStatus status);
    
    /**
     * 특정 날짜의 스케줄 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.date = :date AND s.isDeleted = false")
    long countByDate(@Param("tenantId") String tenantId, @Param("date") LocalDate date);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.date = :date AND s.isDeleted = false")
    long countByDateDeprecated(@Param("date") LocalDate date);
    
    /**
     * 특정 상태의 스케줄 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.status = :status AND s.isDeleted = false")
    long countByStatus(@Param("tenantId") String tenantId, @Param("status") String status);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.status = :status AND s.isDeleted = false")
    long countByStatusDeprecated(@Param("status") String status);
    
    // ==================== 날짜 범위 통계 ====================
    
    /**
     * 날짜 범위 내 스케줄 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.date BETWEEN :startDate AND :endDate AND s.isDeleted = false")
    long countByDateBetween(@Param("tenantId") String tenantId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.date BETWEEN :startDate AND :endDate AND s.isDeleted = false")
    long countByDateBetweenDeprecated(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * 시작일 이후 스케줄 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.date >= :startDate AND s.isDeleted = false")
    long countByDateGreaterThanEqual(@Param("tenantId") String tenantId, @Param("startDate") LocalDate startDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.date >= :startDate AND s.isDeleted = false")
    long countByDateGreaterThanEqualDeprecated(@Param("startDate") LocalDate startDate);
    
    /**
     * 종료일 이전 스케줄 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.date <= :endDate AND s.isDeleted = false")
    long countByDateLessThanEqual(@Param("tenantId") String tenantId, @Param("endDate") LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.date <= :endDate AND s.isDeleted = false")
    long countByDateLessThanEqualDeprecated(@Param("endDate") LocalDate endDate);
    
    /**
     * 날짜 범위 내 특정 상태 스케줄 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.status = :status AND s.date BETWEEN :startDate AND :endDate AND s.isDeleted = false")
    long countByStatusAndDateBetween(@Param("tenantId") String tenantId, @Param("status") ScheduleStatus status, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.status = :status AND s.date BETWEEN :startDate AND :endDate AND s.isDeleted = false")
    long countByStatusAndDateBetweenDeprecated(@Param("status") String status, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * 시작일 이후 특정 상태 스케줄 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.status = :status AND s.date >= :startDate AND s.isDeleted = false")
    long countByStatusAndDateGreaterThanEqual(@Param("tenantId") String tenantId, @Param("status") ScheduleStatus status, @Param("startDate") LocalDate startDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.status = :status AND s.date >= :startDate AND s.isDeleted = false")
    long countByStatusAndDateGreaterThanEqualDeprecated(@Param("status") String status, @Param("startDate") LocalDate startDate);
    
    /**
     * 종료일 이전 특정 상태 스케줄 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.status = :status AND s.date <= :endDate AND s.isDeleted = false")
    long countByStatusAndDateLessThanEqual(@Param("tenantId") String tenantId, @Param("status") ScheduleStatus status, @Param("endDate") LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.status = :status AND s.date <= :endDate AND s.isDeleted = false")
    long countByStatusAndDateLessThanEqualDeprecated(@Param("status") String status, @Param("endDate") LocalDate endDate);
    
    // ==================== 상담 ID별 스케줄 조회 ====================
    
    /**
     * 상담 ID별 스케줄 조회 (tenantId 필터링)
     */
    List<Schedule> findByTenantIdAndConsultationId(String tenantId, Long consultationId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    List<Schedule> findByConsultationId(Long consultationId);
    
    // ==================== 상세 통계 ====================
    
    /**
     * 날짜 범위 내 고유 내담자 수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(DISTINCT s.clientId) FROM Schedule s WHERE s.tenantId = :tenantId AND s.date BETWEEN :startDate AND :endDate AND s.isDeleted = false")
    long countDistinctClientsByDateBetween(@Param("tenantId") String tenantId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT COUNT(DISTINCT s.clientId) FROM Schedule s WHERE s.date BETWEEN :startDate AND :endDate AND s.isDeleted = false")
    long countDistinctClientsByDateBetweenDeprecated(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * 날짜 범위 내 고유 상담사 수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(DISTINCT s.consultantId) FROM Schedule s WHERE s.tenantId = :tenantId AND s.date BETWEEN :startDate AND :endDate AND s.isDeleted = false")
    long countDistinctConsultantsByDateBetween(@Param("tenantId") String tenantId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT COUNT(DISTINCT s.consultantId) FROM Schedule s WHERE s.date BETWEEN :startDate AND :endDate AND s.isDeleted = false")
    long countDistinctConsultantsByDateBetweenDeprecated(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // ==================== 상담사별 오늘 통계 ====================
    
    /**
     * 특정 상담사의 특정 날짜 스케줄 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.consultantId = :consultantId AND s.date = :date AND s.isDeleted = false")
    long countByDateAndConsultantId(@Param("tenantId") String tenantId, @Param("date") LocalDate date, @Param("consultantId") Long consultantId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.consultantId = :consultantId AND s.date = :date AND s.isDeleted = false")
    long countByDateAndConsultantIdDeprecated(@Param("date") LocalDate date, @Param("consultantId") Long consultantId);
    
    /**
     * 특정 상담사의 특정 날짜 특정 상태 스케줄 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.consultantId = :consultantId AND s.date = :date AND s.status = :status AND s.isDeleted = false")
    long countByDateAndStatusAndConsultantId(@Param("tenantId") String tenantId, @Param("date") LocalDate date, @Param("status") ScheduleStatus status, @Param("consultantId") Long consultantId);

    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.consultantId = :consultantId AND s.status = :status AND s.date BETWEEN :startDate AND :endDate AND s.isDeleted = false")
    long countByStatusAndDateBetweenAndConsultantId(@Param("tenantId") String tenantId, @Param("status") ScheduleStatus status, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("consultantId") Long consultantId);

    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.consultantId = :consultantId AND s.date = :date AND s.status = :status AND s.isDeleted = false")
    long countByDateAndStatusAndConsultantIdDeprecated(@Param("date") LocalDate date, @Param("status") ScheduleStatus status, @Param("consultantId") Long consultantId);
    
    // ==================== 통계 대시보드용 메서드 ====================
    
    /**
     * 특정 날짜 이후 생성된 스케줄 수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.createdAt > :dateTime AND s.isDeleted = false")
    long countByTenantIdAndCreatedAtAfter(@Param("tenantId") String tenantId, @Param("dateTime") java.time.LocalDateTime dateTime);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.createdAt > ?1 AND s.isDeleted = false")
    long countByCreatedAtAfterDeprecated(java.time.LocalDateTime dateTime);
    
    /**
     * 특정 날짜 이전 생성된 스케줄 수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.createdAt < :dateTime AND s.isDeleted = false")
    long countByTenantIdAndCreatedAtBefore(@Param("tenantId") String tenantId, @Param("dateTime") java.time.LocalDateTime dateTime);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.createdAt < ?1 AND s.isDeleted = false")
    long countByCreatedAtBeforeDeprecated(java.time.LocalDateTime dateTime);
    
    /**
     * 특정 기간에 생성된 스케줄 수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.createdAt BETWEEN :startDate AND :endDate AND s.isDeleted = false")
    long countByTenantIdAndCreatedAtBetween(@Param("tenantId") String tenantId, @Param("startDate") java.time.LocalDateTime startDate, @Param("endDate") java.time.LocalDateTime endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 스케줄 접근!
     */
    @Deprecated
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.createdAt BETWEEN ?1 AND ?2 AND s.isDeleted = false")
    long countByCreatedAtBetweenDeprecated(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);
    
    // ==================== 테넌트별 통계 메서드 ====================
    
    /**
     * 테넌트별 특정 날짜 스케줄 개수 조회
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.date = :date AND s.isDeleted = false")
    long countByTenantIdAndDate(@Param("tenantId") String tenantId, @Param("date") LocalDate date);
    
    /**
     * 테넌트별 특정 날짜 특정 상태 스케줄 개수 조회
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.tenantId = :tenantId AND s.date = :date AND s.status = :status AND s.isDeleted = false")
    long countByTenantIdAndDateAndStatus(@Param("tenantId") String tenantId, @Param("date") LocalDate date, @Param("status") ScheduleStatus status);
    
    // ==================== Phase 1 대시보드 컨텐츠용 메서드 ====================
    
    /**
     * 미작성 상담일지 조회 (완료된 상담 중 일지 미작성)
     * 
     * @param tenantId 테넌트 ID
     * @param consultantId 상담사 ID
     * @param limit 최대 개수
     * @return 미작성 상담일지 목록
     */
    @Query("SELECT s FROM Schedule s " +
           "WHERE s.tenantId = :tenantId " +
           "AND s.consultantId = :consultantId " +
           "AND s.status = 'COMPLETED' " +
           "AND s.isDeleted = false " +
           "AND NOT EXISTS (" +
           "  SELECT cr FROM ConsultationRecord cr " +
           "  WHERE cr.consultationId = s.id AND cr.isSessionCompleted = true AND cr.isDeleted = false" +
           ") " +
           "ORDER BY s.date DESC")
    List<Schedule> findIncompleteRecords(
        @Param("tenantId") String tenantId,
        @Param("consultantId") Long consultantId,
        Pageable pageable
    );
    
    /**
     * 다음 상담 준비 정보 조회 (특정 시간 이내 예정 상담)
     * 
     * @param tenantId 테넌트 ID
     * @param consultantId 상담사 ID
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @param currentTime 현재 시간
     * @return 다음 상담 목록
     */
    @Query("SELECT s FROM Schedule s " +
           "WHERE s.tenantId = :tenantId " +
           "AND s.consultantId = :consultantId " +
           "AND s.date BETWEEN :startDate AND :endDate " +
           "AND (s.date > :startDate OR (s.date = :startDate AND s.startTime >= :currentTime)) " +
           "AND s.status IN ('BOOKED', 'CONFIRMED') " +
           "AND s.isDeleted = false " +
           "ORDER BY s.date ASC, s.startTime ASC")
    List<Schedule> findUpcomingPreparation(
        @Param("tenantId") String tenantId,
        @Param("consultantId") Long consultantId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("currentTime") LocalTime currentTime,
        Pageable pageable
    );
    
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
    @Query("SELECT s FROM Schedule s WHERE s.tenantId = :tenantId AND s.isDeleted = false AND (CAST(:branchId AS long) IS NULL OR 1=1)")
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
    @Query("SELECT s FROM Schedule s WHERE s.tenantId = :tenantId AND s.isDeleted = false AND (CAST(:branchId AS long) IS NULL OR 1=1)")
    Page<Schedule> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId, Pageable pageable);
}
