package com.coresolution.consultation.controller;

import java.util.LinkedHashMap;
import java.util.Map;
import com.coresolution.consultation.service.PersonalDataDestructionService;
import com.coresolution.core.constants.SecurityRoleConstants;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 개인정보 파기 관리 컨트롤러.
 *
 * <p>P0 보안(2026-10-03):
 * <ul>
 *   <li>역할 가드가 없어 인증만 통과하면 내담자·상담사·사무원도 파기를 실행할 수 있었다.
 *       클래스 레벨 {@code @PreAuthorize} 로 ADMIN 전용으로 제한한다.</li>
 *   <li>파기는 되돌릴 수 없으므로 {@code GET /preview} → {@code POST /execute*} 2단계 확인을
 *       강제한다. 실행 요청에는 {@code confirm=true} 와 preview 건수와 일치하는
 *       {@code expectedCount} 가 모두 있어야 하며, 하나라도 없거나 건수가 달라지면 거부한다.</li>
 * </ul>
 *
 * @author MindGarden
 * @version 2.0.0
 * @since 2024-12-19
 * @updated 2026-10-03 - ADMIN 전용 RBAC + 2단계 확인(preview/execute) 적용
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/personal-data-destruction") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('" + SecurityRoleConstants.ROLE_ADMIN + "')")
public class PersonalDataDestructionController {

    /** 응답 상태 — 성공. */
    private static final String STATUS_SUCCESS = "success";

    /** 응답 상태 — 실패. */
    private static final String STATUS_ERROR = "error";

    /** 확인 절차 누락 거부 메시지. */
    private static final String MSG_CONFIRMATION_REQUIRED =
            "파기 확인이 필요합니다. 먼저 /preview 를 호출한 뒤 confirm=true 와 expectedCount 를 함께 전달하세요.";

    /** 확인 건수 불일치 거부 메시지. */
    private static final String MSG_CONFIRMATION_MISMATCH =
            "확인 건수가 현재 파기 대상 건수와 일치하지 않습니다. /preview 를 다시 호출하세요.";

    private final PersonalDataDestructionService personalDataDestructionService;

    /**
     * 개인정보 파기 현황 조회.
     *
     * @return 최근 1개월 파기 통계
     */
    @GetMapping("/status")
    public Map<String, Object> getPersonalDataDestructionStatus() {
        log.info("개인정보 파기 현황 조회");
        return personalDataDestructionService.getPersonalDataDestructionStatus();
    }

    /**
     * 파기 대상 건수 미리보기 (1단계). 아무것도 파기하지 않는다.
     *
     * @return 범위별 파기 대상 건수 + 합계
     */
    @GetMapping("/preview")
    public Map<String, Object> previewPersonalDataDestruction() {
        Map<String, Integer> counts = personalDataDestructionService.previewExpiredCounts();
        int total = counts.values().stream().mapToInt(Integer::intValue).sum();
        log.info("개인정보 파기 대상 미리보기: 합계={}건", total);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", STATUS_SUCCESS);
        result.put("scopes", counts);
        result.put("total", total);
        result.put("previewedAt", java.time.LocalDateTime.now());
        return result;
    }

    /**
     * 수동 개인정보 파기 실행 (2단계). {@code confirm=true} 와 {@code confirmDataId == dataId} 필수.
     *
     * @param dataType      데이터 유형
     * @param dataId        데이터 식별자
     * @param reason        파기 사유
     * @param confirm       확인 플래그
     * @param confirmDataId 확인용 데이터 식별자 (dataId 와 동일해야 함)
     * @return 파기 결과
     */
    @PostMapping("/execute")
    public ResponseEntity<Map<String, Object>> executeManualPersonalDataDestruction(
            @RequestParam String dataType,
            @RequestParam String dataId,
            @RequestParam String reason,
            @RequestParam(required = false) Boolean confirm,
            @RequestParam(required = false) String confirmDataId) {

        if (!Boolean.TRUE.equals(confirm)) {
            log.warn("수동 개인정보 파기 거부(확인 누락): 유형={}", dataType);
            return rejected(MSG_CONFIRMATION_REQUIRED);
        }
        if (confirmDataId == null || !confirmDataId.equals(dataId)) {
            log.warn("수동 개인정보 파기 거부(확인 식별자 불일치): 유형={}", dataType);
            return rejected(MSG_CONFIRMATION_MISMATCH);
        }

        log.info("수동 개인정보 파기 실행: 유형={}, 사유={}", dataType, reason);
        return ResponseEntity.ok(
                personalDataDestructionService.executeManualPersonalDataDestruction(dataType, dataId, reason));
    }

    /**
     * 만료된 사용자 데이터 파기 (2단계 확인 필수).
     *
     * @param confirm       확인 플래그
     * @param expectedCount preview 로 확인한 파기 대상 건수
     * @return 파기 결과
     */
    @PostMapping("/execute/user-data")
    public ResponseEntity<Map<String, Object>> destroyExpiredUserData(
            @RequestParam(required = false) Boolean confirm,
            @RequestParam(required = false) Integer expectedCount) {
        return executeScope(PersonalDataDestructionService.SCOPE_USER_DATA, confirm, expectedCount,
                personalDataDestructionService::destroyExpiredUserData,
                "만료된 사용자 데이터 파기가 완료되었습니다.");
    }

    /**
     * 만료된 상담 기록 파기 (2단계 확인 필수).
     *
     * @param confirm       확인 플래그
     * @param expectedCount preview 로 확인한 파기 대상 건수
     * @return 파기 결과
     */
    @PostMapping("/execute/consultation-data")
    public ResponseEntity<Map<String, Object>> destroyExpiredConsultationData(
            @RequestParam(required = false) Boolean confirm,
            @RequestParam(required = false) Integer expectedCount) {
        return executeScope(PersonalDataDestructionService.SCOPE_CONSULTATION_DATA, confirm, expectedCount,
                personalDataDestructionService::destroyExpiredConsultationData,
                "만료된 상담 기록 파기가 완료되었습니다.");
    }

    /**
     * 만료된 결제 데이터 파기 (2단계 확인 필수).
     *
     * @param confirm       확인 플래그
     * @param expectedCount preview 로 확인한 파기 대상 건수
     * @return 파기 결과
     */
    @PostMapping("/execute/payment-data")
    public ResponseEntity<Map<String, Object>> destroyExpiredPaymentData(
            @RequestParam(required = false) Boolean confirm,
            @RequestParam(required = false) Integer expectedCount) {
        return executeScope(PersonalDataDestructionService.SCOPE_PAYMENT_DATA, confirm, expectedCount,
                personalDataDestructionService::destroyExpiredPaymentData,
                "만료된 결제 데이터 파기가 완료되었습니다.");
    }

    /**
     * 만료된 급여 데이터 파기 (2단계 확인 필수).
     *
     * @param confirm       확인 플래그
     * @param expectedCount preview 로 확인한 파기 대상 건수
     * @return 파기 결과
     */
    @PostMapping("/execute/salary-data")
    public ResponseEntity<Map<String, Object>> destroyExpiredSalaryData(
            @RequestParam(required = false) Boolean confirm,
            @RequestParam(required = false) Integer expectedCount) {
        return executeScope(PersonalDataDestructionService.SCOPE_SALARY_DATA, confirm, expectedCount,
                personalDataDestructionService::destroyExpiredSalaryData,
                "만료된 급여 데이터 파기가 완료되었습니다.");
    }

    /**
     * 전체 만료된 개인정보 파기 (2단계 확인 필수).
     *
     * @param confirm       확인 플래그
     * @param expectedCount preview 합계와 일치해야 하는 건수
     * @return 범위별 파기 결과
     */
    @PostMapping("/execute/all")
    public ResponseEntity<Map<String, Object>> destroyAllExpiredPersonalData(
            @RequestParam(required = false) Boolean confirm,
            @RequestParam(required = false) Integer expectedCount) {

        ResponseEntity<Map<String, Object>> rejection =
                validateConfirmation(PersonalDataDestructionService.SCOPE_ALL, confirm, expectedCount);
        if (rejection != null) {
            return rejection;
        }

        log.info("전체 만료된 개인정보 파기 실행");
        try {
            int userDataDestroyed = personalDataDestructionService.destroyExpiredUserData();
            int consultationDataDestroyed = personalDataDestructionService.destroyExpiredConsultationData();
            int paymentDataDestroyed = personalDataDestructionService.destroyExpiredPaymentData();
            int salaryDataDestroyed = personalDataDestructionService.destroyExpiredSalaryData();
            int accessLogDestroyed = personalDataDestructionService.destroyExpiredAccessLogs();

            int totalDestroyed = userDataDestroyed + consultationDataDestroyed
                    + paymentDataDestroyed + salaryDataDestroyed + accessLogDestroyed;

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("status", STATUS_SUCCESS);
            result.put("message", "전체 만료된 개인정보 파기가 완료되었습니다.");
            result.put("totalDestroyed", totalDestroyed);
            result.put("details", Map.of(
                    PersonalDataDestructionService.SCOPE_USER_DATA, userDataDestroyed,
                    PersonalDataDestructionService.SCOPE_CONSULTATION_DATA, consultationDataDestroyed,
                    PersonalDataDestructionService.SCOPE_PAYMENT_DATA, paymentDataDestroyed,
                    PersonalDataDestructionService.SCOPE_SALARY_DATA, salaryDataDestroyed,
                    PersonalDataDestructionService.SCOPE_ACCESS_LOG, accessLogDestroyed
            ));
            result.put("executedAt", java.time.LocalDateTime.now());
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("전체 만료된 개인정보 파기 실패: {}", e.getMessage(), e);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("status", STATUS_ERROR);
            result.put("message", "전체 만료된 개인정보 파기에 실패했습니다.");
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * 범위별 파기 공통 처리 — 확인 검증 후 실행.
     *
     * @param scope          파기 범위
     * @param confirm        확인 플래그
     * @param expectedCount  기대 건수
     * @param destroyer      파기 실행 함수
     * @param successMessage 성공 메시지
     * @return 응답
     */
    private ResponseEntity<Map<String, Object>> executeScope(
            String scope, Boolean confirm, Integer expectedCount,
            java.util.function.IntSupplier destroyer, String successMessage) {

        ResponseEntity<Map<String, Object>> rejection = validateConfirmation(scope, confirm, expectedCount);
        if (rejection != null) {
            return rejection;
        }

        log.info("개인정보 파기 실행: scope={}", scope);
        try {
            int destroyedCount = destroyer.getAsInt();
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("status", STATUS_SUCCESS);
            result.put("message", successMessage);
            result.put("scope", scope);
            result.put("destroyedCount", destroyedCount);
            result.put("executedAt", java.time.LocalDateTime.now());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("개인정보 파기 실패: scope={}, {}", scope, e.getMessage(), e);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("status", STATUS_ERROR);
            result.put("message", "개인정보 파기에 실패했습니다.");
            result.put("scope", scope);
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * 2단계 확인 검증. 통과하면 null, 거부하면 400 응답을 반환한다.
     *
     * @param scope         파기 범위
     * @param confirm       확인 플래그
     * @param expectedCount 기대 건수
     * @return 거부 응답 또는 null
     */
    private ResponseEntity<Map<String, Object>> validateConfirmation(
            String scope, Boolean confirm, Integer expectedCount) {
        if (!Boolean.TRUE.equals(confirm) || expectedCount == null) {
            log.warn("개인정보 파기 거부(확인 누락): scope={}", scope);
            return rejected(MSG_CONFIRMATION_REQUIRED);
        }
        int actualCount = personalDataDestructionService.previewExpiredCount(scope);
        if (actualCount != expectedCount) {
            log.warn("개인정보 파기 거부(건수 불일치): scope={}, expected={}, actual={}",
                    scope, expectedCount, actualCount);
            return rejected(MSG_CONFIRMATION_MISMATCH);
        }
        return null;
    }

    private ResponseEntity<Map<String, Object>> rejected(String message) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", STATUS_ERROR);
        result.put("message", message);
        return ResponseEntity.badRequest().body(result);
    }
}
