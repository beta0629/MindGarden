package com.coresolution.consultation.controller;

import com.coresolution.consultation.constant.ShopAdminOrderConstants;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminDetailResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminSummaryItem;
import com.coresolution.consultation.dto.shop.admin.ShopOrderReconcilePaymentRequest;
import com.coresolution.consultation.dto.shop.admin.ShopOrderReconcilePaymentResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderRefundRequest;
import com.coresolution.consultation.dto.shop.admin.ShopOrderRefundResponse;
import com.coresolution.consultation.service.AdminShopOrderReconcileService;
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
import org.springframework.web.bind.annotation.DeleteMapping;
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
    private final AdminShopOrderReconcileService adminShopOrderReconcileService;
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
     * PAID 주문 이행 재시도 (FAILED·retryable 라인만). 주문 상태는 PAID 유지.
     *
     * @param orderPublicId 주문 공개 ID
     * @return 재시도 후 주문 상세
     */
    @PostMapping("/{orderPublicId}/fulfill-retry")
    public ResponseEntity<ApiResponse<ShopOrderAdminDetailResponse>> retryFulfillment(
            @PathVariable String orderPublicId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<ShopOrderAdminDetailResponse>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        try {
            return success(adminShopOrderService.retryOrderFulfillment(tenantId, orderPublicId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * PAID 주문 상담 입금 INCOME 수리 — COMPLETED 이행이어도 posted 합≠cashDue 이면 ensure(멱등).
     *
     * @param orderPublicId 주문 공개 ID
     * @return 수리 후 주문 상세
     */
    @PostMapping("/{orderPublicId}/repair-deposit-income")
    public ResponseEntity<ApiResponse<ShopOrderAdminDetailResponse>> repairDepositIncome(
            @PathVariable String orderPublicId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<ShopOrderAdminDetailResponse>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        try {
            return success(adminShopOrderService.repairDepositIncome(tenantId, orderPublicId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 허용 상태 주문 soft-delete (확인 모달 후 호출). 감사 로그 기록.
     *
     * <p>허용: CREATED / PENDING_PAYMENT / EXPIRED / CANCELLED / REFUNDED.
     * 거부: PAID, 환불 진행 중.</p>
     *
     * @param orderPublicId 주문 공개 ID
     * @return 삭제 완료 메시지
     */
    @DeleteMapping("/{orderPublicId}")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable String orderPublicId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<Void>> denied = requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        adminShopOrderService.softDeleteOrder(tenantId, orderPublicId);
        return deleted();
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

    /**
     * 미결제·만료 주문의 PortOne 결제 정합 — V2 검증 후 APPROVED/PAID SSOT 반영.
     * <p>
     * Ops 가 아는 PortOne {@code paymentId}(예: PG 메일) 또는 카드 승인번호
     * {@code cardApprovalNumber}로 웹훅 미매칭 주문을 복구한다.
     * {@code EXPIRED} 이어도 PortOne PAID·금액 일치 시 복구 가능.
     * </p>
     *
     * @param orderPublicId 주문 공개 ID
     * @param request       PortOne paymentId 및/또는 cardApprovalNumber
     * @return 정합 결과
     */
    @PostMapping("/{orderPublicId}/reconcile-payment")
    public ResponseEntity<ApiResponse<ShopOrderReconcilePaymentResponse>> reconcilePayment(
            @PathVariable String orderPublicId,
            @Valid @RequestBody ShopOrderReconcilePaymentRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ResponseEntity<ApiResponse<ShopOrderReconcilePaymentResponse>> denied =
                requireAdminShopCatalog(tenantId);
        if (denied != null) {
            return denied;
        }
        ShopOrderReconcilePaymentResponse result = adminShopOrderReconcileService.reconcilePayment(
                tenantId, orderPublicId, request.paymentId(), request.cardApprovalNumber());
        return success(result);
    }

    private <T> ResponseEntity<ApiResponse<T>> requireAdminShopCatalog(String tenantId) {
        if (tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG)) {
            return null;
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(ADMIN_SHOP_DISABLED_MESSAGE));
    }
}
