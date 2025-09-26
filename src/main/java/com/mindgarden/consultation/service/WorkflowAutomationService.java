package com.mindgarden.consultation.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 워크플로우 자동화 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-15
 */
public interface WorkflowAutomationService {
    
    /**
     * 예약 리마인더 자동 발송
     * - 상담 1시간 전 리마인더
     * - 상담 30분 전 최종 리마인더
     */
    void sendScheduleReminders();
    
    /**
     * 미완료 상담 알림
     * - 상담 시간이 지났지만 완료되지 않은 상담에 대한 알림
     */
    void sendIncompleteConsultationAlerts();
    
    /**
     * 일일 성과 요약 알림
     * - 상담사별 일일 성과 요약 발송
     */
    void sendDailyPerformanceSummary();
    
    /**
     * 월간 성과 리포트 자동 생성
     * - 월말 자동 성과 리포트 생성 및 발송
     */
    void generateMonthlyPerformanceReport();
    
    /**
     * 워크플로우 실행 상태 조회
     */
    Map<String, Object> getWorkflowStatus();
    
    /**
     * 워크플로우 실행 로그 조회
     */
    List<Map<String, Object>> getWorkflowExecutionLogs(LocalDateTime startDate, LocalDateTime endDate);
}
