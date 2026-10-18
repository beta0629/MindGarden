package com.coresolution.consultation.constant;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 개인 알림({@code notifications.metadata_json}) 키.
 * 내담자 알림 카드는 본문 파싱 없이 {@code kind} 로 유형을 가른다.
 *
 * @author CoreSolution
 * @since 2026-10-16
 */
public final class PersonalNotificationMetadata {

    public static final String KEY_KIND = "kind";
    public static final String KEY_MAPPING_ID = "mappingId";
    public static final String KEY_PRODUCT_NAME = "productName";
    public static final String KEY_AMOUNT = "amount";

    public static final String KIND_MAPPING_APPROVED = "MAPPING_APPROVED";
    public static final String KIND_PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED";
    public static final String KIND_DEPOSIT_CONFIRMED = "DEPOSIT_CONFIRMED";

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private PersonalNotificationMetadata() {
    }

    /**
     * @param kind {@link #KIND_MAPPING_APPROVED} 등
     * @param mappingId 매핑 PK. 없으면 생략
     * @param productName 상품명. 비어 있으면 생략
     * @param amount 금액(원). 0 이하·null 이면 생략
     * @return JSON 문자열. kind 가 없거나 직렬화에 실패하면 null
     */
    public static String toJson(String kind, Long mappingId, String productName, Long amount) {
        if (kind == null || kind.isBlank()) {
            return null;
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put(KEY_KIND, kind);
        if (mappingId != null) {
            payload.put(KEY_MAPPING_ID, mappingId);
        }
        if (productName != null && !productName.isBlank()) {
            payload.put(KEY_PRODUCT_NAME, productName);
        }
        if (amount != null && amount > 0) {
            payload.put(KEY_AMOUNT, amount);
        }
        try {
            return MAPPER.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            return null;
        }
    }
}
