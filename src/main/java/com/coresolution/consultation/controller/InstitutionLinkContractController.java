package com.coresolution.consultation.controller;

import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;
import com.coresolution.consultation.dto.InstitutionLinkContractCreateRequest;
import com.coresolution.consultation.dto.InstitutionLinkContractResponse;
import com.coresolution.consultation.dto.InstitutionLinkMonthlyBillingRunResponse;
import com.coresolution.consultation.service.InstitutionLinkContractService;
import com.coresolution.consultation.service.InstitutionLinkMonthlyBillingService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 타기관 연계 등록 API. 회기권 매핑 경로가 아니다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/institution-link-contracts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class InstitutionLinkContractController extends BaseApiController {

    private final InstitutionLinkContractService institutionLinkContractService;
    private final InstitutionLinkMonthlyBillingService institutionLinkMonthlyBillingService;

    /**
     * 타기관 연계 목록.
     *
     * @return 계약 목록
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<InstitutionLinkContractResponse>>> list() {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return success(institutionLinkContractService.list(tenantId));
    }

    /**
     * 타기관 연계 등록.
     *
     * @param request 생성 요청
     * @return 저장된 계약
     */
    @PostMapping
    public ResponseEntity<ApiResponse<InstitutionLinkContractResponse>> create(
            @Valid @RequestBody InstitutionLinkContractCreateRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return created(institutionLinkContractService.create(tenantId, request));
    }

    /**
     * ACTIVE 계약에 대해 이번 달(또는 지정 연월) 월청구 RECEIVABLES 를 멱등 실행한다.
     *
     * @param yearMonth {@code yyyy-MM} (생략 시 서울 당월)
     * @return 청구 집계
     */
    @PostMapping("/billing-runs/monthly")
    public ResponseEntity<ApiResponse<InstitutionLinkMonthlyBillingRunResponse>> runMonthlyBilling(
            @RequestParam(value = "yearMonth", required = false) String yearMonth) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        YearMonth target = null;
        if (yearMonth != null && !yearMonth.isBlank()) {
            try {
                target = YearMonth.parse(yearMonth.trim());
            } catch (DateTimeParseException ex) {
                throw new IllegalArgumentException("yearMonth는 yyyy-MM 형식이어야 합니다.");
            }
        }
        return success(institutionLinkMonthlyBillingService.runMonthlyBilling(tenantId, target));
    }
}
