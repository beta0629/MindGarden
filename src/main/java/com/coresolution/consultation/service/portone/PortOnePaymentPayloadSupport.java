package com.coresolution.consultation.service.portone;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 포트원 V2 결제 JSON 공통 파싱 (금액·통화·주문 참조).
 * <p>
 * 웹훅·조회·검증 경로가 같은 필드를 보도록 헬퍼를 한곳에 둔다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-10-16
 */
final class PortOnePaymentPayloadSupport {

    private PortOnePaymentPayloadSupport() {
    }

    /**
     * PortOne {@code amount.total} (또는 숫자형 {@code amount}) 를 꺼낸다.
     *
     * @param paymentNode 결제 JSON
     * @return 금액, 없거나 파싱 실패 시 null
     */
    static BigDecimal extractTotalAmount(JsonNode paymentNode) {
        return extractAmountField(paymentNode, "total");
    }

    /**
     * PortOne {@code amount.paid} 를 꺼낸다. 객체형 amount 에만 존재한다.
     *
     * @param paymentNode 결제 JSON
     * @return 금액, 없거나 파싱 실패 시 null
     */
    static BigDecimal extractPaidAmount(JsonNode paymentNode) {
        JsonNode amountNode = paymentNode == null ? null : paymentNode.get("amount");
        if (amountNode == null || amountNode.isNull() || amountNode.isNumber()) {
            return null;
        }
        return decimalFrom(amountNode.get("paid"));
    }

    /**
     * PortOne {@code amount.currency} 또는 최상위 {@code currency}.
     *
     * @param paymentNode 결제 JSON
     * @return 통화 코드, 없으면 null
     */
    static String extractCurrency(JsonNode paymentNode) {
        if (paymentNode == null || paymentNode.isNull()) {
            return null;
        }
        JsonNode amountNode = paymentNode.get("amount");
        if (amountNode != null && amountNode.isObject()) {
            String fromAmount = text(amountNode, "currency");
            if (fromAmount != null && !fromAmount.isBlank()) {
                return fromAmount.trim();
            }
        }
        String topLevel = text(paymentNode, "currency");
        return topLevel == null || topLevel.isBlank() ? null : topLevel.trim();
    }

    /**
     * PortOne 결제 {@code id}.
     *
     * @param paymentNode 결제 JSON
     * @return id, 없으면 null
     */
    static String extractPaymentId(JsonNode paymentNode) {
        String id = text(paymentNode, "id");
        return id == null || id.isBlank() ? null : id.trim();
    }

    /**
     * 페이로드에 있는 주문 참조 후보를 모은다.
     * <p>
     * 후보: {@code merchantOrderReference}, {@code orderId}, {@code payment.merchantUid},
     * {@code customData.orderPublicId} (객체 또는 JSON 문자열).
     * </p>
     *
     * @param paymentNode  결제/웹훅 data JSON
     * @param objectMapper customData 문자열 파싱용 (null 이면 문자열 customData 스킵)
     * @return 비어 있지 않은 참조 목록 (등장 순, 중복 제거)
     */
    static List<String> extractOrderReferenceCandidates(JsonNode paymentNode, ObjectMapper objectMapper) {
        Set<String> refs = new LinkedHashSet<>();
        if (paymentNode == null || paymentNode.isNull()) {
            return List.of();
        }
        addIfPresent(refs, text(paymentNode, "merchantOrderReference"));
        addIfPresent(refs, text(paymentNode, "orderId"));
        addIfPresent(refs, textNested(paymentNode, "payment", "merchantUid"));
        addIfPresent(refs, resolveOrderPublicIdFromCustomData(paymentNode, objectMapper));
        return new ArrayList<>(refs);
    }

    /**
     * PortOne 주문 참조가 기대 주문과 맞는지 본다.
     * <p>
     * 참조가 하나도 없으면 통과. 하나라도 기대값과 다르면 불일치.
     * </p>
     *
     * @param paymentNode           결제 JSON
     * @param expectedOrderPublicId 기대 주문 공개 ID
     * @param objectMapper          customData 파싱용
     * @return 전부 일치하거나 참조 없음이면 true
     */
    static boolean orderReferencesMatch(
            JsonNode paymentNode, String expectedOrderPublicId, ObjectMapper objectMapper) {
        if (expectedOrderPublicId == null || expectedOrderPublicId.isBlank()) {
            return false;
        }
        String expected = expectedOrderPublicId.trim();
        List<String> refs = extractOrderReferenceCandidates(paymentNode, objectMapper);
        if (refs.isEmpty()) {
            return true;
        }
        for (String ref : refs) {
            if (!expected.equals(ref)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Lookup 경로의 customData 매칭과 동일한 관대한 규칙 (필드 일치 또는 contains).
     *
     * @param customData      customData 노드
     * @param orderPublicId   기대 주문 ID
     * @return 매칭이면 true
     */
    static boolean customDataMatchesOrder(JsonNode customData, String orderPublicId) {
        if (customData == null || customData.isNull() || orderPublicId == null || orderPublicId.isBlank()) {
            return false;
        }
        if (customData.isObject()) {
            String fromField = text(customData, "orderPublicId");
            if (orderPublicId.equals(fromField)) {
                return true;
            }
            return customData.toString().contains(orderPublicId);
        }
        if (customData.isTextual()) {
            String raw = customData.asText();
            if (raw == null || raw.isBlank()) {
                return false;
            }
            if (orderPublicId.equals(raw.trim())) {
                return true;
            }
            return raw.contains(orderPublicId);
        }
        return customData.toString().contains(orderPublicId);
    }

    private static BigDecimal extractAmountField(JsonNode paymentNode, String field) {
        JsonNode amountNode = paymentNode == null ? null : paymentNode.get("amount");
        if (amountNode == null || amountNode.isNull()) {
            return null;
        }
        if (amountNode.isNumber()) {
            // 레거시 숫자형 amount 는 total 로만 해석. paid 전용 필드는 없음.
            return "total".equals(field) ? amountNode.decimalValue() : null;
        }
        return decimalFrom(amountNode.get(field));
    }

    private static BigDecimal decimalFrom(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isNumber()) {
            return node.decimalValue();
        }
        if (node.isTextual()) {
            try {
                return new BigDecimal(node.asText());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private static String resolveOrderPublicIdFromCustomData(JsonNode data, ObjectMapper objectMapper) {
        if (data == null || data.isNull() || !data.has("customData")) {
            return null;
        }
        JsonNode customData = data.get("customData");
        if (customData == null || customData.isNull()) {
            return null;
        }
        if (customData.isObject()) {
            return blankToNull(text(customData, "orderPublicId"));
        }
        if (customData.isTextual() && objectMapper != null) {
            String raw = customData.asText();
            if (raw == null || raw.isBlank()) {
                return null;
            }
            try {
                JsonNode parsed = objectMapper.readTree(raw);
                return blankToNull(text(parsed, "orderPublicId"));
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }

    private static void addIfPresent(Set<String> refs, String value) {
        if (value != null && !value.isBlank()) {
            refs.add(value.trim());
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String text(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) {
            return null;
        }
        return node.get(field).asText(null);
    }

    private static String textNested(JsonNode node, String parent, String child) {
        if (node == null) {
            return null;
        }
        JsonNode p = node.get(parent);
        if (p == null || !p.hasNonNull(child)) {
            return null;
        }
        String v = p.get(child).asText();
        return v == null || v.isEmpty() ? null : v;
    }
}
