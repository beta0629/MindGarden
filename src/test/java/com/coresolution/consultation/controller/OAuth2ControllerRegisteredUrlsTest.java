package com.coresolution.consultation.controller;

import java.lang.reflect.Field;
import java.lang.reflect.Method;

import com.coresolution.consultation.service.OAuth2FactoryService;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.util.OAuth2DomainUtil;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.coresolution.testsupport.SecurityContextIsolationExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@link OAuth2Controller#assertRegisteredCallbackUrl} 단위 테스트 — OAuth 4종(Naver/Kakao/Google/Apple)
 * {@code *_REGISTERED_URLS} 검증 표준화 (옵션 B′, 2026-06-11).
 *
 * <p>각 provider 의 등록 URL 목록(콤마 구분 env)과 동적으로 계산된 {@code redirect_uri} 의 정합성
 * 검증 helper 의 동작을 4종 provider 모두 동일하게 적용한다.</p>
 *
 * <p>검증 케이스:</p>
 * <ol>
 *   <li>각 provider 별 등록 URL 목록에 포함된 redirect_uri → true</li>
 *   <li>각 provider 별 등록 URL 목록에 없는 redirect_uri → false (흐름 차단 없음, 경고 로그)</li>
 *   <li>{@code *_REGISTERED_URLS} 빈 문자열(env 미주입) → true (graceful skip — 기존 Naver 동작 유지)</li>
 *   <li>{@code *_REGISTERED_URLS} null → true (graceful skip)</li>
 *   <li>redirect_uri 빈/ null → false</li>
 *   <li>등록 URL 목록 콤마 구분·공백 trim 정상 동작</li>
 * </ol>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@ExtendWith({MockitoExtension.class, SecurityContextIsolationExtension.class})
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("OAuth2Controller#assertRegisteredCallbackUrl — OAuth 4종 REGISTERED_URLS 검증 표준화")
class OAuth2ControllerRegisteredUrlsTest {

    private static final String PROD_HOST = "https://core-solution.co.kr";
    private static final String DEV_HOST = "https://dev.core-solution.co.kr";

    @Mock private OAuth2FactoryService oauth2FactoryService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private OAuth2DomainUtil oauth2DomainUtil;
    @Mock private com.coresolution.consultation.repository.UserRepository userRepository;
    @Mock private com.coresolution.consultation.service.JwtService jwtService;
    @Mock private com.coresolution.consultation.service.DynamicPermissionService dynamicPermissionService;
    @Mock private UserSessionService userSessionService;
    @Mock private com.coresolution.core.repository.TenantRepository tenantRepository;
    @Mock private org.springframework.core.env.Environment environment;
    @Mock private com.coresolution.consultation.service.AppleSignInService appleSignInService;

    @InjectMocks
    private OAuth2Controller controller;

    private void injectField(String fieldName, Object value) throws Exception {
        Field field = OAuth2Controller.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(controller, value);
    }

    /**
     * package-private helper 직접 호출. (signature: boolean assertRegisteredCallbackUrl(String, String, String))
     */
    private boolean callAssertRegisteredCallbackUrl(String redirectUri, String registeredUrls,
            String providerName) throws Exception {
        Method method = OAuth2Controller.class.getDeclaredMethod("assertRegisteredCallbackUrl",
                String.class, String.class, String.class);
        method.setAccessible(true);
        return (boolean) method.invoke(controller, redirectUri, registeredUrls, providerName);
    }

    // ===== Kakao =====

    @Test
    @DisplayName("KAKAO: 등록된 legacy /api/auth/kakao/callback 통과")
    void kakaoRegisteredLegacyCallbackPasses() throws Exception {
        String registered = PROD_HOST + "/api/auth/kakao/callback,"
                + DEV_HOST + "/api/auth/kakao/callback";
        injectField("kakaoRegisteredUrls", registered);
        assertThat(callAssertRegisteredCallbackUrl(
                PROD_HOST + "/api/auth/kakao/callback", registered, "KAKAO")).isTrue();
        assertThat(callAssertRegisteredCallbackUrl(
                DEV_HOST + "/api/auth/kakao/callback", registered, "KAKAO")).isTrue();
    }

    @Test
    @DisplayName("KAKAO: 미등록 callback URL 은 false (흐름 차단 없음, 경고 로그)")
    void kakaoUnregisteredCallbackRejected() throws Exception {
        String registered = PROD_HOST + "/api/auth/kakao/callback";
        assertThat(callAssertRegisteredCallbackUrl(
                "https://other.example.com/api/auth/kakao/callback", registered, "KAKAO"))
                .isFalse();
        assertThat(callAssertRegisteredCallbackUrl(
                PROD_HOST + "/api/v1/auth/kakao/callback", registered, "KAKAO")).isFalse();
    }

    // ===== Naver =====

    @Test
    @DisplayName("NAVER: 등록된 legacy /api/auth/naver/callback 통과 + 기존 동작 유지")
    void naverRegisteredLegacyCallbackPasses() throws Exception {
        String registered = PROD_HOST + "/api/auth/naver/callback";
        assertThat(callAssertRegisteredCallbackUrl(
                PROD_HOST + "/api/auth/naver/callback", registered, "NAVER")).isTrue();
    }

    @Test
    @DisplayName("NAVER: 미등록 callback URL 은 false")
    void naverUnregisteredCallbackRejected() throws Exception {
        String registered = PROD_HOST + "/api/auth/naver/callback";
        assertThat(callAssertRegisteredCallbackUrl(
                "https://attacker.example.com/api/auth/naver/callback", registered, "NAVER"))
                .isFalse();
    }

    // ===== Google =====

    @Test
    @DisplayName("GOOGLE: 등록된 /api/v1/auth/google/callback 통과")
    void googleRegisteredV1CallbackPasses() throws Exception {
        String registered = PROD_HOST + "/api/v1/auth/google/callback,"
                + DEV_HOST + "/api/v1/auth/google/callback";
        assertThat(callAssertRegisteredCallbackUrl(
                PROD_HOST + "/api/v1/auth/google/callback", registered, "GOOGLE")).isTrue();
        assertThat(callAssertRegisteredCallbackUrl(
                DEV_HOST + "/api/v1/auth/google/callback", registered, "GOOGLE")).isTrue();
    }

    @Test
    @DisplayName("GOOGLE: 미등록 callback URL 은 false")
    void googleUnregisteredCallbackRejected() throws Exception {
        String registered = PROD_HOST + "/api/v1/auth/google/callback";
        assertThat(callAssertRegisteredCallbackUrl(
                "https://tenant.core-solution.co.kr/api/v1/auth/google/callback",
                registered, "GOOGLE")).isFalse();
        assertThat(callAssertRegisteredCallbackUrl(
                PROD_HOST + "/api/auth/google/callback", registered, "GOOGLE")).isFalse();
    }

    // ===== Apple =====

    @Test
    @DisplayName("APPLE: 등록된 /api/v1/auth/apple/callback 통과")
    void appleRegisteredV1CallbackPasses() throws Exception {
        String registered = PROD_HOST + "/api/v1/auth/apple/callback,"
                + DEV_HOST + "/api/v1/auth/apple/callback";
        assertThat(callAssertRegisteredCallbackUrl(
                PROD_HOST + "/api/v1/auth/apple/callback", registered, "APPLE")).isTrue();
        assertThat(callAssertRegisteredCallbackUrl(
                DEV_HOST + "/api/v1/auth/apple/callback", registered, "APPLE")).isTrue();
    }

    @Test
    @DisplayName("APPLE: 미등록 callback URL 은 false")
    void appleUnregisteredCallbackRejected() throws Exception {
        String registered = PROD_HOST + "/api/v1/auth/apple/callback";
        assertThat(callAssertRegisteredCallbackUrl(
                "https://other.example.com/api/v1/auth/apple/callback",
                registered, "APPLE")).isFalse();
    }

    // ===== Graceful skip (env 미주입) =====

    @Test
    @DisplayName("registered-urls 빈 문자열(env 미주입) → true (graceful skip — 기존 Naver 동작 유지)")
    void emptyRegisteredUrlsSkipsValidation() throws Exception {
        // 4종 모두 동일하게 빈 문자열이면 skip → true
        assertThat(callAssertRegisteredCallbackUrl(
                PROD_HOST + "/api/auth/kakao/callback", "", "KAKAO")).isTrue();
        assertThat(callAssertRegisteredCallbackUrl(
                PROD_HOST + "/api/auth/naver/callback", "", "NAVER")).isTrue();
        assertThat(callAssertRegisteredCallbackUrl(
                PROD_HOST + "/api/v1/auth/google/callback", "", "GOOGLE")).isTrue();
        assertThat(callAssertRegisteredCallbackUrl(
                PROD_HOST + "/api/v1/auth/apple/callback", "", "APPLE")).isTrue();
    }

    @Test
    @DisplayName("registered-urls null → true (graceful skip)")
    void nullRegisteredUrlsSkipsValidation() throws Exception {
        assertThat(callAssertRegisteredCallbackUrl(
                PROD_HOST + "/api/v1/auth/google/callback", null, "GOOGLE")).isTrue();
    }

    @Test
    @DisplayName("redirect_uri 가 비어 있으면(빈/null) registered-urls 가 채워져도 false")
    void emptyRedirectUriRejectedWhenRegisteredPresent() throws Exception {
        String registered = PROD_HOST + "/api/v1/auth/google/callback";
        assertThat(callAssertRegisteredCallbackUrl(null, registered, "GOOGLE")).isFalse();
        assertThat(callAssertRegisteredCallbackUrl("", registered, "GOOGLE")).isFalse();
        assertThat(callAssertRegisteredCallbackUrl("   ", registered, "GOOGLE")).isFalse();
    }

    // ===== 파싱 정합성 =====

    @Test
    @DisplayName("등록 URL 목록 콤마 구분 + 공백 trim 정상 동작")
    void registeredUrlsParseCommaAndTrimWhitespace() throws Exception {
        String registered = "  " + PROD_HOST + "/api/auth/kakao/callback  ,  "
                + DEV_HOST + "/api/auth/kakao/callback ";
        assertThat(callAssertRegisteredCallbackUrl(
                PROD_HOST + "/api/auth/kakao/callback", registered, "KAKAO")).isTrue();
        assertThat(callAssertRegisteredCallbackUrl(
                DEV_HOST + "/api/auth/kakao/callback", registered, "KAKAO")).isTrue();
    }

    @Test
    @DisplayName("빈 콤마 항목은 무시되고 유효 항목만 비교")
    void registeredUrlsIgnoresEmptyEntries() throws Exception {
        String registered = "," + PROD_HOST + "/api/v1/auth/apple/callback,,";
        assertThat(callAssertRegisteredCallbackUrl(
                PROD_HOST + "/api/v1/auth/apple/callback", registered, "APPLE")).isTrue();
        assertThat(callAssertRegisteredCallbackUrl(
                "https://other.example.com/api/v1/auth/apple/callback", registered, "APPLE"))
                .isFalse();
    }
}
