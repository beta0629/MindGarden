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
     *
     * @return 시스템 상태 맵
     */
    Map<String, Object> getSystemStatus();
    
    /**
     * 메모리 사용량 조회
     *
     * @return 메모리 사용량 맵
     */
    Map<String, Object> getMemoryUsage();
    
    /**
     * CPU 사용량 조회
     *
     * @return CPU 사용량 맵
     */
    Map<String, Object> getCpuUsage();
    
    /**
     * 데이터베이스 연결 상태 조회
     *
     * @return DB 상태 맵
     */
    Map<String, Object> getDatabaseStatus();
    
    /**
     * 최근 에러 로그 조회
     *
     * @param limit 조회 건수 상한
     * @return 에러 로그 맵
     */
    Map<String, Object> getRecentErrors(int limit);
    
    /**
     * API 응답 시간 통계 조회
     *
     * @return API 응답 시간 통계 맵
     */
    Map<String, Object> getApiResponseTimeStats();

    /**
     * Track3 리소스 스택킹 관측(힙·JVM 스레드·Hikari·processlist counts).
     * 읽기 전용 — 풀 정리·요청 거절·스레드 interrupt 를 수행하지 않는다.
     *
     * @return 스택킹 상태·임계치·alerts 맵
     */
    Map<String, Object> getResourceStackingStatus();
}

