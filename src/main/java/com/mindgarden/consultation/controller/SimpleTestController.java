package com.mindgarden.consultation.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 간단한 테스트용 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@RestController
@RequestMapping("/api/test")
public class SimpleTestController {
    
    /**
     * 기본 헬스 체크
     */
    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "서버가 정상적으로 실행 중입니다");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("status", "UP");
        return response;
    }
    
    /**
     * 간단한 통계 테스트
     */
    @GetMapping("/simple-stats")
    public Map<String, Object> simpleStats() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "간단한 통계 테스트 성공");
        response.put("data", Map.of(
            "totalSchedules", 10,
            "completedSchedules", 7,
            "cancelledSchedules", 2,
            "pendingSchedules", 1
        ));
        response.put("timestamp", LocalDateTime.now().toString());
        return response;
    }
    
    /**
     * PL/SQL 상태 확인 (간단 버전)
     */
    @GetMapping("/plsql-status")
    public Map<String, Object> plsqlStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "PL/SQL 상태 확인");
        response.put("plsqlAvailable", true);
        response.put("procedures", Map.of(
            "UpdateDailyStatistics", "사용 가능",
            "UpdateConsultantPerformance", "사용 가능",
            "DailyPerformanceMonitoring", "사용 가능"
        ));
        response.put("timestamp", LocalDateTime.now().toString());
        return response;
    }
}