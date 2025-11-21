package com.coresolution.core.service.academy;

import com.coresolution.core.domain.academy.Attendance;
import com.coresolution.core.dto.academy.AttendanceRequest;
import com.coresolution.core.dto.academy.AttendanceResponse;

import java.time.LocalDate;
import java.util.List;

/**
 * 출결 서비스 인터페이스
 * 학원 시스템의 출결 관리 비즈니스 로직
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
public interface AttendanceService {
    
    /**
     * 출결 목록 조회
     */
    List<AttendanceResponse> getAttendances(String tenantId, Long branchId, String enrollmentId, String scheduleId, LocalDate date);
    
    /**
     * 출결 상세 조회
     */
    AttendanceResponse getAttendance(String tenantId, String attendanceId);
    
    /**
     * 출결 기록 생성
     */
    AttendanceResponse createAttendance(String tenantId, AttendanceRequest request, String recordedBy);
    
    /**
     * 출결 기록 수정
     */
    AttendanceResponse updateAttendance(String tenantId, String attendanceId, AttendanceRequest request, String updatedBy);
    
    /**
     * 출결 기록 삭제 (소프트 삭제)
     */
    void deleteAttendance(String tenantId, String attendanceId, String deletedBy);
    
    /**
     * 출결 상태 변경
     */
    AttendanceResponse updateAttendanceStatus(String tenantId, String attendanceId, Attendance.AttendanceStatus status, String updatedBy);
    
    /**
     * 수강생별 출결 조회
     */
    List<AttendanceResponse> getAttendancesByEnrollment(String tenantId, String enrollmentId);
    
    /**
     * 날짜별 출결 조회
     */
    List<AttendanceResponse> getAttendancesByDate(String tenantId, Long branchId, LocalDate date);
    
    /**
     * 기간별 출결 조회
     */
    List<AttendanceResponse> getAttendancesByDateRange(String tenantId, String enrollmentId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 출석률 계산
     */
    double calculateAttendanceRate(String tenantId, String enrollmentId);
}

