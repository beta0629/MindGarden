package com.mindgarden.consultation.controller;

import java.time.LocalDate;
import java.util.Map;
import com.mindgarden.consultation.service.PlSqlScheduleValidationService;
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
@RequestMapping("/api/local-test")
@ConditionalOnProperty(name = "spring.profiles.active", havingValue = "local")
public class LocalTestController {
    
    @Autowired
    private PlSqlScheduleValidationService plSqlScheduleValidationService;
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
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
