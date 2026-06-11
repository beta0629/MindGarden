package com.coresolution.consultation.controller;

import java.lang.reflect.Field;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.oauth.OAuth2UserFacingMessages;
import com.coresolution.consultation.service.OAuth2FactoryService;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.util.OAuth2DomainUtil;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.domain.Tenant;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * P3 진단 보강 — OAuth2 콜백 tenant_id 결락 분기의 ERROR→WARN 강등 + Micrometer Counter
 * + 진단 필드(stateEncodedPrefix/sessionIdMasked/savedStatePresent/hostSuggestsSubdomain) 회귀 방지.
 *
 * <p>대상: {@link OAuth2Controller#googleCallback} / {@link OAuth2Controller#appleCallback}
 * 의 {@code MSG_TENANT_NOT_REGISTERED} redirect 분기. 정상 경로(state 디코드 성공) 에서는
 * 카운터 증가 0 임을 함께 검증한다.
 *
 * <p>참조: 디버거 보고서
 * {@code agent-transcripts/.../subagents/e2c55a6d-a578-4ca0-83f7-e2b3766998f0.jsonl} 및
 * {@code docs/standards/LOGGING_STANDARD.md}.
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("OAuth2Controller — tenant_id 결락 분기 P3 진단 (Counter + WARN 로그)")
class OAuth2ControllerTenantUnresolvedDiagnosticsTest {

    private static final String TENANT_ID = "mindgarden";
    private static final String SUBDOMAIN_HOST = "core-solution.co.kr";

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

    @Spy
    private MeterRegistry meterRegistry = new SimpleMeterRegistry();

    @InjectMocks
    private OAuth2Controller controller;

    private ListAppender<ILoggingEvent> logAppender;
    private Logger oauthLogger;

    @BeforeEach
    void setUp() throws Exception {
        injectField("googleRegisteredUrls", "");
        injectField("appleRegisteredUrls", "");
        injectField("googleRedirectUri",
                "https://core-solution.co.kr/api/v1/auth/google/callback");
        injectField("appleRedirectUri",
                "https://core-solution.co.kr/api/v1/auth/apple/callback");
        mockTenantLookup(TENANT_ID);

        oauthLogger = (Logger) LoggerFactory.getLogger(OAuth2Controller.class);
        logAppender = new ListAppender<>();
        logAppender.start();
        oauthLogger.addAppender(logAppender);
    }

    private void detachAppender() {
        if (oauthLogger != null && logAppender != null) {
            oauthLogger.detachAppender(logAppender);
        }
    }

    private void injectField(String fieldName, Object value) throws Exception {
        Field field = OAuth2Controller.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(controller, value);
    }

    private void mockTenantLookup(String tenantId) {
        Tenant tenant = new Tenant();
        tenant.setTenantId(tenantId);
        tenant.setSubdomain(tenantId);
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId))
                .thenReturn(Optional.of(tenant));
        when(oauth2DomainUtil.normalizeFrontendParentDomainForRedirect("core-solution.co.kr"))
                .thenReturn("core-solution.co.kr");
    }

    private MockHttpServletRequest apexCallbackRequest(String callbackPath) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("GET");
        request.setRequestURI(callbackPath);
        request.addHeader("Host", SUBDOMAIN_HOST);
        request.addHeader("X-Forwarded-Proto", "https");
        request.addHeader("X-Forwarded-Port", "443");
        request.setScheme("https");
        request.setServerName(SUBDOMAIN_HOST);
        request.setServerPort(443);
        return request;
    }

    private static String composite(String tenant, String nonce) {
        String enc = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(tenant.getBytes(StandardCharsets.UTF_8));
        return enc + "." + nonce;
    }

    private double counterCount(String provider, String reason) {
        Counter c = meterRegistry.find("oauth2_callback_tenant_unresolved_total")
                .tag("provider", provider).tag("reason", reason).counter();
        return c == null ? 0d : c.count();
    }

    private static MockHttpSession sessionWithoutTenant() {
        return new MockHttpSession();
    }

    // ==================================================================
    // Google — 3 reason × 1 = 3 increment
    // ==================================================================

    @Test
    @DisplayName("Google: state == null + code != null → reason=state_missing, MSG_TENANT_NOT_REGISTERED")
    void googleCallback_stateNull_reasonStateMissing() {
        try {
            ResponseEntity<?> response = controller.googleCallback(
                    /* code */ "g-code",
                    /* state */ null,
                    /* error */ null,
                    /* mode */ null,
                    apexCallbackRequest("/api/v1/auth/google/callback"),
                    sessionWithoutTenant());

            assertThat(response.getStatusCode().value()).isEqualTo(302);
            String location = response.getHeaders().getFirst("Location");
            assertThat(location).contains("provider=GOOGLE");
            assertThat(location).contains(URLEncoder.encode(
                    OAuth2UserFacingMessages.MSG_TENANT_NOT_REGISTERED, StandardCharsets.UTF_8));
            assertThat(counterCount("GOOGLE",
                    OAuth2Controller.OAUTH2_TENANT_UNRESOLVED_REASON_SESSION_ONLY_PATH_MISSING))
                    .isEqualTo(1d);
        } finally {
            detachAppender();
        }
    }

    @Test
    @DisplayName("Google: state == \"garbage.uuid\" → reason=state_decode_failed")
    void googleCallback_stateDecodeFailed_reasonStateDecodeFailed() {
        try {
            String state = "!!!notbase64!!!." + UUID.randomUUID();
            ResponseEntity<?> response = controller.googleCallback(
                    "g-code", state, null, null,
                    apexCallbackRequest("/api/v1/auth/google/callback"),
                    sessionWithoutTenant());

            assertThat(response.getStatusCode().value()).isEqualTo(302);
            String location = response.getHeaders().getFirst("Location");
            assertThat(location).contains("provider=GOOGLE");
            assertThat(location).contains(URLEncoder.encode(
                    OAuth2UserFacingMessages.MSG_TENANT_NOT_REGISTERED, StandardCharsets.UTF_8));
            assertThat(counterCount("GOOGLE",
                    OAuth2Controller.OAUTH2_TENANT_UNRESOLVED_REASON_STATE_DECODE_FAILED))
                    .isEqualTo(1d);
        } finally {
            detachAppender();
        }
    }

    @Test
    @DisplayName("Google: state == \"uuid-only\" (점 없음) → reason=state_missing")
    void googleCallback_stateNoDot_reasonStateMissing() {
        try {
            String state = UUID.randomUUID().toString();
            ResponseEntity<?> response = controller.googleCallback(
                    "g-code", state, null, null,
                    apexCallbackRequest("/api/v1/auth/google/callback"),
                    sessionWithoutTenant());

            assertThat(response.getStatusCode().value()).isEqualTo(302);
            assertThat(counterCount("GOOGLE",
                    OAuth2Controller.OAUTH2_TENANT_UNRESOLVED_REASON_STATE_MISSING))
                    .isEqualTo(1d);
        } finally {
            detachAppender();
        }
    }

    // ==================================================================
    // Apple — 3 reason × 1 = 3 increment
    // ==================================================================

    @Test
    @DisplayName("Apple: state == null + code != null → reason=session_only_path_missing")
    void appleCallback_stateNull_reasonSessionOnlyPathMissing() {
        try {
            ResponseEntity<?> response = controller.appleCallback(
                    "a-code", /* state */ null, /* idToken */ null, /* userJson */ null,
                    /* error */ null, /* mode */ null,
                    apexCallbackRequest("/api/v1/auth/apple/callback"),
                    sessionWithoutTenant());

            assertThat(response.getStatusCode().value()).isEqualTo(302);
            String location = response.getHeaders().getFirst("Location");
            assertThat(location).contains("provider=APPLE");
            assertThat(location).contains(URLEncoder.encode(
                    OAuth2UserFacingMessages.MSG_TENANT_NOT_REGISTERED, StandardCharsets.UTF_8));
            assertThat(counterCount("APPLE",
                    OAuth2Controller.OAUTH2_TENANT_UNRESOLVED_REASON_SESSION_ONLY_PATH_MISSING))
                    .isEqualTo(1d);
        } finally {
            detachAppender();
        }
    }

    @Test
    @DisplayName("Apple: state == \"garbage.uuid\" → reason=state_decode_failed")
    void appleCallback_stateDecodeFailed_reasonStateDecodeFailed() {
        try {
            String state = "!!!badbase!!!." + UUID.randomUUID();
            ResponseEntity<?> response = controller.appleCallback(
                    "a-code", state, null, null, null, null,
                    apexCallbackRequest("/api/v1/auth/apple/callback"),
                    sessionWithoutTenant());

            assertThat(response.getStatusCode().value()).isEqualTo(302);
            assertThat(counterCount("APPLE",
                    OAuth2Controller.OAUTH2_TENANT_UNRESOLVED_REASON_STATE_DECODE_FAILED))
                    .isEqualTo(1d);
        } finally {
            detachAppender();
        }
    }

    @Test
    @DisplayName("Apple: state == \"uuid-only\" (점 없음) → reason=state_missing")
    void appleCallback_stateNoDot_reasonStateMissing() {
        try {
            String state = UUID.randomUUID().toString();
            ResponseEntity<?> response = controller.appleCallback(
                    "a-code", state, null, null, null, null,
                    apexCallbackRequest("/api/v1/auth/apple/callback"),
                    sessionWithoutTenant());

            assertThat(response.getStatusCode().value()).isEqualTo(302);
            assertThat(counterCount("APPLE",
                    OAuth2Controller.OAUTH2_TENANT_UNRESOLVED_REASON_STATE_MISSING))
                    .isEqualTo(1d);
        } finally {
            detachAppender();
        }
    }

    // ==================================================================
    // 회귀 방어 — 정상 state (디코드 성공) 는 ERROR/WARN 분기 미도달, counter 증가 없음
    // ==================================================================

    @Test
    @DisplayName("Google: state == \"bWluZGdhcmRlbg.uuid\" (정상) → tenant 미해결 카운터 증가 0")
    void googleCallback_validComposite_doesNotIncrementUnresolvedCounter() {
        try {
            String state = composite(TENANT_ID, UUID.randomUUID().toString());
            // 후속 토큰 교환 단계는 OAuth2Service 가 mock 이라 사실상 no-op 또는 실패하지만,
            // 이 테스트는 "tenant 미해결 분기 미도달" 만 검증한다.
            try {
                controller.googleCallback("g-code", state, null, null,
                        apexCallbackRequest("/api/v1/auth/google/callback"),
                        sessionWithoutTenant());
            } catch (Exception ignored) {
                // 후속 단계의 mock 미설정으로 발생할 수 있는 예외는 본 검증 대상이 아니다.
            }
            assertThat(counterCount("GOOGLE",
                    OAuth2Controller.OAUTH2_TENANT_UNRESOLVED_REASON_STATE_MISSING)).isZero();
            assertThat(counterCount("GOOGLE",
                    OAuth2Controller.OAUTH2_TENANT_UNRESOLVED_REASON_STATE_DECODE_FAILED)).isZero();
            assertThat(counterCount("GOOGLE",
                    OAuth2Controller.OAUTH2_TENANT_UNRESOLVED_REASON_SESSION_ONLY_PATH_MISSING))
                    .isZero();
        } finally {
            detachAppender();
        }
    }

    // ==================================================================
    // 진단 필드(WARN 로그) 검증 — stateEncodedPrefix + sessionIdMasked 노출
    // ==================================================================

    @Test
    @DisplayName("WARN 로그 진단 필드: stateEncodedPrefix · sessionIdMasked 노출 + 레벨이 WARN (ERROR 아님)")
    void googleCallback_warnLog_includesDiagnosticFields() {
        try {
            String state = "!!!notbase64!!!." + UUID.randomUUID();
            controller.googleCallback("g-code", state, null, null,
                    apexCallbackRequest("/api/v1/auth/google/callback"),
                    sessionWithoutTenant());

            List<ILoggingEvent> events = logAppender.list;
            ILoggingEvent target = null;
            for (ILoggingEvent ev : events) {
                if (ev.getFormattedMessage() != null
                        && ev.getFormattedMessage().contains("tenant_id 를 찾을 수 없습니다")
                        && ev.getFormattedMessage().contains("Google")) {
                    target = ev;
                    break;
                }
            }
            assertThat(target).as("Google tenant 미해결 로그가 캡쳐되어야 한다").isNotNull();
            assertThat(target.getLevel()).as("ERROR → WARN 강등 회귀 방지").isEqualTo(Level.WARN);
            String formatted = target.getFormattedMessage();
            assertThat(formatted).contains("reason=");
            assertThat(formatted).contains("stateEncodedPrefix=");
            assertThat(formatted).contains("savedStatePresent=");
            assertThat(formatted).contains("hostSuggestsSubdomain=");
            assertThat(formatted).contains("sessionIdMasked=");
        } finally {
            detachAppender();
        }
    }

    // ==================================================================
    // 분류 헬퍼 직접 검증 — reason 매핑 단위 회귀
    // ==================================================================

    @Test
    @DisplayName("classifyOAuth2TenantUnresolvedReason: state==null + 세션 없음 → session_only_path_missing")
    void classifyReason_stateNullSessionMissing() {
        OAuth2Controller.OAuthCompositeState parsed =
                OAuth2Controller.parseCompositeOAuthState(null);
        assertThat(OAuth2Controller.classifyOAuth2TenantUnresolvedReason(null, parsed, false))
                .isEqualTo(OAuth2Controller
                        .OAUTH2_TENANT_UNRESOLVED_REASON_SESSION_ONLY_PATH_MISSING);
    }

    @Test
    @DisplayName("classifyOAuth2TenantUnresolvedReason: dot 포함 + tenant 디코드 실패 → state_decode_failed")
    void classifyReason_dotPresentDecodeFailed() {
        String s = "!!!notbase!!!." + UUID.randomUUID();
        OAuth2Controller.OAuthCompositeState parsed =
                OAuth2Controller.parseCompositeOAuthState(s);
        assertThat(parsed.tenantId).isNull();
        assertThat(OAuth2Controller.classifyOAuth2TenantUnresolvedReason(s, parsed, true))
                .isEqualTo(OAuth2Controller
                        .OAUTH2_TENANT_UNRESOLVED_REASON_STATE_DECODE_FAILED);
    }

    @Test
    @DisplayName("classifyOAuth2TenantUnresolvedReason: dot 미포함 → state_missing")
    void classifyReason_noDot() {
        String s = UUID.randomUUID().toString();
        OAuth2Controller.OAuthCompositeState parsed =
                OAuth2Controller.parseCompositeOAuthState(s);
        assertThat(OAuth2Controller.classifyOAuth2TenantUnresolvedReason(s, parsed, false))
                .isEqualTo(OAuth2Controller.OAUTH2_TENANT_UNRESOLVED_REASON_STATE_MISSING);
    }

    @Test
    @DisplayName("maskSessionIdForLog: 6자 초과는 첫 6자 + \"...\"")
    void maskSessionIdForLog_truncates() {
        assertThat(OAuth2Controller.maskSessionIdForLog("ABCDEF1234567890"))
                .isEqualTo("ABCDEF...");
        assertThat(OAuth2Controller.maskSessionIdForLog(null)).isEqualTo("<no-session>");
        assertThat(OAuth2Controller.maskSessionIdForLog("")).isEqualTo("<no-session>");
    }
}
