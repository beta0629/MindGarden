package com.coresolution.consultation.dto.shop;

/**
 * Path B fulfill/heal — 입금 INCOME 귀속·금액 SSOT claim.
 * <p>
 * 매핑에 연결된 최신 주문 라인(id DESC)과 현재 fulfill 주문이 다를 수 있으므로,
 * 현재 주문의 {@code orderPublicId}/{@code paymentId}/{@code titleSnapshot}/
 * {@code cashDueMinor}/{@code sessionCount} 를 명시해 가로채기를 막는다.
 * </p>
 * <p>nullable 필드 허용. Path B fulfill 경로에서는 orderPublicId·paymentId·titleSnapshot·
 * cashDueMinor·sessionCount 를 채운다. Path A(claim=null)는 레거시 동작.</p>
 *
 * @author MindGarden
 * @since 2026-09-19
 */
public final class ShopOrderIncomeClaim {

    private final String orderPublicId;
    private final String paymentId;
    private final String titleSnapshot;
    private final Long cashDueMinor;
    private final Integer sessionCount;

    private ShopOrderIncomeClaim(
            String orderPublicId,
            String paymentId,
            String titleSnapshot,
            Long cashDueMinor,
            Integer sessionCount) {
        this.orderPublicId = orderPublicId;
        this.paymentId = paymentId;
        this.titleSnapshot = titleSnapshot;
        this.cashDueMinor = cashDueMinor;
        this.sessionCount = sessionCount;
    }

    /**
     * claim 빌더.
     *
     * @return 빌더
     */
    public static Builder builder() {
        return new Builder();
    }

    public String getOrderPublicId() {
        return orderPublicId;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public String getTitleSnapshot() {
        return titleSnapshot;
    }

    public Long getCashDueMinor() {
        return cashDueMinor;
    }

    /**
     * 기대 입금 금액 — {@link #getCashDueMinor()} 별칭 (SSOT).
     *
     * @return cashDueMinor
     */
    public Long getExpectedAmount() {
        return cashDueMinor;
    }

    public Integer getSessionCount() {
        return sessionCount;
    }

    /**
     * claim 에 쇼핑 주문 식별자(order/payment/title) 중 하나라도 있으면 true.
     *
     * @return shop identity 존재 여부
     */
    public boolean hasShopIdentity() {
        return (orderPublicId != null && !orderPublicId.isBlank())
                || (paymentId != null && !paymentId.isBlank())
                || (titleSnapshot != null && !titleSnapshot.isBlank());
    }

    /**
     * Path B fulfill claim 빌더.
     */
    public static final class Builder {
        private String orderPublicId;
        private String paymentId;
        private String titleSnapshot;
        private Long cashDueMinor;
        private Integer sessionCount;

        private Builder() {}

        public Builder orderPublicId(String orderPublicId) {
            this.orderPublicId = orderPublicId;
            return this;
        }

        public Builder paymentId(String paymentId) {
            this.paymentId = paymentId;
            return this;
        }

        public Builder titleSnapshot(String titleSnapshot) {
            this.titleSnapshot = titleSnapshot;
            return this;
        }

        public Builder cashDueMinor(Long cashDueMinor) {
            this.cashDueMinor = cashDueMinor;
            return this;
        }

        public Builder expectedAmount(Long expectedAmount) {
            this.cashDueMinor = expectedAmount;
            return this;
        }

        public Builder sessionCount(Integer sessionCount) {
            this.sessionCount = sessionCount;
            return this;
        }

        /**
         * @return immutable claim
         */
        public ShopOrderIncomeClaim build() {
            return new ShopOrderIncomeClaim(
                    orderPublicId, paymentId, titleSnapshot, cashDueMinor, sessionCount);
        }
    }
}
