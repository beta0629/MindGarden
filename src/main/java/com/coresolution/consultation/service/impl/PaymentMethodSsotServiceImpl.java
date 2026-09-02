package com.coresolution.consultation.service.impl;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.PaymentMethodSsotConstants;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.service.PaymentMethodSsotService;
import com.coresolution.consultation.util.PaymentMethodSsotUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 결제 수단 SSOT 구현 — common_codes PAYMENT_METHOD 그룹 조회·정규화.
 *
 * @author CoreSolution
 * @since 2026-09-02
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentMethodSsotServiceImpl implements PaymentMethodSsotService {

  private final CommonCodeRepository commonCodeRepository;

  @Override
  public List<CommonCode> getPaymentMethodCodes(String tenantId) {
    if (tenantId == null || tenantId.isBlank()) {
      return List.of();
    }
    List<CommonCode> rows = commonCodeRepository.findActiveByCodeGroupForTenantWithFallback(
        PaymentMethodSsotConstants.CODE_GROUP, tenantId);
    return deduplicateTenantFirst(rows);
  }

  @Override
  public Optional<CommonCode> resolvePaymentMethodCode(String tenantId, String rawValue) {
    return PaymentMethodSsotUtil.resolveCode(rawValue, getPaymentMethodCodes(tenantId));
  }

  @Override
  public String normalizeToCanonicalCodeValue(String tenantId, String rawValue) {
    if (rawValue == null || rawValue.isBlank()) {
      return rawValue;
    }
    return resolvePaymentMethodCode(tenantId, rawValue)
        .map(CommonCode::getCodeValue)
        .orElse(rawValue.trim());
  }

  @Override
  public boolean isCardMerchantFeeEligible(String tenantId, String paymentMethodValue) {
    if (paymentMethodValue == null || paymentMethodValue.isBlank()) {
      return false;
    }
    Optional<CommonCode> code = resolvePaymentMethodCode(tenantId, paymentMethodValue);
    if (code.isEmpty()) {
      log.debug("결제 수단 SSOT 미매칭 — 수수료 0: tenantId={}, value={}", tenantId, paymentMethodValue);
      return false;
    }
    return PaymentMethodSsotUtil.parseCardMerchantFeeEligible(code.get().getExtraData());
  }

  /**
   * 동일 code_value 가 테넌트·코어 양쪽에 있으면 테넌트 행을 유지한다.
   */
  private List<CommonCode> deduplicateTenantFirst(List<CommonCode> rows) {
    if (rows == null || rows.isEmpty()) {
      return List.of();
    }
    Map<String, CommonCode> byValue = new LinkedHashMap<>();
    for (CommonCode row : rows) {
      if (row == null || row.getCodeValue() == null) {
        continue;
      }
      String key = row.getCodeValue().toUpperCase();
      CommonCode existing = byValue.get(key);
      if (existing == null) {
        byValue.put(key, row);
        continue;
      }
      if (existing.isCoreCode() && row.isTenantCode()) {
        byValue.put(key, row);
      }
    }
    return new ArrayList<>(byValue.values());
  }
}
