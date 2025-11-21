package com.coresolution.core.repository.academy;

import com.coresolution.core.domain.academy.Attendance;
import com.coresolution.core.domain.academy.Attendance.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 출결 Repository
 * 학원 시스템의 출결 엔티티에 대한 데이터 접근 계층
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    
    /**
     * attendance_id로 조회
     */
    Optional<Attendance> findByAttendanceIdAndIsDeletedFalse(String attendanceId);
    
    /**
     * tenant_id로 조회 (삭제되지 않은 것만)
     */
    List<Attendance> findByTenantIdAndIsDeletedFalse(String tenantId);
    
    /**
     * tenant_id와 branch_id로 조회
     */
    List<Attendance> findByTenantIdAndBranchIdAndIsDeletedFalse(String tenantId, Long branchId);
    
    /**
     * tenant_id와 enrollment_id로 조회
     */
    List<Attendance> findByTenantIdAndEnrollmentIdAndIsDeletedFalse(String tenantId, String enrollmentId);
    
    /**
     * tenant_id와 schedule_id로 조회
     */
    List<Attendance> findByTenantIdAndScheduleIdAndIsDeletedFalse(String tenantId, String scheduleId);
    
    /**
     * 수강생별 출결 조회
     */
    @Query("SELECT a FROM Attendance a WHERE a.tenantId = :tenantId AND a.enrollmentId = :enrollmentId AND a.isDeleted = false ORDER BY a.attendanceDate DESC, a.attendanceTime DESC")
    List<Attendance> findAttendancesByEnrollmentId(@Param("tenantId") String tenantId, @Param("enrollmentId") String enrollmentId);
    
    /**
     * 날짜별 출결 조회
     */
    @Query("SELECT a FROM Attendance a WHERE a.tenantId = :tenantId AND a.branchId = :branchId AND a.attendanceDate = :date AND a.isDeleted = false ORDER BY a.attendanceTime ASC")
    List<Attendance> findAttendancesByDate(@Param("tenantId") String tenantId, @Param("branchId") Long branchId, @Param("date") LocalDate date);
    
    /**
     * 기간별 출결 조회
     */
    @Query("SELECT a FROM Attendance a WHERE a.tenantId = :tenantId AND a.enrollmentId = :enrollmentId AND a.attendanceDate BETWEEN :startDate AND :endDate AND a.isDeleted = false ORDER BY a.attendanceDate ASC, a.attendanceTime ASC")
    List<Attendance> findAttendancesByDateRange(@Param("tenantId") String tenantId, @Param("enrollmentId") String enrollmentId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * 상태별 출결 조회
     */
    List<Attendance> findByTenantIdAndBranchIdAndStatusAndIsDeletedFalse(String tenantId, Long branchId, AttendanceStatus status);
    
    /**
     * 출석한 출결 조회
     */
    @Query("SELECT a FROM Attendance a WHERE a.tenantId = :tenantId AND a.enrollmentId = :enrollmentId AND a.status = 'PRESENT' AND a.isDeleted = false ORDER BY a.attendanceDate DESC")
    List<Attendance> findPresentAttendances(@Param("tenantId") String tenantId, @Param("enrollmentId") String enrollmentId);
    
    /**
     * 결석한 출결 조회
     */
    @Query("SELECT a FROM Attendance a WHERE a.tenantId = :tenantId AND a.enrollmentId = :enrollmentId AND a.status = 'ABSENT' AND a.isDeleted = false ORDER BY a.attendanceDate DESC")
    List<Attendance> findAbsentAttendances(@Param("tenantId") String tenantId, @Param("enrollmentId") String enrollmentId);
    
    /**
     * 지각한 출결 조회
     */
    @Query("SELECT a FROM Attendance a WHERE a.tenantId = :tenantId AND a.enrollmentId = :enrollmentId AND a.status = 'LATE' AND a.isDeleted = false ORDER BY a.attendanceDate DESC")
    List<Attendance> findLateAttendances(@Param("tenantId") String tenantId, @Param("enrollmentId") String enrollmentId);
    
    /**
     * 출석률 계산용 출결 조회 (출석 + 사유결석)
     */
    @Query("SELECT a FROM Attendance a WHERE a.tenantId = :tenantId AND a.enrollmentId = :enrollmentId AND (a.status = 'PRESENT' OR a.status = 'EXCUSED') AND a.isDeleted = false")
    List<Attendance> findCountedAttendances(@Param("tenantId") String tenantId, @Param("enrollmentId") String enrollmentId);
    
    /**
     * 특정 날짜와 시간표의 출결 조회
     */
    @Query("SELECT a FROM Attendance a WHERE a.tenantId = :tenantId AND a.enrollmentId = :enrollmentId AND a.scheduleId = :scheduleId AND a.attendanceDate = :date AND a.isDeleted = false")
    Optional<Attendance> findAttendanceByEnrollmentAndScheduleAndDate(@Param("tenantId") String tenantId, @Param("enrollmentId") String enrollmentId, @Param("scheduleId") String scheduleId, @Param("date") LocalDate date);
    
    /**
     * attendance_id 존재 여부 확인
     */
    boolean existsByAttendanceIdAndIsDeletedFalse(String attendanceId);
    
    /**
     * 출석 수 카운트
     */
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.tenantId = :tenantId AND a.enrollmentId = :enrollmentId AND (a.status = 'PRESENT' OR a.status = 'EXCUSED') AND a.isDeleted = false")
    Long countPresentAttendances(@Param("tenantId") String tenantId, @Param("enrollmentId") String enrollmentId);
    
    /**
     * 전체 출결 수 카운트
     */
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.tenantId = :tenantId AND a.enrollmentId = :enrollmentId AND a.isDeleted = false")
    Long countTotalAttendances(@Param("tenantId") String tenantId, @Param("enrollmentId") String enrollmentId);
}

