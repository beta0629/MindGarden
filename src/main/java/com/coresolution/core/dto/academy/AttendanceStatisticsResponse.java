package com.coresolution.core.dto.academy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Map;

/**
 * 출결 통계 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceStatisticsResponse {
    
    /**
     * 수강 등록 ID
     */
    private String enrollmentId;
    
    /**
     * 수강생 ID
     */
    private Long consumerId;
    
    /**
     * 수강생명
     */
    private String consumerName;
    
    /**
     * 반 ID
     */
    private String classId;
    
    /**
     * 반명
     */
    private String className;
    
    /**
     * 조회 기간 시작일
     */
    private LocalDate startDate;
    
    /**
     * 조회 기간 종료일
     */
    private LocalDate endDate;
    
    /**
     * 전체 출결 수
     */
    private Long totalCount;
    
    /**
     * 출석 수
     */
    private Long presentCount;
    
    /**
     * 지각 수
     */
    private Long lateCount;
    
    /**
     * 조퇴 수
     */
    private Long earlyLeaveCount;
    
    /**
     * 결석 수
     */
    private Long absentCount;
    
    /**
     * 출석률 (%)
     */
    private Double attendanceRate;
    
    /**
     * 상태별 통계 (상태명 -> 개수)
     */
    private Map<String, Long> statusCounts;
    
    /**
     * 월별 출석률 (월 -> 출석률)
     */
    private Map<String, Double> monthlyAttendanceRates;
}

