package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.AdminListPageResult;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminDetailResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminSummaryItem;
import org.springframework.data.domain.Pageable;

/**
 * 테넌트 어드민 — 온라인 주문 조회·삭제.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public interface AdminShopOrderService {

    /**
     * 테넌트 최근 주문 목록 (페이징).
     *
     * @param tenantId 테넌트 ID
     * @param pageable 페이지 (상한은 호출측 {@code PaginationUtils} 적용)
     * @return content + totalCount
     */
    AdminListPageResult<ShopOrderAdminSummaryItem> listRecentOrders(String tenantId, Pageable pageable);

    /**
     * 주문 상세(라인·이행 이벤트 요약).
     *
     * @param tenantId      테넌트 ID
     * @param orderPublicId 주문 공개 ID
     * @return 상세
     */
    ShopOrderAdminDetailResponse getOrderDetail(String tenantId, String orderPublicId);

    /**
     * PAID 주문 이행 재시도 후 최신 상세 반환.
     *
     * @param tenantId      테넌트 ID
     * @param orderPublicId 주문 공개 ID
     * @return 재시도 후 주문 상세
     * @throws IllegalArgumentException 주문 없음
     * @throws IllegalStateException    재시도 불가 상태
     */
    ShopOrderAdminDetailResponse retryOrderFulfillment(String tenantId, String orderPublicId);

    /**
     * PAID 주문 상담 매핑 입금 INCOME 수리 — COMPLETED 이행이어도 posted 합≠cashDue 이면 ensure.
     * 멱등: 이미 SSOT 일치하면 no-op.
     *
     * @param tenantId      테넌트 ID
     * @param orderPublicId 주문 공개 ID
     * @return 수리 후 주문 상세
     * @throws IllegalArgumentException 주문 없음·상담 매핑 없음
     * @throws IllegalStateException    INCOME 보장 실패
     */
    ShopOrderAdminDetailResponse repairDepositIncome(String tenantId, String orderPublicId);

    /**
     * 허용 상태 주문 soft-delete (감사 로그 기록).
     *
     * <p>허용: CREATED / PENDING_PAYMENT / EXPIRED / CANCELLED / REFUNDED.
     * 거부: PAID, 환불 진행 중({@code payments.status=PROCESSING}).</p>
     *
     * @param tenantId      테넌트 ID
     * @param orderPublicId 주문 공개 ID
     * @throws IllegalArgumentException 주문 없음·삭제 불가 상태
     * @throws IllegalStateException    환불 진행 중
     */
    void softDeleteOrder(String tenantId, String orderPublicId);
}
