package com.coresolution.consultation.service;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.CommonCode;

/**
 * 결제 수단 SSOT — common_codes / 테넌트 코드 기반 정규화·카드 수수료 적용 판별.
 *
 * @author CoreSolution
 * @since 2026-09-02
 */
public interface PaymentMethodSsotService {

  /**
   * 테넌트 컨텍스트 PAYMENT_METHOD 활성 코드 (테넌트 우선, 코어 폴백 dedup).
   *
   * @param tenantId 테넌트 ID
   * @return 코드 목록
   */
  List<CommonCode> getPaymentMethodCodes(String tenantId);

  /**
   * raw 값을 정규 common_codes 행으로 해석.
   *
   * @param tenantId 테넌트 ID
   * @param rawValue 원본 값
   * @return 매칭 코드
   */
  Optional<CommonCode> resolvePaymentMethodCode(String tenantId, String rawValue);

  /**
   * raw 값을 정규 code_value 로 변환. 미매칭 시 원본 trim 반환.
   *
   * @param tenantId 테넌트 ID
   * @param rawValue 원본 값
   * @return 정규 code_value
   */
  String normalizeToCanonicalCodeValue(String tenantId, String rawValue);

  /**
   * 결제 수단이 카드 가맹점 수수료 산출 대상인지 (extra_data.cardMerchantFeeEligible).
   *
   * @param tenantId           테넌트 ID
   * @param paymentMethodValue 저장·요청 결제 수단 문자열
   * @return 수수료 적용 대상이면 true
   */
  boolean isCardMerchantFeeEligible(String tenantId, String paymentMethodValue);
}
