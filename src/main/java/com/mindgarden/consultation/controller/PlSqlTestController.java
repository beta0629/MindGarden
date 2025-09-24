package com.mindgarden.consultation.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import com.mindgarden.consultation.service.PlSqlStatisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.extern.slf4j.Slf4j;

/**
 * PL/SQL 실제 동작 테스트 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
@RestController
@RequestMapping("/api/test/plsql")
public class PlSqlTestController {
    
    @Autowired
    private PlSqlStatisticsService plSqlStatisticsService;
    
    /**
     * PL/SQL 프로시저 사용 가능 여부 확인
     */
    @GetMapping("/status")
    public Map<String, Object> checkStatus() {
        log.info("🔍 PL/SQL 상태 확인 요청");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean isAvailable = plSqlStatisticsService.isProcedureAvailable();
            
            response.put("success", true);
            response.put("plsqlAvailable", isAvailable);
            response.put("message", isAvailable ? "PL/SQL 프로시저 사용 가능" : "PL/SQL 프로시저 사용 불가");
            response.put("timestamp", LocalDate.now().toString());
            
            log.info("✅ PL/SQL 상태 확인 완료: {}", isAvailable);
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 상태 확인 실패: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "PL/SQL 상태 확인 실패: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * 일별 통계 PL/SQL 프로시저 테스트
     */
    @PostMapping("/test-daily-stats")
    public Map<String, Object> testDailyStats(
            @RequestParam(defaultValue = "MAIN001") String branchCode,
            @RequestParam(required = false) String date) {
        
        log.info("🧪 일별 통계 PL/SQL 테스트: branchCode={}, date={}", branchCode, date);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            LocalDate targetDate = (date != null && !date.isEmpty()) ? 
                LocalDate.parse(date) : LocalDate.now();
            
            String result = plSqlStatisticsService.updateDailyStatistics(branchCode, targetDate);
            
            response.put("success", true);
            response.put("message", "일별 통계 PL/SQL 실행 완료");
            response.put("result", result);
            response.put("branchCode", branchCode);
            response.put("targetDate", targetDate.toString());
            
            log.info("✅ 일별 통계 PL/SQL 테스트 완료: {}", result);
            
        } catch (Exception e) {
            log.error("❌ 일별 통계 PL/SQL 테스트 실패: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "일별 통계 PL/SQL 실행 실패: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * 상담사 성과 PL/SQL 프로시저 테스트
     */
    @PostMapping("/test-consultant-performance")
    public Map<String, Object> testConsultantPerformance(
            @RequestParam(required = false) String date) {
        
        log.info("🧪 상담사 성과 PL/SQL 테스트: date={}", date);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            LocalDate targetDate = (date != null && !date.isEmpty()) ? 
                LocalDate.parse(date) : LocalDate.now();
            
            String result = plSqlStatisticsService.updateAllConsultantPerformance(targetDate);
            
            response.put("success", true);
            response.put("message", "상담사 성과 PL/SQL 실행 완료");
            response.put("result", result);
            response.put("targetDate", targetDate.toString());
            
            log.info("✅ 상담사 성과 PL/SQL 테스트 완료: {}", result);
            
        } catch (Exception e) {
            log.error("❌ 상담사 성과 PL/SQL 테스트 실패: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "상담사 성과 PL/SQL 실행 실패: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * 성과 모니터링 PL/SQL 프로시저 테스트
     */
    @PostMapping("/test-performance-monitoring")
    public Map<String, Object> testPerformanceMonitoring(
            @RequestParam(required = false) String date) {
        
        log.info("🧪 성과 모니터링 PL/SQL 테스트: date={}", date);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            LocalDate targetDate = (date != null && !date.isEmpty()) ? 
                LocalDate.parse(date) : LocalDate.now();
            
            int alertCount = plSqlStatisticsService.performDailyPerformanceMonitoring(targetDate);
            
            response.put("success", true);
            response.put("message", "성과 모니터링 PL/SQL 실행 완료");
            response.put("alertCount", alertCount);
            response.put("targetDate", targetDate.toString());
            
            log.info("✅ 성과 모니터링 PL/SQL 테스트 완료: 알림 {}개 생성", alertCount);
            
        } catch (Exception e) {
            log.error("❌ 성과 모니터링 PL/SQL 테스트 실패: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "성과 모니터링 PL/SQL 실행 실패: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * 종합 PL/SQL 테스트
     */
    @PostMapping("/test-all")
    public Map<String, Object> testAllProcedures(
            @RequestParam(defaultValue = "MAIN001") String branchCode,
            @RequestParam(required = false) String date) {
        
        log.info("🧪 종합 PL/SQL 테스트: branchCode={}, date={}", branchCode, date);
        
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> results = new HashMap<>();
        
        try {
            LocalDate targetDate = (date != null && !date.isEmpty()) ? 
                LocalDate.parse(date) : LocalDate.now();
            
            // 1. 일별 통계
            String dailyResult = plSqlStatisticsService.updateDailyStatistics(branchCode, targetDate);
            results.put("dailyStatistics", dailyResult);
            
            // 2. 상담사 성과
            String performanceResult = plSqlStatisticsService.updateAllConsultantPerformance(targetDate);
            results.put("consultantPerformance", performanceResult);
            
            // 3. 성과 모니터링
            int alertCount = plSqlStatisticsService.performDailyPerformanceMonitoring(targetDate);
            results.put("performanceMonitoring", alertCount + "개 알림 생성");
            
            response.put("success", true);
            response.put("message", "종합 PL/SQL 테스트 완료");
            response.put("results", results);
            response.put("branchCode", branchCode);
            response.put("targetDate", targetDate.toString());
            
            log.info("✅ 종합 PL/SQL 테스트 완료");
            
        } catch (Exception e) {
            log.error("❌ 종합 PL/SQL 테스트 실패: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "종합 PL/SQL 테스트 실패: " + e.getMessage());
        }
        
        return response;
    }
}
