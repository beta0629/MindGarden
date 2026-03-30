package com.coresolution.consultation.service;

import java.util.Map;

/**
 * 시스템 모니터링 서비스 인터페이스
 * Week 13 Day 2: 동적 시스템 감시 시스템 구축
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface SystemMonitoringService {
    
    /**
     * 시스템 상태 정보 조회
     */
    Map<String, Object> getSystemStatus();
    
    /**
     * 메모리 사용량 조회
     */
    Map<String, Object> getMemoryUsage();
    
    /**
     * CPU 사용량 조회
     */
    Map<String, Object> getCpuUsage();
    
    /**
     * 데이터베이스 연결 상태 조회
     */
    Map<String, Object> getDatabaseStatus();
    
    /**
     * 최근 에러 로그 조회
     */
    Map<String, Object> getRecentErrors(int limit);
    
    /**
     * API 응답 시간 통계 조회
     */
    Map<String, Object> getApiResponseTimeStats();
}

