package com.coresolution.consultation.service.portone;

import com.coresolution.core.constants.TenantPgSettingsJsonKeys;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 포트원 V2 채널 키 해석 — {@code testMode} 에 따라 live/test 키를 선택한다.
 *
 * @author CoreSolution
 * @since 2026-09-16
 */
public final class PortOneChannelKeyResolver {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private PortOneChannelKeyResolver() {
    }

    /**
     * settings_json 과 testMode 로 결제에 사용할 channelKey 를 반환한다.
     *
     * @param settingsJson 테넌트 PG settings_json
     * @param testMode     테스트 모드 여부
     * @return channelKey (없으면 null 또는 blank)
     */
    public static String resolveChannelKey(String settingsJson, Boolean testMode) {
        boolean useTest = Boolean.TRUE.equals(testMode);
        String keyName = useTest
                ? TenantPgSettingsJsonKeys.PORTONE_CHANNEL_KEY_TEST
                : TenantPgSettingsJsonKeys.PORTONE_CHANNEL_KEY;
        return readTextField(settingsJson, keyName);
    }

    /**
     * settings_json 에서 지정 키의 텍스트 값을 읽는다.
     *
     * @param settingsJson JSON 문자열
     * @param fieldName    키 이름
     * @return 값 또는 null
     */
    public static String readTextField(String settingsJson, String fieldName) {
        if (settingsJson == null || settingsJson.isBlank() || fieldName == null || fieldName.isBlank()) {
            return null;
        }
        try {
            JsonNode root = OBJECT_MAPPER.readTree(settingsJson);
            if (root == null || !root.isObject()) {
                return null;
            }
            JsonNode node = root.get(fieldName);
            if (node == null || node.isNull() || !node.isTextual()) {
                return null;
            }
            String value = node.asText();
            if (value == null || value.isBlank()) {
                return null;
            }
            return value.trim();
        } catch (Exception e) {
            return null;
        }
    }
}
