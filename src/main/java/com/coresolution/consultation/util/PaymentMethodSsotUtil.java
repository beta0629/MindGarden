package com.coresolution.consultation.util;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import com.coresolution.consultation.constant.PaymentMethodSsotConstants;
import com.coresolution.consultation.entity.CommonCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

/**
 * 결제 수단 common_codes.extra_data 파싱·정규 code_value 매칭 유틸.
 *
 * @author CoreSolution
 * @since 2026-09-02
 */
@Slf4j
public final class PaymentMethodSsotUtil {

  private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

  private PaymentMethodSsotUtil() {
  }

  /**
   * extra_data 에서 카드 가맹점 수수료 적용 여부를 파싱한다.
   *
   * @param extraData JSON 문자열
   * @return true/false, 파싱 실패·누락 시 false
   */
  public static boolean parseCardMerchantFeeEligible(String extraData) {
    if (extraData == null || extraData.isBlank()) {
      return false;
    }
    try {
      JsonNode root = OBJECT_MAPPER.readTree(extraData);
      JsonNode node = root.get(PaymentMethodSsotConstants.EXTRA_DATA_KEY_CARD_MERCHANT_FEE_ELIGIBLE);
      return node != null && node.isBoolean() && node.booleanValue();
    } catch (Exception e) {
      log.debug("cardMerchantFeeEligible 파싱 실패: {}", e.getMessage());
      return false;
    }
  }

  /**
   * extra_data 에서 legacyAliases 배열을 파싱한다.
   *
   * @param extraData JSON 문자열
   * @return 별칭 목록 (없으면 빈 리스트)
   */
  public static List<String> parseLegacyAliases(String extraData) {
    if (extraData == null || extraData.isBlank()) {
      return Collections.emptyList();
    }
    try {
      JsonNode root = OBJECT_MAPPER.readTree(extraData);
      JsonNode node = root.get(PaymentMethodSsotConstants.EXTRA_DATA_KEY_LEGACY_ALIASES);
      if (node == null || !node.isArray()) {
        return Collections.emptyList();
      }
      List<String> aliases = new ArrayList<>();
      for (JsonNode item : node) {
        if (item != null && item.isTextual()) {
          String alias = item.asText();
          if (alias != null && !alias.isBlank()) {
            aliases.add(alias.trim());
          }
        }
      }
      return aliases;
    } catch (Exception e) {
      log.debug("legacyAliases 파싱 실패: {}", e.getMessage());
      return Collections.emptyList();
    }
  }

  /**
   * raw 결제 수단 문자열을 common_codes 목록에서 정규 code_value 로 해석한다.
   *
   * @param rawValue 원본 저장값·요청값
   * @param codes    테넌트+코어 PAYMENT_METHOD 코드 (dedup 후)
   * @return 매칭된 CommonCode, 없으면 empty
   */
  public static java.util.Optional<CommonCode> resolveCode(String rawValue, List<CommonCode> codes) {
    if (rawValue == null || rawValue.isBlank() || codes == null || codes.isEmpty()) {
      return java.util.Optional.empty();
    }
    String trimmed = rawValue.trim();
    String upper = trimmed.toUpperCase(Locale.ROOT);

    for (CommonCode code : codes) {
      if (code == null || code.getCodeValue() == null) {
        continue;
      }
      if (code.getCodeValue().equalsIgnoreCase(upper)) {
        return java.util.Optional.of(code);
      }
    }

    for (CommonCode code : codes) {
      if (code == null) {
        continue;
      }
      for (String alias : parseLegacyAliases(code.getExtraData())) {
        if (alias.equalsIgnoreCase(trimmed)) {
          return java.util.Optional.of(code);
        }
      }
    }

    return java.util.Optional.empty();
  }
}
