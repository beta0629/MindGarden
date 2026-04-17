package com.coresolution.consultation.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;

import com.coresolution.consultation.constant.PaymentExternalResponseJsonKeys;
import com.coresolution.consultation.entity.Payment;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * {@link Payment#getExternalResponse()}·{@link Payment#getWebhookData()} JSON 에서
 * 카드 가맹점(PG) 수수료 금액(D5)을 추출합니다.
 * <p>
 * 토스페이먼츠: 정산/결제 연동 시 {@code settlement.fees[].fee} 합산,
 * 또는 동일 객체의 {@code amount - payOutAmount}(문서상 지급액 정의).
 * 그 외 PG·중계층이 넣는 {@code merchantFee}, {@code pgFee} 등 명시 필드를 시도합니다.
 * KICC 등 별도 스키마는 동일 범용 키 또는 추후 키 확장으로 수용합니다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-04-17
 */
public final class CardMerchantFeeFromPaymentJsonUtil {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private static final int MONEY_SCALE = 2;

    private CardMerchantFeeFromPaymentJsonUtil() {
    }

    /**
     * 카드 결제이고 JSON 에서 수수료를 읽을 수 있을 때만 양수 금액을 반환합니다.
     *
     * @param payment 결제
     * @param log     SLF4J 로거(민감정보·응답 전문 로깅 금지)
     * @return 수수료(원 단위 소수 둘째 자리), 없거나 실패 시 0
     */
    public static BigDecimal resolveCardMerchantFee(Payment payment, Logger log) {
        if (payment == null || payment.getMethod() != Payment.PaymentMethod.CARD) {
            return BigDecimal.ZERO;
        }
        String raw = firstNonBlank(payment.getExternalResponse(), payment.getWebhookData());
        if (raw == null || raw.isBlank()) {
            return BigDecimal.ZERO;
        }
        final JsonNode root;
        try {
            root = OBJECT_MAPPER.readTree(raw);
        } catch (Exception e) {
            if (log != null && log.isDebugEnabled()) {
                log.debug("D5 card merchant fee: JSON parse failed, provider={}", payment.getProvider());
            }
            return BigDecimal.ZERO;
        }
        BigDecimal cap = payment.getAmount() != null ? payment.getAmount() : null;
        Payment.PaymentProvider provider = payment.getProvider();

        List<JsonNode> candidates = buildCandidateRoots(root);
        for (JsonNode node : candidates) {
            if (node == null || node.isMissingNode() || !node.isObject()) {
                continue;
            }
            if (provider == Payment.PaymentProvider.TOSS) {
                BigDecimal fromToss = tryTossSettlement(node);
                BigDecimal normalized = normalizeFee(fromToss, cap);
                if (normalized.compareTo(BigDecimal.ZERO) > 0) {
                    return normalized;
                }
            }
            BigDecimal generic = tryGenericExplicitFee(node);
            BigDecimal normalizedGen = normalizeFee(generic, cap);
            if (normalizedGen.compareTo(BigDecimal.ZERO) > 0) {
                return normalizedGen;
            }
        }

        if (log != null && log.isDebugEnabled()) {
            log.debug("D5 card merchant fee: no resolved fee field, provider={}", provider);
        }
        return BigDecimal.ZERO;
    }

    private static List<JsonNode> buildCandidateRoots(JsonNode root) {
        List<JsonNode> list = new ArrayList<>();
        list.add(root);
        JsonNode data = root.get(PaymentExternalResponseJsonKeys.DATA);
        if (data != null && data.isObject()) {
            list.add(data);
        }
        JsonNode payment = root.get(PaymentExternalResponseJsonKeys.PAYMENT);
        if (payment != null && payment.isObject()) {
            list.add(payment);
        }
        JsonNode nestedPayment = data != null ? data.get(PaymentExternalResponseJsonKeys.PAYMENT) : null;
        if (nestedPayment != null && nestedPayment.isObject()) {
            list.add(nestedPayment);
        }
        return list;
    }

    private static BigDecimal tryTossSettlement(JsonNode node) {
        JsonNode settlement = node.get(PaymentExternalResponseJsonKeys.SETTLEMENT);
        if (settlement == null || !settlement.isObject()) {
            return null;
        }
        JsonNode fees = settlement.get(PaymentExternalResponseJsonKeys.FEES);
        if (fees != null && fees.isArray() && fees.size() > 0) {
            BigDecimal sum = BigDecimal.ZERO;
            boolean any = false;
            for (JsonNode item : fees) {
                if (item != null && item.has(PaymentExternalResponseJsonKeys.FEE)) {
                    BigDecimal part = readMoney(item.get(PaymentExternalResponseJsonKeys.FEE));
                    if (part != null) {
                        sum = sum.add(part);
                        any = true;
                    }
                }
            }
            if (any && sum.compareTo(BigDecimal.ZERO) > 0) {
                return sum;
            }
        }
        if (settlement.has(PaymentExternalResponseJsonKeys.AMOUNT)
                && settlement.has(PaymentExternalResponseJsonKeys.PAY_OUT_AMOUNT)) {
            BigDecimal amount = readMoney(settlement.get(PaymentExternalResponseJsonKeys.AMOUNT));
            BigDecimal payOut = readMoney(settlement.get(PaymentExternalResponseJsonKeys.PAY_OUT_AMOUNT));
            if (amount != null && payOut != null && amount.compareTo(payOut) >= 0) {
                return amount.subtract(payOut);
            }
        }
        return null;
    }

    private static BigDecimal tryGenericExplicitFee(JsonNode node) {
        String[] keys = {
                PaymentExternalResponseJsonKeys.CARD_MERCHANT_FEE,
                PaymentExternalResponseJsonKeys.MERCHANT_FEE,
                PaymentExternalResponseJsonKeys.MERCHANT_FEE_SNAKE,
                PaymentExternalResponseJsonKeys.PG_FEE,
                PaymentExternalResponseJsonKeys.PG_FEE_SNAKE,
        };
        for (String key : keys) {
            if (node.has(key)) {
                BigDecimal v = readMoney(node.get(key));
                if (v != null && v.compareTo(BigDecimal.ZERO) > 0) {
                    return v;
                }
            }
        }
        return null;
    }

    private static BigDecimal normalizeFee(BigDecimal fee, BigDecimal maxAmount) {
        if (fee == null || fee.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal scaled = fee.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        if (maxAmount != null && scaled.compareTo(maxAmount) > 0) {
            return maxAmount.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        }
        return scaled;
    }

    private static BigDecimal readMoney(JsonNode n) {
        if (n == null || n.isNull()) {
            return null;
        }
        if (n.isNumber()) {
            return n.decimalValue().setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        }
        if (n.isTextual()) {
            try {
                String t = n.asText().trim();
                if (t.isEmpty()) {
                    return null;
                }
                return new BigDecimal(t).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) {
            return a;
        }
        if (b != null && !b.isBlank()) {
            return b;
        }
        return null;
    }
}
