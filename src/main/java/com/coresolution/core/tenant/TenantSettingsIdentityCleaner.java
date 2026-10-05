package com.coresolution.core.tenant;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * {@code settings_json} 의 subdomain·domain 키를 제거한다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public final class TenantSettingsIdentityCleaner {

    private TenantSettingsIdentityCleaner() {
    }

    /**
     * @param settingsJson 원본 JSON. null·공백이면 그대로 반환
     * @param objectMapper Jackson
     * @return subdomain·domain 이 제거된 JSON
     */
    public static String stripSubdomainAndDomain(String settingsJson, ObjectMapper objectMapper) {
        if (settingsJson == null || settingsJson.isBlank()) {
            return settingsJson;
        }
        JsonNode node = readObject(settingsJson, objectMapper);
        ObjectNode objectNode = (ObjectNode) node;
        objectNode.remove(TenantCloseMessages.SETTINGS_KEY_SUBDOMAIN);
        objectNode.remove(TenantCloseMessages.SETTINGS_KEY_DOMAIN);
        try {
            return objectMapper.writeValueAsString(objectNode);
        } catch (Exception ex) {
            throw new TenantCloseRejectedException(
                    TenantCloseMessages.CODE_SETTINGS_UNREADABLE,
                    TenantCloseMessages.MESSAGE_SETTINGS_UNREADABLE);
        }
    }

    /**
     * @param settingsJson 원본 JSON
     * @param objectMapper Jackson
     * @return {@code $.domain}. 없으면 null
     */
    public static String extractDomain(String settingsJson, ObjectMapper objectMapper) {
        if (settingsJson == null || settingsJson.isBlank()) {
            return null;
        }
        JsonNode node = readObject(settingsJson, objectMapper);
        JsonNode domain = node.get(TenantCloseMessages.SETTINGS_KEY_DOMAIN);
        if (domain == null || domain.isNull()) {
            return null;
        }
        String text = domain.asText();
        if (text == null || text.isBlank() || "null".equals(text)) {
            return null;
        }
        return text;
    }

    private static JsonNode readObject(String settingsJson, ObjectMapper objectMapper) {
        try {
            JsonNode node = objectMapper.readTree(settingsJson);
            if (node == null || !node.isObject()) {
                throw new TenantCloseRejectedException(
                        TenantCloseMessages.CODE_SETTINGS_UNREADABLE,
                        TenantCloseMessages.MESSAGE_SETTINGS_UNREADABLE);
            }
            return node;
        } catch (TenantCloseRejectedException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new TenantCloseRejectedException(
                    TenantCloseMessages.CODE_SETTINGS_UNREADABLE,
                    TenantCloseMessages.MESSAGE_SETTINGS_UNREADABLE);
        }
    }
}
