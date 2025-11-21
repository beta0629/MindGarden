package com.coresolution.consultation.controller;

import java.util.Map;
import com.coresolution.consultation.service.PersonalDataDestructionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 개인정보 파기 관리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/admin/personal-data-destruction", "/api/admin/personal-data-destruction"}) // v1 경로 추가, 레거시 경로 유지
@RequiredArgsConstructor
public class PersonalDataDestructionController {
    
    private final PersonalDataDestructionService personalDataDestructionService;
    
    /**
     * 개인정보 파기 현황 조회
     */
    @GetMapping("/status")
    public Map<String, Object> getPersonalDataDestructionStatus() {
        log.info("개인정보 파기 현황 조회");
        return personalDataDestructionService.getPersonalDataDestructionStatus();
    }
    
    /**
     * 수동 개인정보 파기 실행
     */
    @PostMapping("/execute")
    public Map<String, Object> executeManualPersonalDataDestruction(
            @RequestParam String dataType,
            @RequestParam String dataId,
            @RequestParam String reason) {
        
        log.info("수동 개인정보 파기 실행: 유형={}, ID={}, 사유={}", dataType, dataId, reason);
        return personalDataDestructionService.executeManualPersonalDataDestruction(dataType, dataId, reason);
    }
    
    /**
     * 만료된 사용자 데이터 파기
     */
    @PostMapping("/execute/user-data")
    public Map<String, Object> destroyExpiredUserData() {
        log.info("만료된 사용자 데이터 파기 실행");
        
        try {
            int destroyedCount = personalDataDestructionService.destroyExpiredUserData();
            
            return Map.of(
                "status", "success",
                "message", "만료된 사용자 데이터 파기가 완료되었습니다.",
                "destroyedCount", destroyedCount,
                "executedAt", java.time.LocalDateTime.now()
            );
            
        } catch (Exception e) {
            log.error("만료된 사용자 데이터 파기 실패: {}", e.getMessage(), e);
            return Map.of(
                "status", "error",
                "message", "만료된 사용자 데이터 파기에 실패했습니다: " + e.getMessage()
            );
        }
    }
    
    /**
     * 만료된 상담 기록 파기
     */
    @PostMapping("/execute/consultation-data")
    public Map<String, Object> destroyExpiredConsultationData() {
        log.info("만료된 상담 기록 파기 실행");
        
        try {
            int destroyedCount = personalDataDestructionService.destroyExpiredConsultationData();
            
            return Map.of(
                "status", "success",
                "message", "만료된 상담 기록 파기가 완료되었습니다.",
                "destroyedCount", destroyedCount,
                "executedAt", java.time.LocalDateTime.now()
            );
            
        } catch (Exception e) {
            log.error("만료된 상담 기록 파기 실패: {}", e.getMessage(), e);
            return Map.of(
                "status", "error",
                "message", "만료된 상담 기록 파기에 실패했습니다: " + e.getMessage()
            );
        }
    }
    
    /**
     * 만료된 결제 데이터 파기
     */
    @PostMapping("/execute/payment-data")
    public Map<String, Object> destroyExpiredPaymentData() {
        log.info("만료된 결제 데이터 파기 실행");
        
        try {
            int destroyedCount = personalDataDestructionService.destroyExpiredPaymentData();
            
            return Map.of(
                "status", "success",
                "message", "만료된 결제 데이터 파기가 완료되었습니다.",
                "destroyedCount", destroyedCount,
                "executedAt", java.time.LocalDateTime.now()
            );
            
        } catch (Exception e) {
            log.error("만료된 결제 데이터 파기 실패: {}", e.getMessage(), e);
            return Map.of(
                "status", "error",
                "message", "만료된 결제 데이터 파기에 실패했습니다: " + e.getMessage()
            );
        }
    }
    
    /**
     * 만료된 급여 데이터 파기
     */
    @PostMapping("/execute/salary-data")
    public Map<String, Object> destroyExpiredSalaryData() {
        log.info("만료된 급여 데이터 파기 실행");
        
        try {
            int destroyedCount = personalDataDestructionService.destroyExpiredSalaryData();
            
            return Map.of(
                "status", "success",
                "message", "만료된 급여 데이터 파기가 완료되었습니다.",
                "destroyedCount", destroyedCount,
                "executedAt", java.time.LocalDateTime.now()
            );
            
        } catch (Exception e) {
            log.error("만료된 급여 데이터 파기 실패: {}", e.getMessage(), e);
            return Map.of(
                "status", "error",
                "message", "만료된 급여 데이터 파기에 실패했습니다: " + e.getMessage()
            );
        }
    }
    
    /**
     * 전체 만료된 개인정보 파기
     */
    @PostMapping("/execute/all")
    public Map<String, Object> destroyAllExpiredPersonalData() {
        log.info("전체 만료된 개인정보 파기 실행");
        
        try {
            // 각 유형별 파기 실행
            int userDataDestroyed = personalDataDestructionService.destroyExpiredUserData();
            int consultationDataDestroyed = personalDataDestructionService.destroyExpiredConsultationData();
            int paymentDataDestroyed = personalDataDestructionService.destroyExpiredPaymentData();
            int salaryDataDestroyed = personalDataDestructionService.destroyExpiredSalaryData();
            int accessLogDestroyed = personalDataDestructionService.destroyExpiredAccessLogs();
            
            int totalDestroyed = userDataDestroyed + consultationDataDestroyed + 
                               paymentDataDestroyed + salaryDataDestroyed + accessLogDestroyed;
            
            return Map.of(
                "status", "success",
                "message", "전체 만료된 개인정보 파기가 완료되었습니다.",
                "totalDestroyed", totalDestroyed,
                "details", Map.of(
                    "userData", userDataDestroyed,
                    "consultationData", consultationDataDestroyed,
                    "paymentData", paymentDataDestroyed,
                    "salaryData", salaryDataDestroyed,
                    "accessLog", accessLogDestroyed
                ),
                "executedAt", java.time.LocalDateTime.now()
            );
            
        } catch (Exception e) {
            log.error("전체 만료된 개인정보 파기 실패: {}", e.getMessage(), e);
            return Map.of(
                "status", "error",
                "message", "전체 만료된 개인정보 파기에 실패했습니다: " + e.getMessage()
            );
        }
    }
}
