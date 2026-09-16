package com.coresolution.consultation.controller;

import java.util.Map;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DiscountAccountingService;
import com.coresolution.consultation.service.DiscountAccountingService.DiscountAccountingResult;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.util.EmailLogMasking;
import com.coresolution.consultation.utils.SessionUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 할인 회계 처리 컨트롤러
 *
 * <p>운영재무 API — ADMIN 단락 허용, STAFF fail-closed, 그 외 ERP_ACCESS.</p>
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/discount-accounting") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class DiscountAccountingController {

    private final DiscountAccountingService discountAccountingService;
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
     * 할인 회계 거래 조회
     *
     * @param mappingId 매핑 ID
     * @param session HTTP 세션
     * @return 조회 결과
     */
    @GetMapping("/{mappingId}")
    public ResponseEntity<Map<String, Object>> getDiscountAccounting(
            @PathVariable Long mappingId, HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> denied = (ResponseEntity<Map<String, Object>>) accessCheck;
            return denied;
        }
        log.info("💰 할인 회계 거래 조회: mappingId={}", mappingId);

        try {
            DiscountAccountingResult result = discountAccountingService.getDiscountAccounting(mappingId);

            Map<String, Object> response = Map.of(
                "success", result.isSuccess(),
                "data", result,
                "message", result.getMessage()
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 할인 회계 거래 조회 실패: mappingId={}, 오류={}", mappingId, e.getMessage(), e);

            Map<String, Object> response = Map.of(
                "success", false,
                "message", "할인 회계 거래 조회 실패: " + e.getMessage()
            );

            return ResponseEntity.ok(response);
        }
    }

    /**
     * 할인 회계 거래 검증
     *
     * @param mappingId 매핑 ID
     * @param session HTTP 세션
     * @return 검증 결과
     */
    @GetMapping("/{mappingId}/validate")
    public ResponseEntity<Map<String, Object>> validateDiscountAccounting(
            @PathVariable Long mappingId, HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> denied = (ResponseEntity<Map<String, Object>>) accessCheck;
            return denied;
        }
        log.info("🔍 할인 회계 거래 검증: mappingId={}", mappingId);

        try {
            Map<String, Object> result = discountAccountingService.validateDiscountAccounting(mappingId);

            Map<String, Object> response = Map.of(
                "success", true,
                "data", result,
                "message", "할인 회계 거래 검증 완료"
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 할인 회계 거래 검증 실패: mappingId={}, 오류={}", mappingId, e.getMessage(), e);

            Map<String, Object> response = Map.of(
                "success", false,
                "message", "할인 회계 거래 검증 실패: " + e.getMessage()
            );

            return ResponseEntity.ok(response);
        }
    }

    /**
     * 할인 회계 거래 취소
     *
     * @param mappingId 매핑 ID
     * @param request 요청 본문
     * @param session HTTP 세션
     * @return 취소 결과
     */
    @PostMapping("/{mappingId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelDiscountAccounting(
            @PathVariable Long mappingId,
            @RequestBody Map<String, String> request,
            HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> denied = (ResponseEntity<Map<String, Object>>) accessCheck;
            return denied;
        }

        String reason = request.getOrDefault("reason", "사용자 요청에 의한 취소");

        log.info("💰 할인 회계 거래 취소: mappingId={}, reason={}", mappingId, reason);

        try {
            Map<String, Object> result = discountAccountingService.cancelDiscountAccounting(mappingId, reason);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("❌ 할인 회계 거래 취소 실패: mappingId={}, 오류={}", mappingId, e.getMessage(), e);

            Map<String, Object> response = Map.of(
                "success", false,
                "message", "할인 회계 거래 취소 실패: " + e.getMessage()
            );

            return ResponseEntity.ok(response);
        }
    }

    /**
     * 할인 회계 거래 수정
     *
     * @param mappingId 매핑 ID
     * @param request 요청 본문
     * @param session HTTP 세션
     * @return 수정 결과
     */
    @PutMapping("/{mappingId}")
    public ResponseEntity<Map<String, Object>> updateDiscountAccounting(
            @PathVariable Long mappingId,
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> denied = (ResponseEntity<Map<String, Object>>) accessCheck;
            return denied;
        }

        log.info("💰 할인 회계 거래 수정: mappingId={}", mappingId);

        try {
            Double newFinalAmount = ((Number) request.get("newFinalAmount")).doubleValue();

            Map<String, Object> result = discountAccountingService.updateDiscountAccounting(
                mappingId, null, java.math.BigDecimal.valueOf(newFinalAmount)
            );

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("❌ 할인 회계 거래 수정 실패: mappingId={}, 오류={}", mappingId, e.getMessage(), e);

            Map<String, Object> response = Map.of(
                "success", false,
                "message", "할인 회계 거래 수정 실패: " + e.getMessage()
            );

            return ResponseEntity.ok(response);
        }
    }
}
