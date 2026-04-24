package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.TenantSmsSettingsResponse;
import com.coresolution.consultation.dto.TenantSmsSettingsUpdateRequest;
import com.coresolution.consultation.service.TenantSmsSettingsService;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 어드민 — 현재 테넌트 SMS 비시크릿 설정 API.
 *
 * @author CoreSolution
 * @since 2026-04-25
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/tenant-sms-settings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminTenantSmsSettingsController extends BaseApiController {

    private final TenantSmsSettingsService tenantSmsSettingsService;

    /**
     * 현재 테넌트 설정 조회.
     *
     * @return 효과적 설정
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> getSettings() {
        try {
            String tenantId = TenantContextHolder.getRequiredTenantId();
            TenantSmsSettingsResponse data = tenantSmsSettingsService.getEffectiveSettings(tenantId);
            return success(data);
        } catch (IllegalStateException e) {
            log.warn("SMS 설정 조회: 테넌트 컨텍스트 없음");
            return badRequest("테넌트 컨텍스트가 없습니다.", "TENANT_CONTEXT_MISSING");
        }
    }

    /**
     * 현재 테넌트 설정 저장(upsert).
     *
     * @param request 요청 본문
     * @return 저장 결과
     */
    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> putSettings(@Valid @RequestBody TenantSmsSettingsUpdateRequest request) {
        try {
            String tenantId = TenantContextHolder.getRequiredTenantId();
            TenantSmsSettingsResponse data = tenantSmsSettingsService.upsert(tenantId, request);
            return updated(data);
        } catch (IllegalStateException e) {
            log.warn("SMS 설정 저장: 테넌트 컨텍스트 없음");
            return badRequest("테넌트 컨텍스트가 없습니다.", "TENANT_CONTEXT_MISSING");
        }
    }
}
