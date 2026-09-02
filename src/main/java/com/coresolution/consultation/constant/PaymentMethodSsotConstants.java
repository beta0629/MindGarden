package com.coresolution.consultation.constant;

/**
 * 결제 수단 SSOT — {@code common_codes} 그룹·extraData 키·정규 code_value 상수.
 * <p>
 * 카드 가맹점 수수료 적용 여부는 {@link #EXTRA_DATA_KEY_CARD_MERCHANT_FEE_ELIGIBLE} 를
 * common_codes.extra_data 에서 조회한다. 결제 수단 문자열 하드코딩 목록은 사용하지 않는다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-09-02
 */
public final class PaymentMethodSsotConstants {

  /** common_codes.code_group */
  public static final String CODE_GROUP = "PAYMENT_METHOD";

  /** extra_data JSON 키 — true 이면 카드 가맹점 수수료 산출 대상 */
  public static final String EXTRA_DATA_KEY_CARD_MERCHANT_FEE_ELIGIBLE = "cardMerchantFeeEligible";

  /** extra_data JSON 키 — 마이그레이션 전 레거시 별칭 (code_value 배열) */
  public static final String EXTRA_DATA_KEY_LEGACY_ALIASES = "legacyAliases";

  public static final String CODE_CASH = "CASH";
  public static final String CODE_BANK_TRANSFER = "BANK_TRANSFER";
  public static final String CODE_CREDIT_CARD = "CREDIT_CARD";
  public static final String CODE_DEBIT_CARD = "DEBIT_CARD";
  public static final String CODE_CARD_TERMINAL = "CARD_TERMINAL";
  public static final String CODE_OTHER = "OTHER";

  private PaymentMethodSsotConstants() {
  }
}
