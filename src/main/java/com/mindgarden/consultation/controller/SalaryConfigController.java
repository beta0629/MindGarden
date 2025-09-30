package com.mindgarden.consultation.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.CommonCodeService;
import com.mindgarden.consultation.service.DynamicPermissionService;
import com.mindgarden.consultation.service.SalaryBatchService;
import com.mindgarden.consultation.service.SalaryScheduleService;
import com.mindgarden.consultation.util.PermissionCheckUtils;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 급여 설정 관리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-25
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/salary-config")
@RequiredArgsConstructor
public class SalaryConfigController {
    
    private final CommonCodeService commonCodeService;
    private final SalaryScheduleService salaryScheduleService;
    private final SalaryBatchService salaryBatchService;
    private final DynamicPermissionService dynamicPermissionService;
    
    /**
     * 급여 설정 조회
     */
    @GetMapping("/settings")
    public ResponseEntity<Map<String, Object>> getSalarySettings(HttpSession session) {
        try {
            // 동적 권한 체크
            ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session, "SALARY_MANAGE", dynamicPermissionService);
            if (permissionResponse != null) {
                return (ResponseEntity<Map<String, Object>>) permissionResponse;
            }
            
            User currentUser = SessionUtils.getCurrentUser(session);
            
            // 급여 기산일 설정
            List<CommonCode> baseDateSettings = commonCodeService.getCodesByGroup("SALARY_BASE_DATE");
            
            // 급여 배치 주기 설정
            List<CommonCode> batchCycleSettings = commonCodeService.getCodesByGroup("SALARY_BATCH_CYCLE");
            
            // 급여 계산 방식 설정
            List<CommonCode> calculationMethods = commonCodeService.getCodesByGroup("SALARY_CALCULATION_METHOD");
            
            // 세금 계산 방식 설정
            List<CommonCode> taxMethods = commonCodeService.getCodesByGroup("TAX_CALCULATION_TYPE");
            
            // 현재 설정된 기산일 정보
            LocalDate currentBaseDate = salaryScheduleService.getCurrentMonthBaseDate();
            LocalDate currentPaymentDate = salaryScheduleService.getCurrentMonthPaymentDate();
            LocalDate currentCutoffDate = salaryScheduleService.getCurrentMonthCutoffDate();
            
            Map<String, Object> result = new HashMap<>();
            result.put("baseDateSettings", baseDateSettings);
            result.put("batchCycleSettings", batchCycleSettings);
            result.put("calculationMethods", calculationMethods);
            result.put("taxMethods", taxMethods);
            result.put("currentSettings", Map.of(
                "baseDate", currentBaseDate,
                "paymentDate", currentPaymentDate,
                "cutoffDate", currentCutoffDate
            ));
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", result,
                "message", "급여 설정을 조회했습니다."
            ));
            
        } catch (Exception e) {
            log.error("급여 설정 조회 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "급여 설정 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 기산일 설정 변경
     */
    @PutMapping("/base-date")
    public ResponseEntity<Map<String, Object>> updateBaseDate(
            @RequestBody Map<String, Object> request, 
            HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 급여 관리 권한 확인 (관리자, 지점 수퍼 관리자, 본사 관리자)
            if (!currentUser.getRole().isAdmin() && 
                !currentUser.getRole().isBranchSuperAdmin() && 
                !currentUser.getRole().isHeadquartersAdmin()) {
                return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "급여 관리 권한이 없습니다."
                ));
            }
            
            
            String baseDayType = (String) request.get("baseDayType"); // "LAST_DAY" 또는 숫자
            String paymentDay = String.valueOf(request.get("paymentDay"));
            String cutoffDayType = (String) request.get("cutoffDayType");
            
            // 급여 기산일 업데이트
            commonCodeService.updateCodeExtraData(
                "SALARY_BASE_DATE", 
                "MONTHLY_BASE_DAY",
                String.format("{\"default_day\": \"%s\", \"description\": \"급여 계산 기준일\"}", baseDayType)
            );
            
            // 급여 지급일 업데이트
            commonCodeService.updateCodeExtraData(
                "SALARY_BASE_DATE", 
                "PAYMENT_DAY",
                String.format("{\"default_day\": %s, \"description\": \"급여 지급일\"}", paymentDay)
            );
            
            // 급여 마감일 업데이트
            commonCodeService.updateCodeExtraData(
                "SALARY_BASE_DATE", 
                "CUTOFF_DAY",
                String.format("{\"default_day\": \"%s\", \"description\": \"급여 마감일\"}", cutoffDayType)
            );
            
            log.info("급여 기산일 설정 변경: 사용자={}, 기산일={}, 지급일={}, 마감일={}", 
                    currentUser.getName(), baseDayType, paymentDay, cutoffDayType);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "급여 기산일이 변경되었습니다."
            ));
            
        } catch (Exception e) {
            log.error("급여 기산일 변경 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "급여 기산일 변경 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 계산 방식 설정 변경
     */
    @PutMapping("/calculation-method")
    public ResponseEntity<Map<String, Object>> updateCalculationMethod(
            @RequestBody Map<String, Object> request, 
            HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            String methodCode = (String) request.get("methodCode");
            String ratePerConsultation = String.valueOf(request.get("ratePerConsultation"));
            String defaultHourlyRate = String.valueOf(request.get("defaultHourlyRate"));
            
            // 상담건수 기준 요율 업데이트
            commonCodeService.updateCodeExtraData(
                "SALARY_CALCULATION_METHOD", 
                "CONSULTATION_COUNT",
                String.format("{\"rate_per_consultation\": %s}", ratePerConsultation)
            );
            
            // 시간당 기본 요율 업데이트
            commonCodeService.updateCodeExtraData(
                "SALARY_CALCULATION_METHOD", 
                "HOURLY_RATE",
                String.format("{\"default_hourly_rate\": %s}", defaultHourlyRate)
            );
            
            log.info("급여 계산 방식 설정 변경: 사용자={}, 방식={}", currentUser.getName(), methodCode);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "급여 계산 방식이 변경되었습니다."
            ));
            
        } catch (Exception e) {
            log.error("급여 계산 방식 변경 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "급여 계산 방식 변경 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 배치 실행
     */
    @PutMapping("/execute-batch")
    public ResponseEntity<Map<String, Object>> executeSalaryBatch(
            @RequestBody Map<String, Object> request, 
            HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 관리자 권한 확인
            if (!"MASTER_ADMIN".equals(currentUser.getRole().name()) && 
                !"BRANCH_SUPER_ADMIN".equals(currentUser.getRole().name())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "급여 배치 실행 권한이 없습니다."
                ));
            }
            
            String targetMonth = (String) request.get("targetMonth"); // "YYYY-MM"
            String branchCode = currentUser.getBranchCode();
            
            // 배치 실행 가능 시간 확인
            if (!salaryScheduleService.isBatchExecutionTime()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "급여 배치 실행 가능 시간이 아닙니다."
                ));
            }
            
            // 실제 배치 실행 로직 구현
            String[] monthParts = targetMonth.split("-");
            int targetYear = Integer.parseInt(monthParts[0]);
            int targetMonthInt = Integer.parseInt(monthParts[1]);
            
            SalaryBatchService.BatchResult result = salaryBatchService.executeMonthlySalaryBatch(
                targetYear, targetMonthInt, branchCode);
            
            log.info("급여 배치 실행: 사용자={}, 대상월={}, 지점={}, 결과={}", 
                    currentUser.getName(), targetMonth, branchCode, result.isSuccess());
            
            if (result.isSuccess()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", String.format("%s 급여 배치가 성공적으로 실행되었습니다.", targetMonth),
                    "details", result.getMessage()
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", String.format("%s 급여 배치 실행 실패: %s", targetMonth, result.getMessage())
                ));
            }
            
        } catch (Exception e) {
            log.error("급여 배치 실행 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "급여 배치 실행 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
}
