package com.coresolution.core.repository.academy;

import com.coresolution.core.domain.academy.ClassSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 시간표 Repository
 * 학원 시스템의 시간표 엔티티에 대한 데이터 접근 계층
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Repository
public interface ClassScheduleRepository extends JpaRepository<ClassSchedule, Long> {
    
    /**
     * schedule_id로 조회
     */
    Optional<ClassSchedule> findByScheduleIdAndIsDeletedFalse(String scheduleId);
    
    /**
     * tenant_id로 조회 (삭제되지 않은 것만)
     */
    List<ClassSchedule> findByTenantIdAndIsDeletedFalse(String tenantId);
    
    /**
     * tenant_id와 branch_id로 조회
     */
    List<ClassSchedule> findByTenantIdAndBranchIdAndIsDeletedFalse(String tenantId, Long branchId);
    
    /**
     * tenant_id와 class_id로 조회
     */
    List<ClassSchedule> findByTenantIdAndClassIdAndIsDeletedFalse(String tenantId, String classId);
    
    /**
     * tenant_id와 branch_id와 class_id로 조회
     */
    List<ClassSchedule> findByTenantIdAndBranchIdAndClassIdAndIsDeletedFalse(String tenantId, Long branchId, String classId);
    
    /**
     * 활성 시간표 조회
     */
    @Query("SELECT s FROM ClassSchedule s WHERE s.tenantId = :tenantId AND s.classId = :classId AND s.isActive = true AND s.isDeleted = false ORDER BY s.dayOfWeek ASC, s.startTime ASC")
    List<ClassSchedule> findActiveSchedulesByClassId(@Param("tenantId") String tenantId, @Param("classId") String classId);
    
    /**
     * 정기 수업 시간표 조회
     */
    @Query("SELECT s FROM ClassSchedule s WHERE s.tenantId = :tenantId AND s.classId = :classId AND s.isRegular = true AND s.isActive = true AND s.isDeleted = false ORDER BY s.dayOfWeek ASC, s.startTime ASC")
    List<ClassSchedule> findRegularSchedulesByClassId(@Param("tenantId") String tenantId, @Param("classId") String classId);
    
    /**
     * 특정 날짜 수업 조회
     */
    @Query("SELECT s FROM ClassSchedule s WHERE s.tenantId = :tenantId AND s.classId = :classId AND s.sessionDate = :date AND s.isActive = true AND s.isDeleted = false ORDER BY s.startTime ASC")
    List<ClassSchedule> findSchedulesByDate(@Param("tenantId") String tenantId, @Param("classId") String classId, @Param("date") LocalDate date);
    
    /**
     * 요일별 시간표 조회
     */
    @Query("SELECT s FROM ClassSchedule s WHERE s.tenantId = :tenantId AND s.classId = :classId AND s.dayOfWeek = :dayOfWeek AND s.isActive = true AND s.isDeleted = false ORDER BY s.startTime ASC")
    List<ClassSchedule> findSchedulesByDayOfWeek(@Param("tenantId") String tenantId, @Param("classId") String classId, @Param("dayOfWeek") Integer dayOfWeek);
    
    /**
     * 특정 기간 내 시간표 조회
     */
    @Query("SELECT s FROM ClassSchedule s WHERE s.tenantId = :tenantId AND s.classId = :classId AND s.sessionDate BETWEEN :startDate AND :endDate AND s.isActive = true AND s.isDeleted = false ORDER BY s.sessionDate ASC, s.startTime ASC")
    List<ClassSchedule> findSchedulesByDateRange(@Param("tenantId") String tenantId, @Param("classId") String classId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * schedule_id 존재 여부 확인
     */
    boolean existsByScheduleIdAndIsDeletedFalse(String scheduleId);
}

