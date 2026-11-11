package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuEventPriceItem;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuEventPriceUpsertRequest;
import com.coresolution.consultation.service.AdminShopCatalogSkuEventPriceService;
import com.coresolution.core.constant.PlatformComponentCodes;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.TenantComponentActivationService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 테넌트 어드민 — SKU 이벤트 가격 기간 API.
 *
 * @author MindGarden
 * @since 2026-11-11
 */
@RestController
@RequestMapping("/api/v1/admin/shop/catalog-skus/{skuId}/event-prices")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminShopCatalogSkuEventPriceController extends BaseApiController {

    private static final String ADMIN_SHOP_DISABLED_MESSAGE =
            "어드민 쇼핑 카탈로그 컴포넌트가 활성화되지 않았습니다.";

    private final AdminShopCatalogSkuEventPriceService adminShopCatalogSkuEventPriceService;
    private final TenantComponentActivationService tenantComponentActivationService;

    /**
     * SKU 이벤트 가격 기간 목록.
     *
     * @param skuId SKU ID
     * @return 시작일 오름차순 목록
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ShopCatalogSkuEventPriceItem>>> list(@PathVariable Long skuId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<List<ShopCatalogSkuEventPriceItem>>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        return success(adminShopCatalogSkuEventPriceService.list(tenantId, skuId));
    }

    /**
     * 이벤트 가격 기간 생성.
     *
     * @param skuId SKU ID
     * @param request 요청
     * @return 생성 결과
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ShopCatalogSkuEventPriceItem>> create(
            @PathVariable Long skuId,
            @Valid @RequestBody ShopCatalogSkuEventPriceUpsertRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<ShopCatalogSkuEventPriceItem>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        return created(adminShopCatalogSkuEventPriceService.create(tenantId, skuId, request));
    }

    /**
     * 이벤트 가격 기간 수정.
     *
     * @param skuId SKU ID
     * @param eventPriceId 이벤트 가격 ID
     * @param request 요청
     * @return 수정 결과
     */
    @PutMapping("/{eventPriceId}")
    public ResponseEntity<ApiResponse<ShopCatalogSkuEventPriceItem>> update(
            @PathVariable Long skuId,
            @PathVariable Long eventPriceId,
            @Valid @RequestBody ShopCatalogSkuEventPriceUpsertRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<ShopCatalogSkuEventPriceItem>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        return updated(adminShopCatalogSkuEventPriceService.update(tenantId, skuId, eventPriceId, request));
    }

    /**
     * 이벤트 가격 기간 soft-delete.
     *
     * @param skuId SKU ID
     * @param eventPriceId 이벤트 가격 ID
     * @return 삭제 결과
     */
    @DeleteMapping("/{eventPriceId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long skuId,
            @PathVariable Long eventPriceId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        if (!tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(ADMIN_SHOP_DISABLED_MESSAGE));
        }
        adminShopCatalogSkuEventPriceService.softDelete(tenantId, skuId, eventPriceId);
        return deleted();
    }

    private <T> ResponseEntity<ApiResponse<T>> requireAdminShopCatalog(String tenantId) {
        if (tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG)) {
            return null;
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(ADMIN_SHOP_DISABLED_MESSAGE));
    }
}
