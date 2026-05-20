package com.coresolution.consultation.integration.solapi;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * {@link KakaoSolapiCredentialResolver} 자격증명 lookup 체인 검증.
 *
 * <ul>
 *   <li>1단계: 테넌트 ref ENV ({@code <REF>_API_KEY/_API_SECRET})</li>
 *   <li>2단계: 전역 알림톡 default ({@code kakao.alimtalk.solapi.api-key/api-secret})</li>
 *   <li>3단계(신규): SMS 키 fallback ({@code sms.auth.api-key/api-secret})</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-05-20
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("KakaoSolapiCredentialResolver lookup 체인")
class KakaoSolapiCredentialResolverTest {

    private static final String TENANT_REF = "TENANT_ABC_KAKAO";
    private static final String ALIMTALK_DEFAULT_KEY = "ALIMTALK_NCSKEY";
    private static final String ALIMTALK_DEFAULT_SECRET = "ALIMTALK_NCSSECRET";
    private static final String SMS_FALLBACK_KEY = "SMS_NCSKEY";
    private static final String SMS_FALLBACK_SECRET = "SMS_NCSSECRET";
    private static final String TENANT_KEY = "TENANT_NCSKEY";
    private static final String TENANT_SECRET = "TENANT_NCSSECRET";

    @Mock
    private Environment environment;

    private KakaoSolapiCredentialResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new KakaoSolapiCredentialResolver(environment);
        ReflectionTestUtils.setField(resolver, "defaultApiKey", "");
        ReflectionTestUtils.setField(resolver, "defaultApiSecret", "");
        ReflectionTestUtils.setField(resolver, "defaultPfId", "");
        ReflectionTestUtils.setField(resolver, "smsApiKey", "");
        ReflectionTestUtils.setField(resolver, "smsApiSecret", "");
    }

    @Test
    @DisplayName("테넌트 ref ENV가 있으면 SMS 키 fallback 안 함 (테넌트 분리 보존)")
    void tenantRefEnvWinsOverEveryGlobalFallback() {
        when(environment.getProperty(TENANT_REF + "_API_KEY")).thenReturn(TENANT_KEY);
        when(environment.getProperty(TENANT_REF + "_API_SECRET")).thenReturn(TENANT_SECRET);

        ReflectionTestUtils.setField(resolver, "defaultApiKey", ALIMTALK_DEFAULT_KEY);
        ReflectionTestUtils.setField(resolver, "defaultApiSecret", ALIMTALK_DEFAULT_SECRET);
        ReflectionTestUtils.setField(resolver, "smsApiKey", SMS_FALLBACK_KEY);
        ReflectionTestUtils.setField(resolver, "smsApiSecret", SMS_FALLBACK_SECRET);

        SolapiCredentials credentials = resolver.resolveCredentials(TENANT_REF);

        assertThat(credentials.apiKey()).isEqualTo(TENANT_KEY);
        assertThat(credentials.apiSecret()).isEqualTo(TENANT_SECRET);
        assertThat(credentials.isComplete()).isTrue();
    }

    @Test
    @DisplayName("ref ENV 없고 알림톡 전용 default 있으면 그 값 사용 (SMS 키 fallback 안 함)")
    void alimtalkDefaultWinsOverSmsFallback() {
        lenient().when(environment.getProperty(TENANT_REF + "_API_KEY")).thenReturn(null);
        lenient().when(environment.getProperty(TENANT_REF + "_API_SECRET")).thenReturn(null);

        ReflectionTestUtils.setField(resolver, "defaultApiKey", ALIMTALK_DEFAULT_KEY);
        ReflectionTestUtils.setField(resolver, "defaultApiSecret", ALIMTALK_DEFAULT_SECRET);
        ReflectionTestUtils.setField(resolver, "smsApiKey", SMS_FALLBACK_KEY);
        ReflectionTestUtils.setField(resolver, "smsApiSecret", SMS_FALLBACK_SECRET);

        SolapiCredentials credentials = resolver.resolveCredentials(TENANT_REF);

        assertThat(credentials.apiKey()).isEqualTo(ALIMTALK_DEFAULT_KEY);
        assertThat(credentials.apiSecret()).isEqualTo(ALIMTALK_DEFAULT_SECRET);
    }

    @Test
    @DisplayName("ref ENV·알림톡 default 모두 비고 SMS 키가 있으면 SMS 키로 fallback")
    void smsKeysUsedWhenAlimtalkSecretsAreEmpty() {
        lenient().when(environment.getProperty(TENANT_REF + "_API_KEY")).thenReturn(null);
        lenient().when(environment.getProperty(TENANT_REF + "_API_SECRET")).thenReturn(null);

        ReflectionTestUtils.setField(resolver, "smsApiKey", SMS_FALLBACK_KEY);
        ReflectionTestUtils.setField(resolver, "smsApiSecret", SMS_FALLBACK_SECRET);

        SolapiCredentials credentials = resolver.resolveCredentials(TENANT_REF);

        assertThat(credentials.apiKey()).isEqualTo(SMS_FALLBACK_KEY);
        assertThat(credentials.apiSecret()).isEqualTo(SMS_FALLBACK_SECRET);
        assertThat(credentials.isComplete()).isTrue();
    }

    @Test
    @DisplayName("ref 빈 값이어도 알림톡 default 비고 SMS 키가 있으면 SMS 키 사용 (단일 계정 운영자)")
    void smsKeysUsedWhenRefIsBlank() {
        ReflectionTestUtils.setField(resolver, "smsApiKey", SMS_FALLBACK_KEY);
        ReflectionTestUtils.setField(resolver, "smsApiSecret", SMS_FALLBACK_SECRET);

        SolapiCredentials credentials = resolver.resolveCredentials(null);

        assertThat(credentials.apiKey()).isEqualTo(SMS_FALLBACK_KEY);
        assertThat(credentials.apiSecret()).isEqualTo(SMS_FALLBACK_SECRET);
    }

    @Test
    @DisplayName("SMS 키 중 한 쪽만 있으면 fallback 하지 않음 (불완전 상태 차단)")
    void partialSmsKeysDoNotFallback() {
        lenient().when(environment.getProperty(TENANT_REF + "_API_KEY")).thenReturn(null);
        lenient().when(environment.getProperty(TENANT_REF + "_API_SECRET")).thenReturn(null);

        ReflectionTestUtils.setField(resolver, "smsApiKey", SMS_FALLBACK_KEY);
        ReflectionTestUtils.setField(resolver, "smsApiSecret", "");

        SolapiCredentials credentials = resolver.resolveCredentials(TENANT_REF);

        assertThat(credentials.apiKey()).isBlank();
        assertThat(credentials.apiSecret()).isBlank();
        assertThat(credentials.isComplete()).isFalse();
    }

    @Test
    @DisplayName("모든 키 비어 있으면 빈 자격증명 반환")
    void allEmptyReturnsBlankCredentials() {
        SolapiCredentials credentials = resolver.resolveCredentials(null);

        assertThat(credentials.apiKey()).isBlank();
        assertThat(credentials.apiSecret()).isBlank();
        assertThat(credentials.isComplete()).isFalse();
    }

    @Test
    @DisplayName("hasDefaultCredentials(): SMS 키만 있어도 true")
    void hasDefaultCredentialsTrueWhenOnlySmsKeysPresent() {
        ReflectionTestUtils.setField(resolver, "smsApiKey", SMS_FALLBACK_KEY);
        ReflectionTestUtils.setField(resolver, "smsApiSecret", SMS_FALLBACK_SECRET);

        assertThat(resolver.hasDefaultCredentials()).isTrue();
    }

    @Test
    @DisplayName("hasDefaultCredentials(): 알림톡 전용 키만 있어도 true")
    void hasDefaultCredentialsTrueWhenOnlyAlimtalkKeysPresent() {
        ReflectionTestUtils.setField(resolver, "defaultApiKey", ALIMTALK_DEFAULT_KEY);
        ReflectionTestUtils.setField(resolver, "defaultApiSecret", ALIMTALK_DEFAULT_SECRET);

        assertThat(resolver.hasDefaultCredentials()).isTrue();
    }

    @Test
    @DisplayName("hasDefaultCredentials(): 두 그룹 모두 비면 false")
    void hasDefaultCredentialsFalseWhenAllEmpty() {
        assertThat(resolver.hasDefaultCredentials()).isFalse();
    }
}
