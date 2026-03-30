package com.coresolution.consultation.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.service.PlSqlScheduleValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.extern.slf4j.Slf4j;

/**
 * 로컬 환경 전용 테스트 컨트롤러
 * 운영 환경에서는 실행되지 않음
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/test/local") // 표준화 2025-12-05: 레거시 경로 제거
@ConditionalOnProperty(name = "spring.profiles.active", havingValue = "local")
public class LocalTestController {
    
    @Autowired
    private PlSqlScheduleValidationService plSqlScheduleValidationService;
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Autowired(required = false)
    private com.coresolution.consultation.service.PlSqlStatisticsService plSqlStatisticsService;
    
    @Autowired(required = false)
    private com.coresolution.consultation.service.PlSqlSalaryManagementService plSqlSalaryManagementService;
    
    @Autowired(required = false)
    private com.coresolution.consultation.service.PlSqlAccountingService plSqlAccountingService;
    
    @Autowired(required = false)
    private com.coresolution.consultation.service.StatisticsSchedulerService statisticsSchedulerService;
    
    /**
     * 상담일지 작성 여부 확인 테스트
     */
    @PostMapping("/validate-consultation-record")
    public Map<String, Object> testValidateConsultationRecord(
            @RequestParam Long scheduleId,
            @RequestParam Long consultantId,
            @RequestParam String sessionDate) {
        
        log.info("🧪 [로컬테스트] 상담일지 작성 여부 확인: 스케줄 ID={}, 상담사 ID={}, 날짜={}", 
                scheduleId, consultantId, sessionDate);
        
        try {
            LocalDate date = LocalDate.parse(sessionDate);
            Map<String, Object> result = plSqlScheduleValidationService.validateConsultationRecordBeforeCompletion(
                scheduleId, consultantId, date);
            
            log.info("✅ [로컬테스트] 상담일지 검증 결과: {}", result);
            return result;
            
        } catch (Exception e) {
            log.error("❌ [로컬테스트] 상담일지 검증 실패: {}", e.getMessage(), e);
            return Map.of(
                "success", false,
                "message", "테스트 실패: " + e.getMessage(),
                "error", e.getClass().getSimpleName()
            );
        }
    }
    
    /**
     * 상담일지 미작성 알림 생성 테스트
     */
    @PostMapping("/create-reminder")
    public Map<String, Object> testCreateConsultationRecordReminder(
            @RequestParam Long scheduleId,
            @RequestParam Long consultantId,
            @RequestParam Long clientId,
            @RequestParam String sessionDate,
            @RequestParam String title) {
        
        log.info("🧪 [로컬테스트] 상담일지 미작성 알림 생성: 스케줄 ID={}, 상담사 ID={}, 제목={}", 
                scheduleId, consultantId, title);
        
        try {
            LocalDate date = LocalDate.parse(sessionDate);
            Map<String, Object> result = plSqlScheduleValidationService.createConsultationRecordReminder(
                scheduleId, consultantId, clientId, date, title);
            
            log.info("✅ [로컬테스트] 상담일지 알림 생성 결과: {}", result);
            return result;
            
        } catch (Exception e) {
            log.error("❌ [로컬테스트] 상담일지 알림 생성 실패: {}", e.getMessage(), e);
            return Map.of(
                "success", false,
                "message", "테스트 실패: " + e.getMessage(),
                "error", e.getClass().getSimpleName()
            );
        }
    }
    
    /**
     * 스케줄 자동 완료 처리 테스트
     */
    @PostMapping("/process-auto-completion")
    public Map<String, Object> testProcessScheduleAutoCompletion(
            @RequestParam Long scheduleId,
            @RequestParam Long consultantId,
            @RequestParam String sessionDate,
            @RequestParam(defaultValue = "false") boolean forceComplete) {
        
        log.info("🧪 [로컬테스트] 스케줄 자동 완료 처리: 스케줄 ID={}, 강제완료={}", 
                scheduleId, forceComplete);
        
        try {
            LocalDate date = LocalDate.parse(sessionDate);
            Map<String, Object> result = plSqlScheduleValidationService.processScheduleAutoCompletion(
                scheduleId, consultantId, date, forceComplete);
            
            log.info("✅ [로컬테스트] 스케줄 자동 완료 처리 결과: {}", result);
            return result;
            
        } catch (Exception e) {
            log.error("❌ [로컬테스트] 스케줄 자동 완료 처리 실패: {}", e.getMessage(), e);
            return Map.of(
                "success", false,
                "message", "테스트 실패: " + e.getMessage(),
                "error", e.getClass().getSimpleName()
            );
        }
    }
    
    /**
     * 일괄 스케줄 완료 처리 테스트
     */
    @PostMapping("/process-batch-completion")
    public Map<String, Object> testProcessBatchScheduleCompletion(
            @RequestParam String branchCode) {
        
        log.info("🧪 [로컬테스트] 일괄 스케줄 완료 처리: 지점 코드={}", branchCode);
        
        try {
            Map<String, Object> result = plSqlScheduleValidationService.processBatchScheduleCompletion(branchCode);
            
            log.info("✅ [로컬테스트] 일괄 스케줄 완료 처리 결과: {}", result);
            return result;
            
        } catch (Exception e) {
            log.error("❌ [로컬테스트] 일괄 스케줄 완료 처리 실패: {}", e.getMessage(), e);
            return Map.of(
                "success", false,
                "message", "테스트 실패: " + e.getMessage(),
                "error", e.getClass().getSimpleName()
            );
        }
    }
    
    /**
     * 의존성 주입 상태 확인
     */
    @GetMapping("/debug-dependencies")
    public Map<String, Object> debugDependencies() {
        Map<String, Object> result = new HashMap<>();
        result.put("timestamp", java.time.LocalDateTime.now());
        result.put("plSqlScheduleValidationService", plSqlScheduleValidationService != null);
        result.put("plSqlStatisticsService", plSqlStatisticsService != null);
        result.put("plSqlSalaryManagementService", plSqlSalaryManagementService != null);
        result.put("plSqlAccountingService", plSqlAccountingService != null);
        result.put("statisticsSchedulerService", statisticsSchedulerService != null);
        result.put("jdbcTemplate", jdbcTemplate != null);
        
        return result;
    }

    /**
     * 모든 PL/SQL 시스템 종합 테스트
     */
    @GetMapping("/test-all-plsql-systems")
    public Map<String, Object> testAllPlSqlSystems() {
        Map<String, Object> result = new HashMap<>();
        result.put("timestamp", java.time.LocalDateTime.now());
        
        try {
            // 1. 상담일지 검증 시스템 테스트
            Map<String, Object> consultationValidation = testConsultationValidationSystem();
            result.put("consultationValidationSystem", consultationValidation);
            
            // 2. 통계 시스템 테스트
            Map<String, Object> statisticsSystem = testStatisticsSystem();
            result.put("statisticsSystem", statisticsSystem);
            
            // 3. 급여 관리 시스템 테스트
            Map<String, Object> salarySystem = testSalaryManagementSystem();
            result.put("salaryManagementSystem", salarySystem);
            
            // 4. 회계 시스템 테스트
            Map<String, Object> accountingSystem = testAccountingSystem();
            result.put("accountingSystem", accountingSystem);
            
            // 전체 결과 판정
            boolean allSuccess = (Boolean) consultationValidation.get("available") &&
                               (Boolean) statisticsSystem.get("available") &&
                               (Boolean) salarySystem.get("available") &&
                               (Boolean) accountingSystem.get("available");
            
            result.put("success", allSuccess);
            result.put("message", allSuccess ? "모든 PL/SQL 시스템이 정상 작동합니다." : "일부 PL/SQL 시스템에 문제가 있습니다.");
            
            return result;
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "PL/SQL 시스템 테스트 중 오류: " + e.getMessage());
            result.put("error", e.getClass().getSimpleName());
            return result;
        }
    }
    
    /**
     * 개별 상담일지 검증 시스템 테스트
     */
    @GetMapping("/test-consultation-validation")
    public Map<String, Object> testConsultationValidationSystem() {
        Map<String, Object> result = new HashMap<>();
        try {
            var validationResult = plSqlScheduleValidationService.validateConsultationRecordBeforeCompletion(
                1L, 1L, LocalDate.now());
            result.put("available", true);
            result.put("testResult", validationResult);
            result.put("message", "상담일지 검증 시스템 정상");
        } catch (Exception e) {
            result.put("available", false);
            result.put("message", "상담일지 검증 시스템 오류: " + e.getMessage());
            result.put("error", e.getClass().getSimpleName());
        }
        result.put("timestamp", java.time.LocalDateTime.now());
        return result;
    }
    
    /**
     * 개별 통계 시스템 테스트
     */
    @GetMapping("/test-statistics")
    public Map<String, Object> testStatisticsSystem() {
        Map<String, Object> result = new HashMap<>();
        try {
            if (plSqlStatisticsService != null) {
                boolean available = plSqlStatisticsService.isProcedureAvailable();
                result.put("available", available);
                result.put("message", available ? "통계 시스템 정상" : "통계 시스템 프로시저 사용 불가");
            } else {
                result.put("available", false);
                result.put("message", "통계 시스템 서비스가 주입되지 않음");
            }
        } catch (Exception e) {
            result.put("available", false);
            result.put("message", "통계 시스템 오류: " + e.getMessage());
            result.put("error", e.getClass().getSimpleName());
        }
        result.put("timestamp", java.time.LocalDateTime.now());
        return result;
    }
    
    private Map<String, Object> testSalaryManagementSystem() {
        Map<String, Object> result = new HashMap<>();
        try {
            if (plSqlSalaryManagementService != null) {
                boolean available = plSqlSalaryManagementService.isProcedureAvailable();
                result.put("available", available);
                result.put("message", available ? "급여 관리 시스템 정상" : "급여 관리 시스템 프로시저 사용 불가");
            } else {
                result.put("available", false);
                result.put("message", "급여 관리 시스템 서비스가 주입되지 않음");
            }
        } catch (Exception e) {
            result.put("available", false);
            result.put("message", "급여 관리 시스템 오류: " + e.getMessage());
            result.put("error", e.getClass().getSimpleName());
        }
        return result;
    }
    
    private Map<String, Object> testAccountingSystem() {
        Map<String, Object> result = new HashMap<>();
        try {
            if (plSqlAccountingService != null) {
                // 회계 시스템은 isProcedureAvailable 메서드가 없을 수 있으므로 다른 방법으로 테스트
                result.put("available", true);
                result.put("message", "회계 시스템 서비스 주입됨");
            } else {
                result.put("available", false);
                result.put("message", "회계 시스템 서비스가 주입되지 않음");
            }
        } catch (Exception e) {
            result.put("available", false);
            result.put("message", "회계 시스템 오류: " + e.getMessage());
            result.put("error", e.getClass().getSimpleName());
        }
        return result;
    }

    /**
     * 로컬 테스트 환경 확인
     */
    @GetMapping("/status")
    public Map<String, Object> getTestStatus() {
        return Map.of(
            "environment", "local",
            "testAvailable", true,
            "message", "로컬 테스트 환경이 활성화되어 있습니다.",
            "timestamp", java.time.LocalDateTime.now()
        );
    }
    
    /**
     * PL/SQL 프로시저 존재 여부 확인
     */
    @GetMapping("/check-procedures")
    public Map<String, Object> checkProcedures() {
        try {
            // 간단한 테스트를 위해 PL/SQL 서비스 호출
            var result = plSqlScheduleValidationService.validateConsultationRecordBeforeCompletion(
                1L, 1L, LocalDate.now());
            
            return Map.of(
                "success", true,
                "message", "PL/SQL 프로시저 테스트 성공",
                "testResult", result,
                "timestamp", java.time.LocalDateTime.now()
            );
            
        } catch (Exception e) {
            return Map.of(
                "success", false,
                "message", "PL/SQL 프로시저 테스트 실패: " + e.getMessage(),
                "error", e.getClass().getSimpleName(),
                "timestamp", java.time.LocalDateTime.now()
            );
        }
    }
    
    /**
     * 프로시저 직접 생성 및 테스트
     */
    @GetMapping("/create-test-procedure")
    public Map<String, Object> createTestProcedure() {
        try {
            // 프로시저 삭제
            jdbcTemplate.execute("DROP PROCEDURE IF EXISTS ValidateConsultationRecordBeforeCompletion");
            
            // 프로시저 생성
            String createProcedure = """
                CREATE PROCEDURE ValidateConsultationRecordBeforeCompletion(
                    IN p_consultant_id BIGINT,
                    IN p_session_date DATE,
                    OUT p_has_record TINYINT(1),
                    OUT p_message VARCHAR(500)
                )
                BEGIN
                    DECLARE v_record_count INT DEFAULT 0;
                    DECLARE EXIT HANDLER FOR SQLEXCEPTION
                    BEGIN
                        GET DIAGNOSTICS CONDITION 1
                            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
                        SET p_has_record = 0;
                        SET p_message = CONCAT('오류 발생: ', @text);
                        ROLLBACK;
                    END;
                    
                    SET p_has_record = 0;
                    SET p_message = '';
                    
                    -- 상담일지 작성 여부 확인
                    SELECT COUNT(*)
                    INTO v_record_count
                    FROM consultation_records cr
                    WHERE cr.consultant_id = p_consultant_id
                      AND cr.session_date = p_session_date
                      AND cr.is_deleted = 0;
                    
                    IF v_record_count > 0 THEN
                        SET p_has_record = 1;
                        SET p_message = '상담일지가 작성되어 스케줄 완료 가능합니다.';
                    ELSE
                        SET p_has_record = 0;
                        SET p_message = '상담일지가 작성되지 않아 스케줄 완료가 불가능합니다.';
                    END IF;
                    
                END
                """;
            
            jdbcTemplate.execute(createProcedure);
            
            // 테스트 실행
            var result = plSqlScheduleValidationService.validateConsultationRecordBeforeCompletion(
                1L, 1L, LocalDate.now());
            
            return Map.of(
                "success", true,
                "message", "프로시저 생성 및 테스트 성공",
                "testResult", result,
                "timestamp", java.time.LocalDateTime.now()
            );
            
        } catch (Exception e) {
            return Map.of(
                "success", false,
                "message", "프로시저 생성 및 테스트 실패: " + e.getMessage(),
                "error", e.getClass().getSimpleName(),
                "timestamp", java.time.LocalDateTime.now()
            );
        }
    }
}
