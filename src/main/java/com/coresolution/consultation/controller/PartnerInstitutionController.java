package com.coresolution.consultation.controller;

import java.util.List;
import com.coresolution.consultation.dto.PartnerInstitutionCreateRequest;
import com.coresolution.consultation.dto.PartnerInstitutionResponse;
import com.coresolution.consultation.dto.PartnerInstitutionUpdateRequest;
import com.coresolution.consultation.service.PartnerInstitutionService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 연계 기관 마스터 API.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/partner-institutions")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class PartnerInstitutionController extends BaseApiController {

    private final PartnerInstitutionService partnerInstitutionService;

    /**
     * 기관 목록.
     *
     * @return 기관 목록
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PartnerInstitutionResponse>>> list() {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return success(partnerInstitutionService.list(tenantId));
    }

    /**
     * 기관 등록.
     *
     * @param request 생성 요청
     * @return 저장된 기관
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PartnerInstitutionResponse>> create(
            @Valid @RequestBody PartnerInstitutionCreateRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return created(partnerInstitutionService.create(tenantId, request));
    }

    /**
     * 기관 수정.
     *
     * @param id 기관 ID
     * @param request 수정 요청
     * @return 수정된 기관
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PartnerInstitutionResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody PartnerInstitutionUpdateRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return updated(partnerInstitutionService.update(tenantId, id, request));
    }
}
