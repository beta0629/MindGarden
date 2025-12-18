package com.coresolution.consultation.controller.erp;

import java.util.List;
import com.coresolution.consultation.entity.Settlement;
import com.coresolution.consultation.entity.SettlementRule;
import com.coresolution.consultation.service.SettlementService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
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

    /**
     * 정산 규칙 생성 POST /api/v1/erp/settlement/rules 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    @PostMapping("/rules")
    public ResponseEntity<ApiResponse<SettlementRule>> createRule(
            @RequestBody SettlementRuleCreateRequest request) {
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
    public ResponseEntity<ApiResponse<List<SettlementRule>>> getRules() {
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
    public ResponseEntity<ApiResponse<Settlement>> calculateSettlement(
            @RequestParam String period) {
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
    public ResponseEntity<ApiResponse<List<Settlement>>> getSettlements() {
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
    public ResponseEntity<ApiResponse<Settlement>> approveSettlement(@PathVariable Long id,
            @RequestBody SettlementApproveRequest request) {
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

