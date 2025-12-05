package com.coresolution.consultation.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.service.PlSqlStatisticsService;
import com.coresolution.consultation.service.StatisticsSchedulerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 통계 관리 컨트롤러
 * PL/SQL 프로시저 수동 실행 및 상태 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/statistics-management") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
public class StatisticsManagementController {
    
    private final PlSqlStatisticsService plSqlStatisticsService;
    private final StatisticsSchedulerService statisticsSchedulerService;
    
    /**
     * PL/SQL 프로시저 상태 확인
     */
    @GetMapping("/plsql/status")
    public ResponseEntity<Map<String, Object>> checkPlSqlStatus() {
        log.info("🔍 PL/SQL 프로시저 상태 확인 요청");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean isAvailable = plSqlStatisticsService.isProcedureAvailable();
            
            response.put("success", true);
            response.put("plsqlAvailable", isAvailable);
            response.put("message", isAvailable ? "PL/SQL 프로시저가 정상적으로 사용 가능합니다." : "PL/SQL 프로시저를 사용할 수 없습니다.");
            
            log.info("✅ PL/SQL 프로시저 상태 확인 완료: 사용가능={}", isAvailable);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 프로시저 상태 확인 실패: 오류={}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "상태 확인 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 일별 통계 수동 업데이트 (특정 지점)
     */
    @PostMapping("/daily-stats/update")
    public ResponseEntity<Map<String, Object>> updateDailyStats(
            @RequestParam(required = false) String branchCode,
            @RequestParam(required = false) String date,
            HttpSession session) {
        
        log.info("📊 일별 통계 수동 업데이트 요청: branchCode={}, date={}", branchCode, date);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 날짜 파라미터 처리 (없으면 오늘)
            LocalDate targetDate = (date != null && !date.isEmpty()) ? 
                LocalDate.parse(date) : LocalDate.now();
            
            // 지점 코드 처리 (없으면 세션에서 가져오기)
            if (branchCode == null || branchCode.isEmpty()) {
                branchCode = (String) session.getAttribute("currentBranchCode");
            }
            
            String result;
            if (branchCode != null && !branchCode.isEmpty()) {
                // 특정 지점 통계 업데이트
                result = plSqlStatisticsService.updateDailyStatistics(branchCode, targetDate);
            } else {
                // 모든 지점 통계 업데이트
                result = plSqlStatisticsService.updateAllBranchDailyStatistics(targetDate);
            }
            
            response.put("success", true);
            response.put("message", "일별 통계 업데이트가 완료되었습니다.");
            response.put("result", result);
            response.put("branchCode", branchCode);
            response.put("date", targetDate.toString());
            
            log.info("✅ 일별 통계 수동 업데이트 완료: branchCode={}, date={}", branchCode, targetDate);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 일별 통계 수동 업데이트 실패: branchCode={}, date={}, 오류={}", 
                     branchCode, date, e.getMessage(), e);
            response.put("success", false);
            response.put("message", "통계 업데이트 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 상담사 성과 수동 업데이트
     */
    @PostMapping("/consultant-performance/update")
    public ResponseEntity<Map<String, Object>> updateConsultantPerformance(
            @RequestParam(required = false) Long consultantId,
            @RequestParam(required = false) String date) {
        
        log.info("📈 상담사 성과 수동 업데이트 요청: consultantId={}, date={}", consultantId, date);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 날짜 파라미터 처리 (없으면 오늘)
            LocalDate targetDate = (date != null && !date.isEmpty()) ? 
                LocalDate.parse(date) : LocalDate.now();
            
            String result;
            if (consultantId != null) {
                // 특정 상담사 성과 업데이트
                result = plSqlStatisticsService.updateConsultantPerformance(consultantId, targetDate);
            } else {
                // 모든 상담사 성과 업데이트
                result = plSqlStatisticsService.updateAllConsultantPerformance(targetDate);
            }
            
            response.put("success", true);
            response.put("message", "상담사 성과 업데이트가 완료되었습니다.");
            response.put("result", result);
            response.put("consultantId", consultantId);
            response.put("date", targetDate.toString());
            
            log.info("✅ 상담사 성과 수동 업데이트 완료: consultantId={}, date={}", consultantId, targetDate);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 상담사 성과 수동 업데이트 실패: consultantId={}, date={}, 오류={}", 
                     consultantId, date, e.getMessage(), e);
            response.put("success", false);
            response.put("message", "성과 업데이트 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 성과 모니터링 수동 실행
     */
    @PostMapping("/performance-monitoring/run")
    public ResponseEntity<Map<String, Object>> runPerformanceMonitoring(
            @RequestParam(required = false) String date) {
        
        log.info("🔔 성과 모니터링 수동 실행 요청: date={}", date);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 날짜 파라미터 처리 (없으면 오늘)
            LocalDate targetDate = (date != null && !date.isEmpty()) ? 
                LocalDate.parse(date) : LocalDate.now();
            
            int alertCount = plSqlStatisticsService.performDailyPerformanceMonitoring(targetDate);
            
            response.put("success", true);
            response.put("message", "성과 모니터링이 완료되었습니다.");
            response.put("alertCount", alertCount);
            response.put("date", targetDate.toString());
            
            log.info("✅ 성과 모니터링 수동 실행 완료: date={}, 생성된 알림={}개", targetDate, alertCount);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 성과 모니터링 수동 실행 실패: date={}, 오류={}", date, e.getMessage(), e);
            response.put("success", false);
            response.put("message", "성과 모니터링 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 통계 일관성 검증
     */
    @PostMapping("/validate-consistency")
    public ResponseEntity<Map<String, Object>> validateConsistency(
            @RequestParam(required = false) String branchCode,
            @RequestParam(required = false) String date,
            HttpSession session) {
        
        log.info("🔍 통계 일관성 검증 요청: branchCode={}, date={}", branchCode, date);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 날짜 파라미터 처리 (없으면 오늘)
            LocalDate targetDate = (date != null && !date.isEmpty()) ? 
                LocalDate.parse(date) : LocalDate.now();
            
            // 지점 코드 처리 (없으면 세션에서 가져오기)
            if (branchCode == null || branchCode.isEmpty()) {
                branchCode = (String) session.getAttribute("currentBranchCode");
            }
            
            if (branchCode == null || branchCode.isEmpty()) {
                response.put("success", false);
                response.put("message", "지점 코드가 필요합니다.");
                return ResponseEntity.ok(response);
            }
            
            boolean isConsistent = plSqlStatisticsService.validateStatisticsConsistency(branchCode, targetDate);
            
            response.put("success", true);
            response.put("consistent", isConsistent);
            response.put("message", isConsistent ? 
                "Java와 PL/SQL 통계 결과가 일치합니다." : 
                "Java와 PL/SQL 통계 결과가 일치하지 않습니다.");
            response.put("branchCode", branchCode);
            response.put("date", targetDate.toString());
            
            log.info("✅ 통계 일관성 검증 완료: branchCode={}, date={}, 일관성={}", 
                     branchCode, targetDate, isConsistent);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 통계 일관성 검증 실패: branchCode={}, date={}, 오류={}", 
                     branchCode, date, e.getMessage(), e);
            response.put("success", false);
            response.put("message", "일관성 검증 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 스케줄러 상태 확인
     */
    @GetMapping("/scheduler/status")
    public ResponseEntity<Map<String, Object>> getSchedulerStatus() {
        log.info("🔍 스케줄러 상태 확인 요청");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String status = statisticsSchedulerService.getSchedulerStatus();
            
            response.put("success", true);
            response.put("status", status);
            response.put("message", "스케줄러 상태 확인 완료");
            
            log.info("✅ 스케줄러 상태 확인 완료: status={}", status);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 스케줄러 상태 확인 실패: 오류={}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "스케줄러 상태 확인 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 어제 통계 수동 업데이트
     */
    @PostMapping("/scheduler/update-yesterday")
    public ResponseEntity<Map<String, Object>> updateYesterdayStatistics() {
        log.info("📊 어제 통계 수동 업데이트 요청");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String result = statisticsSchedulerService.updateYesterdayStatistics();
            
            response.put("success", true);
            response.put("message", "어제 통계 업데이트가 완료되었습니다.");
            response.put("result", result);
            response.put("date", LocalDate.now().minusDays(1).toString());
            
            log.info("✅ 어제 통계 수동 업데이트 완료: result={}", result);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 어제 통계 수동 업데이트 실패: 오류={}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "어제 통계 업데이트 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 특정 날짜 통계 수동 업데이트
     */
    @PostMapping("/scheduler/update-date")
    public ResponseEntity<Map<String, Object>> updateStatisticsForDate(
            @RequestParam String date) {
        log.info("📊 특정 날짜 통계 수동 업데이트 요청: date={}", date);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            LocalDate targetDate = LocalDate.parse(date);
            String result = statisticsSchedulerService.updateStatisticsForDate(targetDate);
            
            response.put("success", true);
            response.put("message", "특정 날짜 통계 업데이트가 완료되었습니다.");
            response.put("result", result);
            response.put("date", targetDate.toString());
            
            log.info("✅ 특정 날짜 통계 수동 업데이트 완료: date={}, result={}", targetDate, result);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 특정 날짜 통계 수동 업데이트 실패: date={}, 오류={}", date, e.getMessage(), e);
            response.put("success", false);
            response.put("message", "특정 날짜 통계 업데이트 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
}
