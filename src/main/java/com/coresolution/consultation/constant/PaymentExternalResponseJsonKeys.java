package com.coresolution.consultation.constant;

/**
 * PG·웹훅 {@code externalResponse}/{@code webhook_data} JSON 에서 금액·수수료 관련 키.
 * <p>
 * 토스페이먼츠 결제/정산 객체, 포트원(구 아임포트) V2 {@code data} 등 스키마별 필드명을 한곳에 둡니다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-04-17
 */
public final class PaymentExternalResponseJsonKeys {

    /** 토스 정산·결제 연동 객체 */
    public static final String SETTLEMENT = "settlement";

    /** 토스 정산 수수료 상세 배열 */
    public static final String FEES = "fees";

    /** 토스 수수료 항목별 금액 */
    public static final String FEE = "fee";

    /** 토스 정산 기준 결제 금액 */
    public static final String AMOUNT = "amount";

    /** 토스 가맹점 지급(실입금) 금액 */
    public static final String PAY_OUT_AMOUNT = "payOutAmount";

    /** 포트원 V2 웹훅·결제 객체 본문 */
    public static final String DATA = "data";

    /** 중첩 결제 객체(일부 PG/중계 응답) */
    public static final String PAYMENT = "payment";

    /** 범용: 가맹점 수수료(카멜) */
    public static final String MERCHANT_FEE = "merchantFee";

    /** 범용: 가맹점 수수료(스네이크) */
    public static final String MERCHANT_FEE_SNAKE = "merchant_fee";

    /** 범용: PG 수수료(카멜) */
    public static final String PG_FEE = "pgFee";

    /** 범용: PG 수수료(스네이크) */
    public static final String PG_FEE_SNAKE = "pg_fee";

    /** D5 재무·ERP 용 카드 가맹점 수수료(연동측에서 넣는 경우) */
    public static final String CARD_MERCHANT_FEE = "cardMerchantFee";

    private PaymentExternalResponseJsonKeys() {
        throw new UnsupportedOperationException("유틸리티 클래스입니다.");
    }
}
