package com.mindgarden.consultation.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import com.mindgarden.consultation.service.PlSqlStatisticsService;
import com.mindgarden.consultation.service.StatisticsSchedulerService;
import com.mindgarden.consultation.service.StatisticsTestDataService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 통계 시스템 테스트 컨트롤러
 * PL/SQL 통계 시스템의 실제 동작을 테스트하기 위한 API
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
// @RestController
@RequestMapping("/api/test/statistics")
@RequiredArgsConstructor
public class StatisticsTestController {
    
    private final StatisticsTestDataService testDataService;
    private final PlSqlStatisticsService plSqlStatisticsService;
    private final StatisticsSchedulerService schedulerService;
    
    /**
     * 종합 테스트 실행
     * 테스트 데이터 생성 → PL/SQL 실행 → 결과 검증
     */
    @PostMapping("/run-complete-test")
    public ResponseEntity<Map<String, Object>> runCompleteTest(
            @RequestParam(required = false) String branchCode,
            @RequestParam(required = false) String date,
            HttpSession session) {
        
        log.info("🧪 종합 통계 테스트 실행 시작: branchCode={}, date={}", branchCode, date);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 날짜 설정 (기본값: 오늘)
            LocalDate targetDate = (date != null && !date.isEmpty()) ? 
                LocalDate.parse(date) : LocalDate.now();
            
            // 지점 코드 설정 (기본값: 세션에서 가져오기)
            if (branchCode == null || branchCode.isEmpty()) {
                branchCode = (String) session.getAttribute("currentBranchCode");
                if (branchCode == null) {
                    branchCode = "MAIN001"; // 기본값
                }
            }
            
            // 1단계: 기존 테스트 데이터 정리
            log.info("1️⃣ 기존 테스트 데이터 정리");
            Map<String, Object> cleanupResult = testDataService.cleanupTestData(targetDate, branchCode);
            
            // 2단계: 다양한 시나리오 테스트 데이터 생성
            log.info("2️⃣ 다양한 시나리오 테스트 데이터 생성");
            Map<String, Object> dataResult = testDataService.createDiverseTestScenarios(targetDate, branchCode);
            
            // 3단계: PL/SQL 프로시저 실행
            log.info("3️⃣ PL/SQL 프로시저 실행");
            String dailyStatsResult = plSqlStatisticsService.updateDailyStatistics(branchCode, targetDate);
            String performanceResult = plSqlStatisticsService.updateAllConsultantPerformance(targetDate);
            int alertCount = plSqlStatisticsService.performDailyPerformanceMonitoring(targetDate);
            
            // 4단계: 통계 일관성 검증
            log.info("4️⃣ 통계 일관성 검증");
            boolean isConsistent = plSqlStatisticsService.validateStatisticsConsistency(branchCode, targetDate);
            
            response.put("success", true);
            response.put("message", "종합 통계 테스트 완료");
            response.put("testResults", Map.of(
                "cleanup", cleanupResult,
                "testData", dataResult,
                "dailyStats", dailyStatsResult,
                "performance", performanceResult,
                "alerts", alertCount,
                "consistency", isConsistent
            ));
            response.put("targetDate", targetDate.toString());
            response.put("branchCode", branchCode);
            
            log.info("✅ 종합 통계 테스트 완료: 일관성={}, 알림={}개", isConsistent, alertCount);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 종합 통계 테스트 실패: branchCode={}, date={}, 오류={}", 
                     branchCode, date, e.getMessage(), e);
            response.put("success", false);
            response.put("message", "종합 테스트 실패: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 테스트 데이터만 생성
     */
    @PostMapping("/create-test-data")
    public ResponseEntity<Map<String, Object>> createTestData(
            @RequestParam(required = false) String branchCode,
            @RequestParam(required = false) String date,
            @RequestParam(defaultValue = "complete") String scenario,
            HttpSession session) {
        
        log.info("📊 테스트 데이터 생성: branchCode={}, date={}, scenario={}", branchCode, date, scenario);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            LocalDate targetDate = (date != null && !date.isEmpty()) ? 
                LocalDate.parse(date) : LocalDate.now();
            
            if (branchCode == null || branchCode.isEmpty()) {
                branchCode = (String) session.getAttribute("currentBranchCode");
                if (branchCode == null) {
                    branchCode = "MAIN001";
                }
            }
            
            Map<String, Object> result;
            
            switch (scenario) {
                case "diverse":
                    result = testDataService.createDiverseTestScenarios(targetDate, branchCode);
                    break;
                case "complete":
                default:
                    result = testDataService.createCompleteTestDataSet(targetDate, branchCode);
                    break;
            }
            
            response.put("success", true);
            response.put("message", "테스트 데이터 생성 완료");
            response.put("result", result);
            response.put("scenario", scenario);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 테스트 데이터 생성 실패: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "테스트 데이터 생성 실패: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * PL/SQL 프로시저만 실행
     */
    @PostMapping("/run-plsql-only")
    public ResponseEntity<Map<String, Object>> runPlSqlOnly(
            @RequestParam(required = false) String branchCode,
            @RequestParam(required = false) String date,
            HttpSession session) {
        
        log.info("🚀 PL/SQL 프로시저만 실행: branchCode={}, date={}", branchCode, date);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            LocalDate targetDate = (date != null && !date.isEmpty()) ? 
                LocalDate.parse(date) : LocalDate.now();
            
            if (branchCode == null || branchCode.isEmpty()) {
                branchCode = (String) session.getAttribute("currentBranchCode");
                if (branchCode == null) {
                    branchCode = "MAIN001";
                }
            }
            
            // PL/SQL 프로시저 실행
            String dailyStatsResult = plSqlStatisticsService.updateDailyStatistics(branchCode, targetDate);
            String performanceResult = plSqlStatisticsService.updateAllConsultantPerformance(targetDate);
            int alertCount = plSqlStatisticsService.performDailyPerformanceMonitoring(targetDate);
            
            // 일관성 검증
            boolean isConsistent = plSqlStatisticsService.validateStatisticsConsistency(branchCode, targetDate);
            
            response.put("success", true);
            response.put("message", "PL/SQL 프로시저 실행 완료");
            response.put("results", Map.of(
                "dailyStats", dailyStatsResult,
                "performance", performanceResult,
                "alerts", alertCount,
                "consistency", isConsistent
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 프로시저 실행 실패: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "PL/SQL 실행 실패: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 스케줄러 수동 테스트
     */
    @PostMapping("/test-scheduler")
    public ResponseEntity<Map<String, Object>> testScheduler(
            @RequestParam(required = false) String date) {
        
        log.info("⏰ 스케줄러 수동 테스트: date={}", date);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String result;
            if (date != null && !date.isEmpty()) {
                LocalDate targetDate = LocalDate.parse(date);
                result = schedulerService.updateStatisticsForDate(targetDate);
            } else {
                result = schedulerService.updateYesterdayStatistics();
            }
            
            String status = schedulerService.getSchedulerStatus();
            
            response.put("success", true);
            response.put("message", "스케줄러 테스트 완료");
            response.put("result", result);
            response.put("status", status);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 스케줄러 테스트 실패: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "스케줄러 테스트 실패: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 테스트 데이터 정리
     */
    @DeleteMapping("/cleanup")
    public ResponseEntity<Map<String, Object>> cleanupTestData(
            @RequestParam(required = false) String branchCode,
            @RequestParam(required = false) String date,
            HttpSession session) {
        
        log.info("🧹 테스트 데이터 정리: branchCode={}, date={}", branchCode, date);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            LocalDate targetDate = (date != null && !date.isEmpty()) ? 
                LocalDate.parse(date) : LocalDate.now();
            
            if (branchCode == null || branchCode.isEmpty()) {
                branchCode = (String) session.getAttribute("currentBranchCode");
            }
            
            Map<String, Object> result = testDataService.cleanupTestData(targetDate, branchCode);
            
            response.put("success", true);
            response.put("message", "테스트 데이터 정리 완료");
            response.put("result", result);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 테스트 데이터 정리 실패: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "테스트 데이터 정리 실패: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 시스템 상태 종합 확인
     */
    @GetMapping("/system-status")
    public ResponseEntity<Map<String, Object>> getSystemStatus() {
        log.info("🔍 시스템 상태 종합 확인");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean plsqlAvailable = plSqlStatisticsService.isProcedureAvailable();
            String schedulerStatus = schedulerService.getSchedulerStatus();
            
            response.put("success", true);
            response.put("plsqlAvailable", plsqlAvailable);
            response.put("schedulerStatus", schedulerStatus);
            response.put("message", "시스템 상태 확인 완료");
            response.put("timestamp", LocalDate.now().toString());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 시스템 상태 확인 실패: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "시스템 상태 확인 실패: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
}
