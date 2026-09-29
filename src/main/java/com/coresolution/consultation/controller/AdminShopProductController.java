package com.coresolution.consultation.controller;

import com.coresolution.consultation.constant.ShopAdminOrderConstants;
import com.coresolution.consultation.dto.shop.admin.ShopAdminProductItem;
import com.coresolution.consultation.dto.shop.admin.ShopAdminProductListResponse;
import com.coresolution.consultation.dto.shop.admin.ShopAdminProductSaleStatusRequest;
import com.coresolution.consultation.service.AdminShopProductService;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 테넌트 어드민 — 「상품」 통합 목록·판매 상태 API.
 *
 * @author MindGarden
 * @since 2026-09-29
 */
@RestController
@RequestMapping("/api/v1/admin/shop/products")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminShopProductController extends BaseApiController {

    private static final String ADMIN_SHOP_DISABLED_MESSAGE =
            "어드민 쇼핑 카탈로그 컴포넌트가 활성화되지 않았습니다.";

    private final AdminShopProductService adminShopProductService;
    private final TenantComponentActivationService tenantComponentActivationService;

    /**
     * 상품 통합 목록 (서버 page/size).
     *
     * @param page    0-based 페이지 (선택)
     * @param size    페이지 크기 (선택)
     * @param segment ALL|ON_SALE|STOPPED (선택)
     * @param q       상품명·코드 검색어 (선택)
     * @return products + totalElements + page + size + counts
     */
    @GetMapping
    public ResponseEntity<ApiResponse<ShopAdminProductListResponse>> list(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String segment,
            @RequestParam(required = false) String q) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<ShopAdminProductListResponse>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        int effectivePage = page != null ? page : ShopAdminOrderConstants.DEFAULT_LIST_PAGE;
        int effectiveSize = size != null ? size : ShopAdminOrderConstants.DEFAULT_LIST_LIMIT;
        return success(adminShopProductService.listProducts(tenantId, effectivePage, effectiveSize, segment, q));
    }

    /**
     * 판매 상태 변경. 중지 시 홈 공개·몰 노출을 함께 끈다. 재개는 판매 사용만 켠다.
     *
     * @param request 대상·다음 상태
     * @return 갱신된 행
     */
    @PatchMapping("/sale-status")
    public ResponseEntity<ApiResponse<ShopAdminProductItem>> updateSaleStatus(
            @Valid @RequestBody ShopAdminProductSaleStatusRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<ShopAdminProductItem>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        try {
            return success(adminShopProductService.updateSaleStatus(tenantId, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    private <T> ResponseEntity<ApiResponse<T>> requireAdminShopCatalog(String tenantId) {
        if (tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG)) {
            return null;
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(ADMIN_SHOP_DISABLED_MESSAGE));
    }
}
