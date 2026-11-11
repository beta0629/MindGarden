package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.publicapi.PublicConsultationProductResponse;
import com.coresolution.consultation.service.PublicTenantConsultationProductService;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import java.util.List;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 센터 홈페이지용 공개 상담 상품 API (비로그인 GET).
 *
 * @author MindGarden
 * @since 2026-11-11
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/public/tenants")
@RequiredArgsConstructor
public class PublicTenantConsultationProductController extends BaseApiController {

    private static final int CACHE_MAX_AGE_SECONDS = 300;

    private final PublicTenantConsultationProductService publicTenantConsultationProductService;

    /**
     * 테넌트 슬러그별 공개 상담 상품 목록.
     *
     * @param tenantSlug 테넌트 서브도메인
     * @return 공개 상품 목록 ({@code Cache-Control: public, max-age=300})
     */
    @GetMapping("/{tenantSlug}/consultation-products")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<PublicConsultationProductResponse>>> listConsultationProducts(
            @PathVariable String tenantSlug) {
        log.debug("공개 상담 상품 목록: tenantSlug={}", tenantSlug);
        List<PublicConsultationProductResponse> items =
                publicTenantConsultationProductService.listByTenantSlug(tenantSlug);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(CACHE_MAX_AGE_SECONDS, TimeUnit.SECONDS).cachePublic())
                .body(ApiResponse.success(items));
    }
}
