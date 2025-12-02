package com.coresolution.core.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * 스케줄러 알림 서비스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SchedulerAlertService {
    
    @Value("${scheduler.alert.enabled:true}")
    private boolean alertEnabled;
    
    @Value("${scheduler.alert.success-rate-threshold:0.95}")
    private double successRateThreshold;
    
    /**
     * 스케줄러 실패 알림 발송
     */
    public void sendFailureAlert(
        String schedulerName,
        String executionId,
        int failureCount,
        String errorMessage
    ) {
        if (!alertEnabled) {
            log.debug("스케줄러 알림이 비활성화되어 있습니다.");
            return;
        }
        
        try {
            String title = String.format("[스케줄러 실패] %s", schedulerName);
            // String message = buildFailureMessage(schedulerName, executionId, failureCount, errorMessage);
            
            // 시스템 알림 발송 (TODO: NotificationService 연동)
            log.warn("📧 알림 발송: {}", title);
            log.warn("🚨 스케줄러 실패 알림 발송: scheduler={}, executionId={}, failureCount={}", 
                schedulerName, executionId, failureCount);
            
        } catch (Exception e) {
            log.error("스케줄러 실패 알림 발송 실패: scheduler={}", schedulerName, e);
        }
    }
    
    /**
     * 스케줄러 성공률 저하 알림
     */
    public void sendSuccessRateAlert(String schedulerName, double successRate) {
        if (!alertEnabled) {
            return;
        }
        
        if (successRate < successRateThreshold) {
        try {
            String title = String.format("[스케줄러 성공률 저하] %s", schedulerName);
            /*
            String message = String.format(
                    "스케줄러 성공률이 %.2f%%로 저하되었습니다. (기준: %.2f%%)\n" +
                    "스케줄러: %s\n" +
                    "현재 성공률: %.2f%%\n" +
                    "확인이 필요합니다.",
                    successRate * 100,
                    successRateThreshold * 100,
                    schedulerName,
                    successRate * 100
                );
            */
                
            log.warn("📧 알림 발송: {}", title);
                
                log.warn("⚠️ 스케줄러 성공률 저하 알림 발송: scheduler={}, successRate={}", 
                    schedulerName, successRate);
                
            } catch (Exception e) {
                log.error("스케줄러 성공률 저하 알림 발송 실패: scheduler={}", schedulerName, e);
            }
        }
    }
    
    /**
     * 스케줄러 완전 실패 알림 (모든 테넌트 실패)
     */
    public void sendCompleteFailureAlert(
        String schedulerName,
        String executionId,
        int totalTenants,
        String errorMessage
    ) {
        if (!alertEnabled) {
            return;
        }
        
        try {
            String title = String.format("[스케줄러 완전 실패] %s", schedulerName);
            /*
            String message = String.format(
                "스케줄러가 모든 테넌트에서 실패했습니다.\n\n" +
                "스케줄러: %s\n" +
                "실행 ID: %s\n" +
                "대상 테넌트 수: %d\n" +
                "오류 메시지: %s\n\n" +
                "긴급 확인이 필요합니다.",
                schedulerName,
                executionId,
                totalTenants,
                errorMessage != null ? errorMessage : "알 수 없음"
            );
            */
            
            log.warn("📧 알림 발송: {}", title);
            log.error("🚨 스케줄러 완전 실패 알림 발송: scheduler={}, executionId={}, totalTenants={}", 
                schedulerName, executionId, totalTenants);
            
        } catch (Exception e) {
            log.error("스케줄러 완전 실패 알림 발송 실패: scheduler={}", schedulerName, e);
        }
    }
    
    /**
     * 스케줄러 실행 시간 초과 알림
     */
    public void sendExecutionTimeoutAlert(
        String schedulerName,
        String executionId,
        long executionTimeMs,
        long thresholdMs
    ) {
        if (!alertEnabled) {
            return;
        }
        
        try {
            String title = String.format("[스케줄러 실행 시간 초과] %s", schedulerName);
            /*
            String message = String.format(
                "스케줄러 실행 시간이 임계값을 초과했습니다.\n\n" +
                "스케줄러: %s\n" +
                "실행 ID: %s\n" +
                "실행 시간: %d ms (%.2f초)\n" +
                "임계값: %d ms (%.2f초)\n\n" +
                "성능 확인이 필요합니다.",
                schedulerName,
                executionId,
                executionTimeMs,
                executionTimeMs / 1000.0,
                thresholdMs,
                thresholdMs / 1000.0
            );
            */
            
            log.warn("📧 알림 발송: {}", title);
            log.warn("⏰ 스케줄러 실행 시간 초과 알림 발송: scheduler={}, executionTime={}ms, threshold={}ms", 
                schedulerName, executionTimeMs, thresholdMs);
            
        } catch (Exception e) {
            log.error("스케줄러 실행 시간 초과 알림 발송 실패: scheduler={}", schedulerName, e);
        }
    }
    
    /**
     * 실패 메시지 생성
     */
    private String buildFailureMessage(
        String schedulerName,
        String executionId,
        int failureCount,
        String errorMessage
    ) {
        return String.format(
            "스케줄러 실행 중 오류가 발생했습니다.\n\n" +
            "스케줄러: %s\n" +
            "실행 ID: %s\n" +
            "실패 수: %d\n" +
            "오류 메시지: %s\n\n" +
            "로그를 확인하여 원인을 파악하세요.",
            schedulerName,
            executionId,
            failureCount,
            errorMessage != null ? errorMessage : "알 수 없음"
        );
    }
}

