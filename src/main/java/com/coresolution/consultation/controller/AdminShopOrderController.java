package com.coresolution.consultation.controller;

import com.coresolution.consultation.constant.ShopAdminOrderConstants;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminDetailResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminSummaryItem;
import com.coresolution.consultation.dto.shop.admin.ShopOrderRefundRequest;
import com.coresolution.consultation.dto.shop.admin.ShopOrderRefundResponse;
import com.coresolution.consultation.service.AdminShopOrderRefundService;
import com.coresolution.consultation.service.AdminShopOrderService;
import java.util.List;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 테넌트 어드민 — 온라인 주문(환불) API.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@RestController
@RequestMapping("/api/v1/admin/shop/orders")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminShopOrderController extends BaseApiController {

    private static final String ADMIN_SHOP_DISABLED_MESSAGE =
            "어드민 쇼핑 카탈로그 컴포넌트가 활성화되지 않았습니다.";

    private final AdminShopOrderService adminShopOrderService;
    private final AdminShopOrderRefundService adminShopOrderRefundService;
    private final TenantComponentActivationService tenantComponentActivationService;

    /**
     * 테넌트 최근 온라인 주문 목록.
     *
     * @param limit 최대 건수 (기본 {@link ShopAdminOrderConstants#DEFAULT_LIST_LIMIT}, 상한 적용)
     * @return 주문 요약 목록
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ShopOrderAdminSummaryItem>>> list(
            @RequestParam(defaultValue = "" + ShopAdminOrderConstants.DEFAULT_LIST_LIMIT) int limit) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<List<ShopOrderAdminSummaryItem>>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        return success(adminShopOrderService.listRecentOrders(tenantId, limit));
    }

    /**
     * 주문 상세(라인·이행 이벤트 요약).
     *
     * @param orderPublicId 주문 공개 ID
     * @return 상세
     */
    @GetMapping("/{orderPublicId}")
    public ResponseEntity<ApiResponse<ShopOrderAdminDetailResponse>> get(
            @PathVariable String orderPublicId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<ShopOrderAdminDetailResponse>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        return success(adminShopOrderService.getOrderDetail(tenantId, orderPublicId));
    }

    /**
     * PAID 주문 전액 환불(이행 전 MVP) — 포인트 복원·clawback·주문 REFUNDED.
     *
     * @param orderPublicId 주문 공개 ID
     * @param request       환불 사유 코드
     * @return 환불 결과
     */
    @PostMapping("/{orderPublicId}/refund")
    public ResponseEntity<ApiResponse<ShopOrderRefundResponse>> refund(
            @PathVariable String orderPublicId,
            @Valid @RequestBody ShopOrderRefundRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<ShopOrderRefundResponse>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        ShopOrderRefundResponse result = adminShopOrderRefundService.refundPaidOrder(
                tenantId, orderPublicId, request.reasonCode());
        return success(result);
    }

    private <T> ResponseEntity<ApiResponse<T>> requireAdminShopCatalog(String tenantId) {
        if (tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG)) {
            return null;
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(ADMIN_SHOP_DISABLED_MESSAGE));
    }
}
