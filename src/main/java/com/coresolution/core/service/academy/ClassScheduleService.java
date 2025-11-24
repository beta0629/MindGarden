package com.coresolution.core.service.academy;

import com.coresolution.core.dto.academy.ClassScheduleRequest;
import com.coresolution.core.dto.academy.ClassScheduleResponse;

import java.time.LocalDate;
import java.util.List;

/**
 * 시간표 서비스 인터페이스
 * 학원 시스템의 시간표 관리 비즈니스 로직
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
public interface ClassScheduleService {
    
    /**
     * 시간표 목록 조회
     */
    List<ClassScheduleResponse> getSchedules(String tenantId, Long branchId, String classId);
    
    /**
     * 시간표 상세 조회
     */
    ClassScheduleResponse getSchedule(String tenantId, String scheduleId);
    
    /**
     * 시간표 생성
     */
    ClassScheduleResponse createSchedule(String tenantId, ClassScheduleRequest request, String createdBy);
    
    /**
     * 시간표 수정
     */
    ClassScheduleResponse updateSchedule(String tenantId, String scheduleId, ClassScheduleRequest request, String updatedBy);
    
    /**
     * 시간표 삭제 (소프트 삭제)
     */
    void deleteSchedule(String tenantId, String scheduleId, String deletedBy);
    
    /**
     * 반별 활성 시간표 조회
     */
    List<ClassScheduleResponse> getActiveSchedulesByClass(String tenantId, String classId);
    
    /**
     * 반별 정기 수업 시간표 조회
     */
    List<ClassScheduleResponse> getRegularSchedulesByClass(String tenantId, String classId);
    
    /**
     * 특정 날짜 시간표 조회
     */
    List<ClassScheduleResponse> getSchedulesByDate(String tenantId, String classId, LocalDate date);
    
    /**
     * 요일별 시간표 조회
     */
    List<ClassScheduleResponse> getSchedulesByDayOfWeek(String tenantId, String classId, Integer dayOfWeek);
    
    /**
     * 기간별 시간표 조회
     */
    List<ClassScheduleResponse> getSchedulesByDateRange(String tenantId, String classId, LocalDate startDate, LocalDate endDate);
}

