package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * 로컬 BE(전체 컨텍스트 · 실제 보안 필터 · H2) 세션 E2E.
 *
 * <p>비밀번호 로그인(CLIENT/CONSULTANT) 과 SNS/OAuth·Apple·Passkey 발급 경로(동일 JwtService 훅,
 * OAuth 웹 콜백의 중복 로그인 정리 포함)를 같은 시계로 검증한다. override 120초, 실제 130초 유휴.
 * 시간이 걸리므로 {@code -Dgroups=local-e2e} 로만 실행한다.</p>
 */
@Tag("local-e2e")
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "session.idle.test-override-seconds=120")
@DisplayName("로컬 BE — 로그인 유지 · session-info 120 · 130초 유휴 후 401 redirectToLogin")
class BearerIdleSessionLocalE2EIntegrationTest {

    private static final String PASSWORD = "Local-e2e-Pw1!";
    private static final long IDLE_MILLIS = 130_000L;
    private static final int PARALLEL = 6;

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;
    @Autowired private UserSessionService userSessionService;
    @Autowired private com.coresolution.consultation.service.BearerIdleSessionService bearerIdleSessionService;

    private final String tenantId = "e2e-" + UUID.randomUUID().toString().replace("-", "").substring(0, 26);

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void allLoginPaths_staySignedIn_thenIdle401() throws Exception {
        Map<String, String> tokens = new LinkedHashMap<>();
        User client = saveUser(UserRole.CLIENT);
        User consultant = saveUser(UserRole.CONSULTANT);
        tokens.put("password/CLIENT", passwordLogin(client));
        tokens.put("password/CONSULTANT", passwordLogin(consultant));
        tokens.put("oauth-web/CLIENT", oauthWebCallbackToken(saveUser(UserRole.CLIENT)));
        tokens.put("apple/CLIENT", serviceIssuedToken(saveUser(UserRole.CLIENT), true));
        tokens.put("passkey/CONSULTANT", serviceIssuedToken(saveUser(UserRole.CONSULTANT), false));

        for (Map.Entry<String, String> e : tokens.entrySet()) {
            List<Integer> codes = parallelCurrentUser(e.getValue());
            System.out.printf("[local-e2e] %s parallel=%s%n", e.getKey(), codes);
            assertThat(codes).as(e.getKey()).containsOnly(200);
            int ttl = sessionInfoTtl(e.getValue());
            System.out.printf("[local-e2e] %s session-info maxInactiveInterval=%d%n", e.getKey(), ttl);
            assertThat(ttl).as(e.getKey()).isEqualTo(120);
            String sid = jwtService.extractSessionId(e.getValue());
            boolean rawStored = userSessionService.getActiveSession(sid) != null;
            boolean keyStored = userSessionService.getActiveSession(
                    bearerIdleSessionService.toServerSessionKey(sid)) != null;
            int cookieStatus = sidAsJsessionIdStatus(sid);
            System.out.printf("[local-e2e] %s rawSidStored=%s serverKeyStored=%s sidAsJSESSIONID=%d%n",
                    e.getKey(), rawStored, keyStored, cookieStatus);
            assertThat(rawStored).as(e.getKey() + " raw sid 미저장").isFalse();
            assertThat(keyStored).as(e.getKey() + " 서버 키 저장").isTrue();
            assertThat(cookieStatus).as(e.getKey() + " sid→JSESSIONID").isEqualTo(401);
        }

        Thread.sleep(IDLE_MILLIS);

        for (Map.Entry<String, String> e : tokens.entrySet()) {
            MvcResult r = mockMvc.perform(get("/api/v1/auth/current-user")
                    .header("Authorization", "Bearer " + e.getValue())
                    .header("X-Tenant-Id", tenantId)).andReturn();
            String body = r.getResponse().getContentAsString();
            System.out.printf("[local-e2e] %s after130s status=%d body=%s%n",
                    e.getKey(), r.getResponse().getStatus(), body);
            assertThat(r.getResponse().getStatus()).as(e.getKey()).isEqualTo(401);
            assertThat(objectMapper.readTree(body).path("redirectToLogin").asBoolean()).as(e.getKey()).isTrue();
            int cookieStatus = sidAsJsessionIdStatus(jwtService.extractSessionId(e.getValue()));
            System.out.printf("[local-e2e] %s expired sid as JSESSIONID status=%d%n", e.getKey(), cookieStatus);
            assertThat(cookieStatus).as(e.getKey() + " 만료 sid→JSESSIONID").isEqualTo(401);
        }
    }

    /** 만료/활성 Access JWT sid 를 JSESSIONID 쿠키로만 보낸다(Bearer 없음). */
    private int sidAsJsessionIdStatus(String sid) throws Exception {
        return mockMvc.perform(get("/api/v1/auth/current-user")
                .cookie(new jakarta.servlet.http.Cookie("JSESSIONID", sid))
                .header("X-Tenant-Id", tenantId)).andReturn().getResponse().getStatus();
    }

    private User saveUser(UserRole role) {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        User user = new User();
        user.setTenantId(tenantId);
        user.setUserId("e2e-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("e2e-" + suffix + "@example.test");
        user.setPassword(passwordEncoder.encode(PASSWORD));
        user.setName("E2E" + suffix);
        user.setRole(role);
        user.setIsDeleted(false);
        user.setIsActive(true);
        user.setIsPasswordChanged(true);
        return userRepository.saveAndFlush(user);
    }

    private String passwordLogin(User user) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("email", user.getEmail(), "password", PASSWORD));
        MvcResult r = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON).content(body)
                .header("X-Tenant-Id", tenantId)).andReturn();
        String resp = r.getResponse().getContentAsString();
        JsonNode root = objectMapper.readTree(resp);
        String token = root.path("data").path("accessToken").asText(root.path("data").path("token").asText(""));
        assertThat(token).as("login " + r.getResponse().getStatus() + " " + resp).isNotBlank();
        return token;
    }

    /** OAuth 웹 콜백: mint → persistOAuthDbUserSession(중복 로그인 정리) 순서를 그대로 재현. */
    private String oauthWebCallbackToken(User user) {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("User-Agent", "local-e2e-oauth");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(req));
        TenantContextHolder.setTenantId(tenantId);
        try {
            String token = jwtService.generateTokenForOAuth(user, List.of());
            userSessionService.deactivateOtherSessionsForTenantUser(tenantId, user.getId(),
                    "http-session-" + UUID.randomUUID(), SessionManagementConstants.END_REASON_DUPLICATE_LOGIN);
            jwtService.reassertIssuedAccessSessions(user);
            return token;
        } finally {
            RequestContextHolder.resetRequestAttributes();
            TenantContextHolder.clear();
        }
    }

    /** Apple(generateTokenForOAuth(User)) · Passkey(generateToken(User)) 서비스 발급 경로. */
    private String serviceIssuedToken(User user, boolean oauth) {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("User-Agent", "local-e2e-svc");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(req));
        TenantContextHolder.setTenantId(tenantId);
        try {
            return oauth ? jwtService.generateTokenForOAuth(user) : jwtService.generateToken(user);
        } finally {
            RequestContextHolder.resetRequestAttributes();
            TenantContextHolder.clear();
        }
    }

    private List<Integer> parallelCurrentUser(String token) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(PARALLEL);
        try {
            List<Callable<Integer>> calls = new ArrayList<>();
            for (int i = 0; i < PARALLEL; i++) {
                calls.add(() -> mockMvc.perform(get("/api/v1/auth/current-user")
                        .header("Authorization", "Bearer " + token)
                        .header("X-Tenant-Id", tenantId)).andReturn().getResponse().getStatus());
            }
            List<Integer> codes = new ArrayList<>();
            for (Future<Integer> f : pool.invokeAll(calls)) {
                codes.add(f.get());
            }
            return codes;
        } finally {
            pool.shutdownNow();
        }
    }

    private int sessionInfoTtl(String token) throws Exception {
        MvcResult r = mockMvc.perform(get("/api/v1/auth/session-info")
                .header("Authorization", "Bearer " + token)
                .header("X-Tenant-Id", tenantId)).andReturn();
        return objectMapper.readTree(r.getResponse().getContentAsString())
                .path("data").path("maxInactiveInterval").asInt(-1);
    }
}
