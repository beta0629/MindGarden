package com.coresolution.consultation.dto.shop.admin;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.dto.PaymentSource;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 어드민 온라인 주문 목록 항목.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopOrderAdminSummaryItem {

    private String orderPublicId;
    private ShopClientOrderStatus status;
    private long subtotalMinor;
    private long pointsRedeemMinor;
    private long cashDueMinor;
    private Long clientId;
    private LocalDateTime createdAt;
    /** Payment.PaymentStatus name (APPROVED/REFUNDED 등, 없으면 null) */
    private String paymentStatus;
    /** PortOne/Payment.amount SSOT (없으면 null) */
    private Long pgAmount;
    /**
     * 결제 채널 — 온라인 주문은 ONLINE.
     * <p>SSOT: docs/project-management/PAYMENT_SOURCE_ONLINE_MANUAL_MAPPING_RULES_20260318.md</p>
     */
    private PaymentSource paymentSource;
    /** Payment.PaymentProvider name (없으면 null) */
    private String paymentProvider;
    /** 어드민 soft-delete 가능 여부 (상태·환불 진행 가드 반영) */
    private boolean deletable;
    /** 대표 상품명 (첫 라인 스냅샷, 여러 줄이면 「외 N」) */
    private String productTitle;
    /** 부여 회기 합 (라인 회기 × 수량) */
    private Integer sessionCount;
    /** 표시 금액 (pgAmount → cashDue → subtotal) */
    private Long amountMinor;
    /** 목록 세그먼트 상태 {@code PAID|EXPIRING_SOON|EXPIRED|PENDING|RECONCILE|REFUNDED|UNPAID} */
    private String ledgerState;

    /** 표시용 내담자 이름 (마스킹은 화면에서) */
    private String clientName;
    /** 결제일시 (승인 결제 approvedAt, 없으면 주문 생성 시각) */
    private LocalDateTime paidAt;
    /** 사용 기한 판정 {@code NONE|ACTIVE|EXPIRING_SOON|EXPIRED} */
    private String expiryState;
    /** 유효 만료일 (당일 포함, 연장 반영) */
    private LocalDate expireDate;
    /** 결제일 기준 원래 만료일 */
    private LocalDate originalExpireDate;
    /** 오늘부터 만료일까지 남은 일수 (지났으면 음수) */
    private Long daysLeft;
    /** 적용 유효기간(개월) 스냅샷 */
    private Integer validityMonths;
    /** 연장 횟수 */
    private int extensionCount;
    /** 남은 회기 사용 가능 판정 (기한 만료면 false) */
    private boolean sessionsUsable;
}
