package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.shop.offer.ShopClientOfferCreateRequest;
import com.coresolution.consultation.dto.shop.offer.ShopClientOfferResponse;
import com.coresolution.consultation.dto.shop.offer.ShopClientOfferSourceOption;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.ShopClientOfferService;
import com.coresolution.consultation.utils.SessionUtils;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 테넌트 어드민 — 내담자별 지정 상품·할인가.
 *
 * @author MindGarden
 * @since 2026-10-12
 */
@RestController
@RequestMapping("/api/v1/admin/shop/client-offers")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminShopClientOfferController extends BaseApiController {

    private static final String ADMIN_SHOP_DISABLED_MESSAGE =
            "어드민 쇼핑 카탈로그 컴포넌트가 활성화되지 않았습니다.";

    private final ShopClientOfferService shopClientOfferService;
    private final TenantComponentActivationService tenantComponentActivationService;

    /**
     * 지정 화면의 몰 상품 선택지.
     *
     * @return 선택지
     */
    @GetMapping("/source-options")
    public ResponseEntity<ApiResponse<List<ShopClientOfferSourceOption>>> sourceOptions() {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<List<ShopClientOfferSourceOption>>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        return success(shopClientOfferService.listSourceOptions(tenantId));
    }

    /**
     * 내담자의 지정 목록.
     *
     * @param clientId 내담자 users.id
     * @return 지정 목록
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ShopClientOfferResponse>>> list(@RequestParam Long clientId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<List<ShopClientOfferResponse>>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        return success(shopClientOfferService.listForClient(tenantId, clientId, false));
    }

    /**
     * 지정 생성 (금액은 서버가 확정).
     *
     * @param request 요청
     * @return 생성된 지정
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ShopClientOfferResponse>> create(
            @Valid @RequestBody ShopClientOfferCreateRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<ShopClientOfferResponse>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        User actor = SessionUtils.getCurrentUser(null);
        try {
            return success(shopClientOfferService.create(tenantId, actor != null ? actor.getId() : null, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 지정 취소.
     *
     * @param offerId 지정 id
     * @return 취소된 지정
     */
    @PostMapping("/{offerId}/cancel")
    public ResponseEntity<ApiResponse<ShopClientOfferResponse>> cancel(@PathVariable Long offerId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<ShopClientOfferResponse>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        try {
            return success(shopClientOfferService.cancel(tenantId, offerId));
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
