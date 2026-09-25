package com.coresolution.consultation.dto.shop;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * PG 결제 생성 응답 (기존 {@link com.coresolution.consultation.dto.PaymentResponse} 축약).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopPreparePaymentResponse {

    private String orderPublicId;
    private String paymentId;
    private BigDecimal cashAmount;
    private String paymentUrl;
    private String paymentStatus;

    /** 포트원 V2 storeId (IAMPORT 활성 시) */
    private String storeId;

    /** testMode 해석된 channelKey (IAMPORT 활성 시) */
    private String channelKey;

    /** PG 테스트 모드 */
    private Boolean testMode;

    /** 결제 대행사 (예: IAMPORT, TOSS) */
    private String paymentProvider;

    /** 포트원 클라이언트 결제 모듈 호출 가능 여부 */
    private Boolean pgReady;

    /**
     * PG/PortOne customer.email — 세션 실이메일이 없으면 서버 합성 이메일.
     * FE는 이 값을 SDK에 그대로 사용한다 (FE에서 도메인 발명 금지).
     */
    private String customerEmail;

    /**
     * PG/PortOne customer 표시명 — 없으면 {@link com.coresolution.consultation.constant.ShopCheckoutConstants#DEFAULT_PAYMENT_CUSTOMER_NAME}.
     */
    private String customerName;
}
