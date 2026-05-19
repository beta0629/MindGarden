package com.coresolution.consultation.controller;

import com.coresolution.consultation.constant.ShopAdminOrderConstants;
import com.coresolution.consultation.dto.shop.admin.CatalogVisiblePatchRequest;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuAdminDetail;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuAdminItem;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuPriceHistoryItem;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuUpsertRequest;
import com.coresolution.consultation.service.AdminShopCatalogSkuService;
import com.coresolution.core.constant.PlatformComponentCodes;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.TenantComponentActivationService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * 테넌트 어드민 — 온라인 카탈로그 SKU API.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@RestController
@RequestMapping("/api/v1/admin/shop/catalog-skus")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminShopCatalogSkuController extends BaseApiController {

    private static final String ADMIN_SHOP_DISABLED_MESSAGE =
            "어드민 쇼핑 카탈로그 컴포넌트가 활성화되지 않았습니다.";

    private final AdminShopCatalogSkuService adminShopCatalogSkuService;
    private final TenantComponentActivationService tenantComponentActivationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ShopCatalogSkuAdminItem>>> list() {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<List<ShopCatalogSkuAdminItem>>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        return success(adminShopCatalogSkuService.listAllForTenant(tenantId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ShopCatalogSkuAdminDetail>> get(@PathVariable Long id) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<ShopCatalogSkuAdminDetail>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        return success(adminShopCatalogSkuService.getForAdmin(tenantId, id));
    }

    /**
     * SKU 단가 변경 이력(최신순, 최근 N건).
     *
     * @param id SKU ID
     * @param limit 최대 건수 (기본 {@link ShopAdminOrderConstants#DEFAULT_LIST_LIMIT})
     * @return 단가 이력 목록
     */
    @GetMapping("/{id}/price-history")
    public ResponseEntity<ApiResponse<List<ShopCatalogSkuPriceHistoryItem>>> listPriceHistory(
            @PathVariable Long id,
            @RequestParam(defaultValue = "" + ShopAdminOrderConstants.DEFAULT_LIST_LIMIT) int limit) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<List<ShopCatalogSkuPriceHistoryItem>>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        return success(adminShopCatalogSkuService.listPriceHistory(tenantId, id, limit));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ShopCatalogSkuAdminDetail>> create(
            @Valid @RequestBody ShopCatalogSkuUpsertRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<ShopCatalogSkuAdminDetail>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        return created(adminShopCatalogSkuService.create(tenantId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ShopCatalogSkuAdminDetail>> update(
            @PathVariable Long id,
            @Valid @RequestBody ShopCatalogSkuUpsertRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<ShopCatalogSkuAdminDetail>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        return updated(adminShopCatalogSkuService.update(tenantId, id, request));
    }

    @PostMapping(value = "/{id}/thumbnail", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ShopCatalogSkuAdminDetail>> uploadThumbnail(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<ShopCatalogSkuAdminDetail>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        return success(adminShopCatalogSkuService.uploadThumbnail(tenantId, id, file));
    }

    @PatchMapping("/{id}/catalog-visible")
    public ResponseEntity<ApiResponse<Void>> patchCatalogVisible(
            @PathVariable Long id,
            @Valid @RequestBody CatalogVisiblePatchRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        if (!tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(ADMIN_SHOP_DISABLED_MESSAGE));
        }
        adminShopCatalogSkuService.patchCatalogVisible(tenantId, id, request.catalogVisible());
        return updated("노출 설정이 반영되었습니다.", null);
    }

    private <T> ResponseEntity<ApiResponse<T>> requireAdminShopCatalog(String tenantId) {
        if (tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG)) {
            return null;
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(ADMIN_SHOP_DISABLED_MESSAGE));
    }
}
