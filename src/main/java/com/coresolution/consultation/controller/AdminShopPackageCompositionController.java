package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.shop.admin.ShopCompositionCandidateListResponse;
import com.coresolution.consultation.dto.shop.admin.ShopPackageCompositionResponse;
import com.coresolution.consultation.dto.shop.admin.ShopPackageCompositionSaveRequest;
import com.coresolution.consultation.service.ShopPackageCompositionService;
import com.coresolution.core.constant.PlatformComponentCodes;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.TenantComponentActivationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 테넌트 어드민 — 상품 구성(몰 SKU 기반) API.
 *
 * @author MindGarden
 * @since 2026-10-12
 */
@RestController
@RequestMapping("/api/v1/admin/shop")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminShopPackageCompositionController extends BaseApiController {

    private static final String ADMIN_SHOP_DISABLED_MESSAGE =
            "어드민 쇼핑 카탈로그 컴포넌트가 활성화되지 않았습니다.";

    private final ShopPackageCompositionService compositionService;
    private final TenantComponentActivationService tenantComponentActivationService;

    /**
     * 패키지 구성 조회 (가격 변경 여부·레거시 표시 포함).
     *
     * @param packageCode 패키지 코드
     * @return 구성
     */
    @GetMapping("/package-compositions/{packageCode}")
    public ResponseEntity<ApiResponse<ShopPackageCompositionResponse>> get(@PathVariable String packageCode) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<ShopPackageCompositionResponse>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        return success(compositionService.get(tenantId, packageCode));
    }

    /**
     * 패키지 구성 저장 (전체 교체, 합계는 서버 계산).
     *
     * @param packageCode 패키지 코드
     * @param request 구성 항목
     * @return 저장 후 구성
     */
    @PutMapping("/package-compositions/{packageCode}")
    public ResponseEntity<ApiResponse<ShopPackageCompositionResponse>> save(
            @PathVariable String packageCode,
            @Valid @RequestBody ShopPackageCompositionSaveRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<ShopPackageCompositionResponse>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        return success(compositionService.save(tenantId, packageCode, request));
    }

    /**
     * 구성 후보 몰 SKU 검색.
     *
     * @param q 상품명·코드 검색어
     * @param excludePackageCode 편집 중인 패키지 코드
     * @return 후보·전체 수
     */
    @GetMapping("/catalog-skus/composition-candidates")
    public ResponseEntity<ApiResponse<ShopCompositionCandidateListResponse>> candidates(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "excludePackageCode", required = false) String excludePackageCode) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<ShopCompositionCandidateListResponse>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        return success(compositionService.listCandidates(tenantId, q, excludePackageCode));
    }

    private <T> ResponseEntity<ApiResponse<T>> requireAdminShopCatalog(String tenantId) {
        if (tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG)) {
            return null;
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(ADMIN_SHOP_DISABLED_MESSAGE));
    }
}
