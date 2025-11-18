package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.service.SystemMonitoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 시스템 모니터링 컨트롤러
 * Week 13 Day 2: 동적 시스템 감시 시스템 구축
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@RestController
@RequestMapping("/api/admin/monitoring")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'OPS')")
public class SystemMonitoringController {
    
    private final SystemMonitoringService monitoringService;
    
    /**
     * 시스템 상태 조회
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSystemStatus() {
        return ResponseEntity.ok(monitoringService.getSystemStatus());
    }
    
    /**
     * 메모리 사용량 조회
     */
    @GetMapping("/memory")
    public ResponseEntity<Map<String, Object>> getMemoryUsage() {
        return ResponseEntity.ok(monitoringService.getMemoryUsage());
    }
    
    /**
     * CPU 사용량 조회
     */
    @GetMapping("/cpu")
    public ResponseEntity<Map<String, Object>> getCpuUsage() {
        return ResponseEntity.ok(monitoringService.getCpuUsage());
    }
    
    /**
     * 데이터베이스 상태 조회
     */
    @GetMapping("/database")
    public ResponseEntity<Map<String, Object>> getDatabaseStatus() {
        return ResponseEntity.ok(monitoringService.getDatabaseStatus());
    }
    
    /**
     * 최근 에러 로그 조회
     */
    @GetMapping("/errors")
    public ResponseEntity<Map<String, Object>> getRecentErrors(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(monitoringService.getRecentErrors(limit));
    }
    
    /**
     * API 응답 시간 통계 조회
     */
    @GetMapping("/api-stats")
    public ResponseEntity<Map<String, Object>> getApiResponseTimeStats() {
        return ResponseEntity.ok(monitoringService.getApiResponseTimeStats());
    }
}

