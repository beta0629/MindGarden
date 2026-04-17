package com.coresolution.core.service;

import com.coresolution.core.config.KiccEasypayProperties;
import com.coresolution.core.constants.TenantPgSettingsJsonKeys;
import com.coresolution.core.domain.TenantPgConfiguration;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URI;

/**
 * KICC 이지페이 API 베이스 호스트·URL 결정. 우선순위: 테넌트 {@code settings_json} &gt; {@link KiccEasypayProperties}.
 *
 * @author CoreSolution
 * @since 2026-04-17
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KiccEasypayEndpointResolver {

    private static final String HTTPS_PREFIX = "https://";
    private static final String PATH_RETRIEVE_TRANSACTION = "/api/trades/retrieveTransaction";

    private final KiccEasypayProperties easypayProperties;
    private final ObjectMapper objectMapper;

    /**
     * 거래상태 조회 API 전체 URL.
     *
     * @param configuration 테넌트 PG 설정
     * @return HTTPS URL
     */
    public String resolveRetrieveTransactionUrl(TenantPgConfiguration configuration) {
        return HTTPS_PREFIX + resolveApiHost(configuration) + PATH_RETRIEVE_TRANSACTION;
    }

    /**
     * 현재 설정에 따른 API 호스트명(표시·로그용).
     *
     * @param configuration 테넌트 PG 설정
     * @return 호스트만 (스킴·경로 없음)
     */
    public String resolveApiHost(TenantPgConfiguration configuration) {
        boolean testMode = Boolean.TRUE.equals(configuration.getTestMode());
        String fromSettings = readHostOverride(configuration.getSettingsJson(), testMode);
        if (fromSettings != null && !fromSettings.isBlank()) {
            return normalizeHost(fromSettings.trim());
        }
        String fallback = testMode ? easypayProperties.getHostTest() : easypayProperties.getHostProd();
        if (fallback == null || fallback.isBlank()) {
            log.error("KICC 이지페이 호스트 기본값이 비어 있습니다. mindgarden.pg.kicc.easypay.host-test / host-prod 를 설정하세요.");
            return "";
        }
        return normalizeHost(fallback.trim());
    }

    private String readHostOverride(String settingsJson, boolean testMode) {
        if (settingsJson == null || settingsJson.isBlank()) {
            return null;
        }
        try {
            JsonNode root = objectMapper.readTree(settingsJson);
            if (root == null || !root.isObject()) {
                return null;
            }
            String key = testMode
                    ? TenantPgSettingsJsonKeys.KICC_EASYPAY_API_HOST_TEST
                    : TenantPgSettingsJsonKeys.KICC_EASYPAY_API_HOST_PROD;
            JsonNode node = root.get(key);
            if (node == null || node.isNull() || !node.isTextual()) {
                return null;
            }
            return node.asText(null);
        } catch (Exception e) {
            log.warn("KICC settings_json 파싱 실패: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 호스트만 남긴다. {@code https://host} 또는 {@code host/path} 형태를 허용한다.
     *
     * @param raw 사용자·YAML 입력
     * @return 정규화된 호스트
     */
    public static String normalizeHost(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        String s = raw.trim();
        if (s.isEmpty()) {
            return "";
        }
        try {
            if (s.contains("://")) {
                URI uri = URI.create(s);
                String host = uri.getHost();
                return host != null ? host : s;
            }
            int slash = s.indexOf('/');
            if (slash > 0) {
                return s.substring(0, slash).trim();
            }
            return s;
        } catch (Exception e) {
            return s;
        }
    }

    public static String retrieveTransactionPath() {
        return PATH_RETRIEVE_TRANSACTION;
    }
}
