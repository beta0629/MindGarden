package com.mindgarden.consultation.controller;

import java.time.LocalDate;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;
import com.mindgarden.consultation.service.PlSqlScheduleValidationService;
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
}
