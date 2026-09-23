package com.coresolution.consultation.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.PlSqlAccountingService;
import com.coresolution.consultation.util.EmailLogMasking;
import com.coresolution.consultation.utils.SessionUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PL/SQL 통합회계 관리 컨트롤러
 * 복잡한 회계 로직을 PL/SQL로 처리하여 성능 향상 및 데이터 일관성 보장
 *
 * <p>운영재무 API — ADMIN 단락 허용, STAFF fail-closed, 그 외 ERP_ACCESS.</p>
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-25
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/plsql-accounting") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class PlSqlAccountingController {

    private final PlSqlAccountingService plSqlAccountingService;
    private final DynamicPermissionService dynamicPermissionService;

    /**
     * ERP 접근 권한 체크 ({@code ErpController.checkErpAccess} 와 동일 패턴).
     *
     * @param session HTTP 세션
     * @return 거부 시 401/403, 허용 시 null
     * @author MindGarden
     * @since 2026-09-08
     */
    private ResponseEntity<?> checkErpAccess(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(401).body(
                    Map.of("success", false, "message", "로그인이 필요합니다.", "redirectToLogin", true));
        }

        if (currentUser.getRole() != null && currentUser.getRole().isAdmin()) {
            log.debug("관리자 역할로 ERP 접근 허용, 사용자={}, 역할={}",
                    EmailLogMasking.maskForLog(currentUser.getEmail()), currentUser.getRole());
            return null;
        }

        if (currentUser.getRole() != null && currentUser.getRole().isStaff()) {
            log.warn("❌ STAFF ERP 접근 차단: 사용자={}, 역할={}",
                    EmailLogMasking.maskForLog(currentUser.getEmail()), currentUser.getRole());
            return ResponseEntity.status(403)
                    .body(Map.of("success", false, "message",
                            "ERP 접근 권한이 없습니다. 테넌트 관리자(ADMIN)에게 문의하세요."));
        }

        if (!dynamicPermissionService.hasPermission(currentUser, "ERP_ACCESS")) {
            log.warn("❌ ERP 접근 권한 없음: 사용자={}, 역할={}",
                    EmailLogMasking.maskForLog(currentUser.getEmail()), currentUser.getRole());
            return ResponseEntity.status(403)
                    .body(Map.of("success", false, "message",
                            "ERP 접근 권한이 없습니다. 테넌트 관리자(ADMIN)에게 문의하세요."));
        }

        return null;
    }

    /**
     * 통합 금액 검증 및 일관성 검사
     *
     * @param request 요청 본문
     * @param session HTTP 세션
     * @return 검증 결과
     */
    @PostMapping("/validate-amount")
    public ResponseEntity<Map<String, Object>> validateIntegratedAmount(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> denied = (ResponseEntity<Map<String, Object>>) accessCheck;
            return denied;
        }
        try {
            Long mappingId = request.get("mappingId") != null ?
                ((Number) request.get("mappingId")).longValue() : null;
            BigDecimal inputAmount = request.get("inputAmount") != null ?
                new BigDecimal(request.get("inputAmount").toString()) : null;

            log.info("🔍 통합 금액 검증 요청: MappingID={}, InputAmount={}", mappingId, inputAmount);

            if (mappingId == null || inputAmount == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "매핑 ID와 입력 금액이 필요합니다."
                ));
            }

            Map<String, Object> result = plSqlAccountingService.validateIntegratedAmount(mappingId, inputAmount);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("❌ 통합 금액 검증 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "통합 금액 검증 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 전사 통합 재무 현황 조회
     *
     * @param startDate 시작일
     * @param endDate 종료일
     * @param branchCodes 지점 코드
     * @param session HTTP 세션
     * @return 재무 현황
     */
    @GetMapping("/consolidated-financial")
    public ResponseEntity<Map<String, Object>> getConsolidatedFinancialData(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String branchCodes,
            HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> denied = (ResponseEntity<Map<String, Object>>) accessCheck;
            return denied;
        }

        try {
            LocalDate start = startDate != null ? LocalDate.parse(startDate) :
                LocalDate.now().withDayOfMonth(1);
            LocalDate end = endDate != null ? LocalDate.parse(endDate) :
                LocalDate.now();

            log.info("🏭 전사 통합 재무 현황 조회 요청: StartDate={}, EndDate={}, BranchCodes={}",
                start, end, branchCodes);

            Map<String, Object> result = plSqlAccountingService.getConsolidatedFinancialData(start, end, branchCodes);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("❌ 전사 통합 재무 현황 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "전사 통합 재무 현황 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 할인 회계 통합 처리
     *
     * @param request 요청 본문
     * @param session HTTP 세션
     * @return 처리 결과
     */
    @PostMapping("/process-discount")
    public ResponseEntity<Map<String, Object>> processDiscountAccounting(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> denied = (ResponseEntity<Map<String, Object>>) accessCheck;
            return denied;
        }
        try {
            Long mappingId = request.get("mappingId") != null ?
                ((Number) request.get("mappingId")).longValue() : null;
            String discountCode = (String) request.get("discountCode");
            BigDecimal originalAmount = request.get("originalAmount") != null ?
                new BigDecimal(request.get("originalAmount").toString()) : null;
            BigDecimal discountAmount = request.get("discountAmount") != null ?
                new BigDecimal(request.get("discountAmount").toString()) : null;
            BigDecimal finalAmount = request.get("finalAmount") != null ?
                new BigDecimal(request.get("finalAmount").toString()) : null;
            String discountType = (String) request.get("discountType");

            log.info("💰 할인 회계 처리 요청: MappingID={}, DiscountCode={}, Original={}, Final={}",
                mappingId, discountCode, originalAmount, finalAmount);

            if (mappingId == null || discountCode == null || originalAmount == null ||
                discountAmount == null || finalAmount == null || discountType == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "모든 필수 파라미터가 필요합니다."
                ));
            }

            Map<String, Object> result = plSqlAccountingService.processDiscountAccounting(
                mappingId, discountCode, originalAmount, discountAmount, finalAmount, discountType);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("❌ 할인 회계 처리 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "할인 회계 처리 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 재무 보고서 자동 생성
     *
     * @param reportType 보고서 유형
     * @param periodStart 기간 시작
     * @param periodEnd 기간 종료
     * @param branchCode 지점 코드
     * @param session HTTP 세션
     * @return 보고서
     */
    @GetMapping("/generate-report")
    public ResponseEntity<Map<String, Object>> generateFinancialReport(
            @RequestParam(required = false) String reportType,
            @RequestParam(required = false) String periodStart,
            @RequestParam(required = false) String periodEnd,
            @RequestParam(required = false) String branchCode,
            HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> denied = (ResponseEntity<Map<String, Object>>) accessCheck;
            return denied;
        }

        try {
            String type = reportType != null ? reportType : "monthly";
            LocalDate start = periodStart != null ? LocalDate.parse(periodStart) :
                LocalDate.now().withDayOfMonth(1);
            LocalDate end = periodEnd != null ? LocalDate.parse(periodEnd) :
                LocalDate.now();

            log.info("📊 재무 보고서 생성 요청: Type={}, Start={}, End={}, Branch={}",
                type, start, end, branchCode);

            Map<String, Object> result = plSqlAccountingService.generateFinancialReport(
                type, start, end, branchCode);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("❌ 재무 보고서 생성 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "재무 보고서 생성 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * PL/SQL 프로시저 상태 확인
     *
     * @param session HTTP 세션
     * @return 상태
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> checkPlSqlStatus(HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> denied = (ResponseEntity<Map<String, Object>>) accessCheck;
            return denied;
        }
        try {
            log.info("🔍 PL/SQL 프로시저 상태 확인 요청");

            Map<String, Object> result = plSqlAccountingService.checkPlSqlStatus();

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("❌ PL/SQL 프로시저 상태 확인 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "PL/SQL 프로시저 상태 확인 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
}
