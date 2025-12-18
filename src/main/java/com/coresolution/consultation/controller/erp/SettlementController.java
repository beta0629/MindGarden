package com.coresolution.consultation.controller.erp;

import java.util.List;
import java.util.Map;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.settlement.Settlement;
import com.coresolution.consultation.entity.erp.settlement.SettlementRule;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.erp.settlement.SettlementService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 정산 Controller 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md API 설계 표준:
 * docs/standards/API_DESIGN_STANDARD.md
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/erp/settlement")
@RequiredArgsConstructor
public class SettlementController extends BaseApiController {

    private final SettlementService settlementService;
    private final DynamicPermissionService dynamicPermissionService;
    private final Environment environment;

    /**
     * ERP 접근 권한 체크 (동적 권한 시스템)
     */
    private ResponseEntity<?> checkErpAccess(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(401).body(
                    Map.of("success", false, "message", "로그인이 필요합니다.", "redirectToLogin", true));
        }

        // 로컬/개발 환경에서는 관리자 역할이면 허용
        if (environment != null && (environment
                .acceptsProfiles(org.springframework.core.env.Profiles.of("local"))
                || environment.acceptsProfiles(org.springframework.core.env.Profiles.of("dev")))) {
            if (currentUser.getRole() != null
                    && (currentUser.getRole().isAdmin() || currentUser.getRole() == UserRole.ADMIN
                            || currentUser.getRole() == UserRole.TENANT_ADMIN
                            || currentUser.getRole() == UserRole.PRINCIPAL
                            || currentUser.getRole() == UserRole.OWNER)) {
                log.debug("로컬/개발 모드: 관리자 역할로 ERP 접근 허용, 사용자={}, 역할={}", currentUser.getEmail(),
                        currentUser.getRole());
                return null; // 권한 있음
            }
        }

        // 동적 권한 체크 (ERP_ACCESS 권한 필요)
        if (!dynamicPermissionService.hasPermission(currentUser, "ERP_ACCESS")) {
            log.warn("❌ ERP 접근 권한 없음: 사용자={}, 역할={}", currentUser.getEmail(),
                    currentUser.getRole());
            return ResponseEntity.status(403)
                    .body(Map.of("success", false, "message", "ERP 접근 권한이 없습니다. 관리자만 접근 가능합니다."));
        }

        return null; // 권한 있음
    }

    /**
     * 정산 규칙 생성 POST /api/v1/erp/settlement/rules 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    @PostMapping("/rules")
    public ResponseEntity<?> createRule(@RequestBody SettlementRuleCreateRequest request,
            HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }

        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("정산 규칙 생성 요청: tenantId={}", tenantId);

        SettlementRule rule = request.toSettlementRule();
        SettlementRule created = settlementService.createRule(tenantId, rule);
        return created(created);
    }

    /**
     * 정산 규칙 목록 조회 GET /api/v1/erp/settlement/rules 표준 문서:
     * docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    @GetMapping("/rules")
    public ResponseEntity<?> getRules(HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }

        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("정산 규칙 목록 조회: tenantId={}", tenantId);

        List<SettlementRule> rules = settlementService.getRules(tenantId);
        return success(rules);
    }

    /**
     * 정산 계산 실행 POST /api/v1/erp/settlement/calculate?period=202512 표준 문서:
     * docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    @PostMapping("/calculate")
    public ResponseEntity<?> calculateSettlement(@RequestParam String period, HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }

        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("정산 계산 요청: tenantId={}, period={}", tenantId, period);

        Settlement settlement = settlementService.calculateSettlement(tenantId, period);
        return created("정산이 계산되었습니다.", settlement);
    }

    /**
     * 정산 결과 목록 조회 GET /api/v1/erp/settlement/results 표준 문서:
     * docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    @GetMapping("/results")
    public ResponseEntity<?> getSettlements(HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }

        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("정산 결과 목록 조회: tenantId={}", tenantId);

        List<Settlement> settlements = settlementService.getSettlements(tenantId);
        return success(settlements);
    }

    /**
     * 정산 승인 POST /api/v1/erp/settlement/results/{id}/approve 표준 문서:
     * docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    @PostMapping("/results/{id}/approve")
    public ResponseEntity<?> approveSettlement(@PathVariable Long id,
            @RequestBody SettlementApproveRequest request, HttpSession session) {
        ResponseEntity<?> accessCheck = checkErpAccess(session);
        if (accessCheck != null) {
            return accessCheck;
        }

        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("정산 승인 요청: tenantId={}, settlementId={}", tenantId, id);

        Settlement approved =
                settlementService.approveSettlement(tenantId, id, request.getApproverId());
        return success("정산이 승인되었습니다.", approved);
    }

    /**
     * 정산 규칙 생성 요청 DTO
     */
    @Data
    public static class SettlementRuleCreateRequest {
        private String ruleName;
        private SettlementRule.BusinessType businessType;
        private SettlementRule.SettlementType settlementType;
        private SettlementRule.CalculationMethod calculationMethod;
        private String calculationParams;
        private Boolean isActive;

        public SettlementRule toSettlementRule() {
            return SettlementRule.builder().ruleName(ruleName).businessType(businessType)
                    .settlementType(settlementType).calculationMethod(calculationMethod)
                    .calculationParams(calculationParams)
                    .isActive(isActive != null ? isActive : true).build();
        }
    }

    /**
     * 정산 승인 요청 DTO
     */
    @Data
    public static class SettlementApproveRequest {
        private Long approverId;
    }
}

