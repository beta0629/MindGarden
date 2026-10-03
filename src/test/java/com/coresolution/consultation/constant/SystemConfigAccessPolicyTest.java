package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link SystemConfigAccessPolicy} 허용 목록 단위 테스트.
 *
 * <p>P0 보안(2026-10-03): 범용 system-config API 가 임의 키를 읽고 쓰지 못하도록
 * allow-list 가 실제로 좁은지 검증한다.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@DisplayName("SystemConfigAccessPolicy — system-config allow-list")
class SystemConfigAccessPolicyTest {

    @Test
    @DisplayName("임의 키는 읽기·쓰기 모두 거부")
    void arbitraryKeys_areRejected() {
        String[] arbitraryKeys = {
            "OTHER_CONFIG_KEY",
            "PORTONE_WEBHOOK_SECRET",
            "DB_PASSWORD",
            "KAKAO_ALIMTALK_SENDER_KEY",
            "../../etc/passwd",
            ""
        };

        for (String key : arbitraryKeys) {
            assertThat(SystemConfigAccessPolicy.isReadable(key))
                    .as("읽기 거부: %s", key).isFalse();
            assertThat(SystemConfigAccessPolicy.isWritable(key))
                    .as("쓰기 거부: %s", key).isFalse();
        }
        assertThat(SystemConfigAccessPolicy.isReadable(null)).isFalse();
        assertThat(SystemConfigAccessPolicy.isWritable(null)).isFalse();
    }

    @Test
    @DisplayName("AI 프로바이더 키·URL·모델은 읽기만 허용, 쓰기는 운영자 전용")
    void aiProviderKeys_readOnlyForTenantAdmin() {
        for (String prefix : SystemConfigAccessPolicy.AI_PROVIDER_KEY_PREFIXES) {
            for (String suffix : new String[] {
                SystemConfigAccessPolicy.SUFFIX_API_KEY,
                SystemConfigAccessPolicy.SUFFIX_API_URL,
                SystemConfigAccessPolicy.SUFFIX_MODEL
            }) {
                String key = prefix + suffix;
                assertThat(SystemConfigAccessPolicy.isReadable(key))
                        .as("읽기 허용(마스킹): %s", key).isTrue();
                assertThat(SystemConfigAccessPolicy.isWritable(key))
                        .as("쓰기 거부: %s", key).isFalse();
                assertThat(SystemConfigAccessPolicy.isOpsOnlyWrite(key))
                        .as("운영자 전용 쓰기: %s", key).isTrue();
            }
        }
    }

    @Test
    @DisplayName("쓰기 허용 키는 테넌트 단위 운영 플래그만 (AI 기본 provider·플랫폼 세션 스위치 제외)")
    void writableKeys_containNoSecrets() {
        assertThat(SystemConfigAccessPolicy.WRITABLE_KEYS)
                .containsExactlyInAnyOrder(
                        SystemConfigAccessPolicy.WELLNESS_AUTO_SEND_ENABLED,
                        SystemConfigAccessPolicy.WELLNESS_SEND_TIME,
                        SystemConfigAccessPolicy.WELLNESS_TARGET_ROLES,
                        SessionSecurityFlagKeys.DUPLICATE_LOGIN_ALLOWED);

        assertThat(SystemConfigAccessPolicy.WRITABLE_KEYS)
                .noneMatch(SystemConfigAccessPolicy::isSecretValueKey);
    }

    @Test
    @DisplayName("AI 기본 provider·플랫폼 세션 스위치는 읽기만 허용, 쓰기는 운영자 전용")
    void platformKeys_areOpsOnlyWrite() {
        String[] opsOnlyKeys = {
            SystemConfigAccessPolicy.AI_DEFAULT_PROVIDER,
            SessionSecurityFlagKeys.OAUTH_REQUIRE_SERVER_VERIFY,
            SessionSecurityFlagKeys.BACKGROUND_401_KEEP_USER,
            SessionSecurityFlagKeys.SOFT_FAIL_ENABLED
        };
        for (String key : opsOnlyKeys) {
            assertThat(SystemConfigAccessPolicy.isReadable(key)).as("읽기 허용: %s", key).isTrue();
            assertThat(SystemConfigAccessPolicy.isWritable(key)).as("쓰기 거부: %s", key).isFalse();
            assertThat(SystemConfigAccessPolicy.isOpsOnlyWrite(key)).as("운영자 전용: %s", key).isTrue();
        }
        assertThat(SystemConfigAccessPolicy.isOpsOnlyWrite(SessionSecurityFlagKeys.DUPLICATE_LOGIN_ALLOWED))
                .isFalse();
    }

    @Test
    @DisplayName("시크릿 키 판정 — API_KEY/SECRET/PASSWORD/TOKEN/CREDENTIAL 포함")
    void secretValueKeyDetection() {
        assertThat(SystemConfigAccessPolicy.isSecretValueKey("OPENAI_API_KEY")).isTrue();
        assertThat(SystemConfigAccessPolicy.isSecretValueKey("portone_webhook_secret")).isTrue();
        assertThat(SystemConfigAccessPolicy.isSecretValueKey("DB_PASSWORD")).isTrue();
        assertThat(SystemConfigAccessPolicy.isSecretValueKey("ACCESS_TOKEN")).isTrue();
        assertThat(SystemConfigAccessPolicy.isSecretValueKey("PG_CREDENTIAL_ID")).isTrue();

        assertThat(SystemConfigAccessPolicy.isSecretValueKey("OPENAI_MODEL")).isFalse();
        assertThat(SystemConfigAccessPolicy.isSecretValueKey("WELLNESS_SEND_TIME")).isFalse();
        assertThat(SystemConfigAccessPolicy.isSecretValueKey(null)).isFalse();
        assertThat(SystemConfigAccessPolicy.isSecretValueKey("  ")).isFalse();
    }
}
