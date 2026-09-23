package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.shop.ShopCatalogSkuResponse;
import com.coresolution.consultation.service.ClientShopCatalogService;
import com.coresolution.core.constant.PlatformComponentCodes;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.TenantComponentActivationService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 공개 쇼핑 카탈로그(PLP·PDP) — 로그인 없이 조회. 테넌트는 Host/서브도메인·X-Tenant-Id 로 해석.
 *
 * <p>장바구니·체크아웃·주문·포인트는 {@link ClientShopController}(인증) 경로를 유지한다.</p>
 *
 * @author MindGarden
 * @since 2026-09-16
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/shop/catalog")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PublicShopCatalogController extends BaseApiController {

    private static final String CLIENT_SHOP_DISABLED_MESSAGE =
            "내담자 쇼핑몰 컴포넌트가 활성화되지 않았습니다.";
    private static final String TENANT_REQUIRED_MESSAGE = "테넌트 정보가 없습니다.";

    private final ClientShopCatalogService clientShopCatalogService;
    private final TenantComponentActivationService tenantComponentActivationService;

    /**
     * 공개 PLP 카탈로그 목록.
     *
     * @return 노출 중 SKU 목록
     */
    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<ShopCatalogSkuResponse>>> listCatalog() {
        String tenantId = requireTenantId();
        ResponseEntity<ApiResponse<List<ShopCatalogSkuResponse>>> denied = requireClientShop(tenantId);
        if (denied != null) {
            return denied;
        }
        log.debug("공개 카탈로그 목록 조회: tenantId={}", tenantId);
        return success(clientShopCatalogService.listVisibleSkus(tenantId));
    }

    /**
     * 공개 PDP 단일 SKU.
     *
     * @param skuCode SKU 코드
     * @return SKU
     */
    @GetMapping("/{skuCode}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<ShopCatalogSkuResponse>> getCatalogSku(
            @PathVariable String skuCode) {
        String tenantId = requireTenantId();
        ResponseEntity<ApiResponse<ShopCatalogSkuResponse>> denied = requireClientShop(tenantId);
        if (denied != null) {
            return denied;
        }
        log.debug("공개 카탈로그 SKU 조회: tenantId={}, skuCode={}", tenantId, skuCode);
        return success(clientShopCatalogService.getVisibleSkuByCode(tenantId, skuCode));
    }

    private static String requireTenantId() {
        String tenantId = TenantContextHolder.getTenantId();
        if (!StringUtils.hasText(tenantId)) {
            throw new PublicShopTenantException(TENANT_REQUIRED_MESSAGE);
        }
        return tenantId.trim();
    }

    private <T> ResponseEntity<ApiResponse<T>> requireClientShop(String tenantId) {
        if (tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.CLIENT_SHOP)) {
            return null;
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(CLIENT_SHOP_DISABLED_MESSAGE));
    }

    /**
     * 공개 카탈로그에서 테넌트 미해석 시 예외.
     */
    private static final class PublicShopTenantException extends RuntimeException {
        private static final long serialVersionUID = 1L;

        PublicShopTenantException(String message) {
            super(message);
        }
    }

    /**
     * 테넌트 미해석 응답 (403).
     *
     * @param ex 예외
     * @return 403
     */
    @org.springframework.web.bind.annotation.ExceptionHandler(PublicShopTenantException.class)
    public ResponseEntity<ApiResponse<Void>> handleTenantMissing(PublicShopTenantException ex) {
        String msg = ex.getMessage() != null ? ex.getMessage() : TENANT_REQUIRED_MESSAGE;
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(msg));
    }
}
