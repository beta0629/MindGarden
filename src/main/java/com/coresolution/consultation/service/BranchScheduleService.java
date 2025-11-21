package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 지점별 스케줄 관리 서비스
 * 기존 스케줄 시스템을 지점별로 확장
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-16
 */
public interface BranchScheduleService {
    
    /**
     * 지점별 스케줄 조회
     * @param branchId 지점 ID
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 지점별 스케줄 목록
     */
    List<Schedule> getBranchSchedules(Long branchId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 지점별 상담사 스케줄 조회
     * @param branchId 지점 ID
     * @param consultantId 상담사 ID
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 상담사 스케줄 목록
     */
    List<Schedule> getBranchConsultantSchedules(Long branchId, Long consultantId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 지점별 스케줄 통계 조회
     * @param branchId 지점 ID
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 스케줄 통계
     */
    Map<String, Object> getBranchScheduleStatistics(Long branchId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 지점별 상담사별 스케줄 현황 조회
     * @param branchId 지점 ID
     * @param date 조회일
     * @return 상담사별 스케줄 현황
     */
    Map<String, Object> getBranchConsultantScheduleStatus(Long branchId, LocalDate date);
    
    /**
     * 지점별 스케줄 생성
     * @param branchId 지점 ID
     * @param schedule 스케줄 정보
     * @return 생성된 스케줄
     */
    Schedule createBranchSchedule(Long branchId, Schedule schedule);
    
    /**
     * 지점별 스케줄 수정
     * @param branchId 지점 ID
     * @param scheduleId 스케줄 ID
     * @param schedule 수정할 스케줄 정보
     * @return 수정된 스케줄
     */
    Schedule updateBranchSchedule(Long branchId, Long scheduleId, Schedule schedule);
    
    /**
     * 지점별 스케줄 삭제
     * @param branchId 지점 ID
     * @param scheduleId 스케줄 ID
     */
    void deleteBranchSchedule(Long branchId, Long scheduleId);
    
    /**
     * 지점별 스케줄 중복 확인
     * @param branchId 지점 ID
     * @param consultantId 상담사 ID
     * @param startTime 시작 시간
     * @param endTime 종료 시간
     * @return 중복 여부
     */
    boolean isScheduleConflict(Long branchId, Long consultantId, LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * 지점별 스케줄 가능 시간 조회
     * @param branchId 지점 ID
     * @param consultantId 상담사 ID
     * @param date 조회일
     * @return 가능한 시간대 목록
     */
    List<Map<String, Object>> getAvailableTimeSlots(Long branchId, Long consultantId, LocalDate date);
}
